import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

const VALID_OUTCOMES = [
    'connected', 'not_reachable', 'call_back_later',
    'not_interested', 'qualified', 'demo_required',
    'follow_up_required', 'invalid_lead'
]

/** POST /api/owner/crm/leads/[id]/call — Log a call activity for a lead */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = params.id
    try {
        const body = await request.json()
        const {
            outcome, notes, customer_requirement, demo_interest,
            preferred_demo_date, preferred_demo_time, demo_type,
            next_followup_date, duration_mins, call_number
        } = body

        if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
            return NextResponse.json({ error: 'A valid call outcome is required.' }, { status: 400 })
        }

        // Verify lead exists
        const { data: lead, error: leadErr } = await supabaseAdmin
            .from('owner_leads')
            .select('id, name, organization, status')
            .eq('id', id)
            .single()

        if (leadErr || !lead) return NextResponse.json({ error: 'Lead not found.' }, { status: 404 })

        // Get current call count for this lead
        const { count: existingCalls } = await supabaseAdmin
            .from('lead_call_logs')
            .select('id', { count: 'exact' })
            .eq('lead_id', id)

        // Insert call log
        const { data: callLog, error: callErr } = await supabaseAdmin
            .from('lead_call_logs')
            .insert({
                lead_id: id,
                staff_id: user.id,
                call_number: call_number ?? (existingCalls ?? 0) + 1,
                outcome,
                notes: notes || null,
                customer_requirement: customer_requirement || null,
                demo_interest: demo_interest ?? (outcome === 'demo_required'),
                preferred_demo_date: preferred_demo_date || null,
                preferred_demo_time: preferred_demo_time || null,
                demo_type: demo_type || null,
                next_followup_date: next_followup_date || null,
                duration_mins: duration_mins || null,
            })
            .select()
            .single()

        if (callErr || !callLog) {
            console.error('Call log insert error:', callErr)
            return NextResponse.json({ error: 'Failed to save call log.' }, { status: 500 })
        }

        // Map outcome → new lead status
        const statusMap: Record<string, string> = {
            connected:           'contacted',
            not_reachable:       lead.status,
            call_back_later:     lead.status,
            not_interested:      'lost',
            qualified:           'contacted',
            demo_required:       'contacted',
            follow_up_required:  lead.status,
            invalid_lead:        'lost',
        }
        const newStatus = statusMap[outcome] ?? lead.status

        // Update lead status
        await supabaseAdmin
            .from('owner_leads')
            .update({ status: newStatus, last_activity_at: new Date().toISOString() })
            .eq('id', id)

        // Log to lifecycle timeline
        await supabaseAdmin.from('lifecycle_timeline').insert({
            lead_id: id,
            event_type: 'call_logged',
            event_label: `Call Logged — ${outcomeLabel(outcome)}`,
            description: notes || null,
            staff_id: user.id,
            metadata: { outcome, call_number: callLog.call_number }
        })

        // Create task for next follow-up if needed
        if (next_followup_date && outcome === 'call_back_later') {
            await supabaseAdmin.from('platform_tasks').insert({
                task_type: 'follow_up',
                title: `Follow-up call: ${lead.name} (${lead.organization})`,
                lead_id: id,
                assigned_to: user.id,
                created_by: user.id,
                due_at: new Date(next_followup_date).toISOString(),
                priority: 'medium',
                sla_minutes: 60 * 24,
            })
        }

        // Auto-create demo request if outcome requires it
        let demoRequest = null
        if (outcome === 'demo_required' || (demo_interest && preferred_demo_date)) {
            const slaDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            const { data: dr } = await supabaseAdmin
                .from('lead_demo_requests')
                .insert({
                    lead_id: id,
                    call_log_id: callLog.id,
                    demo_type: demo_type || 'online',
                    preferred_date: preferred_demo_date || null,
                    preferred_time: preferred_demo_time || null,
                    status: 'pending_assignment',
                    sla_deadline: slaDeadline,
                })
                .select()
                .single()

            demoRequest = dr

            // Timeline event
            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id: id,
                event_type: 'demo_requested',
                event_label: 'Demo Request Created',
                description: `${demo_type === 'on_site' ? 'On-site' : 'Online'} demo requested`,
                staff_id: user.id,
                metadata: { demo_type, preferred_date: preferred_demo_date }
            })

            // Update lead stage
            await supabaseAdmin
                .from('owner_leads')
                .update({ status: 'demo_scheduled' })
                .eq('id', id)
        }

        return NextResponse.json({
            success: true,
            call_log: callLog,
            demo_request: demoRequest,
            new_lead_status: newStatus,
        }, { status: 201 })

    } catch (err: any) {
        console.error('POST /crm/leads/[id]/call error:', err)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
}

/** GET /api/owner/crm/leads/[id]/call — List call logs for a lead */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('lead_call_logs')
        .select('*, staff:staff_id(first_name, last_name, email)')
        .eq('lead_id', params.id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to load call logs.' }, { status: 500 })
    return NextResponse.json({ call_logs: data ?? [] })
}

function outcomeLabel(outcome: string): string {
    const labels: Record<string, string> = {
        connected: 'Connected', not_reachable: 'Not Reachable',
        call_back_later: 'Call Back Later', not_interested: 'Not Interested',
        qualified: 'Qualified', demo_required: 'Demo Required',
        follow_up_required: 'Follow-up Required', invalid_lead: 'Invalid Lead',
    }
    return labels[outcome] ?? outcome
}
