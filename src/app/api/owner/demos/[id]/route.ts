import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** PATCH /api/owner/demos/[id] — Update demo request (confirm staff, schedule, complete, report) */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const demoId = params.id
    try {
        const body = await request.json()
        const {
            action, // 'confirm_staff' | 'schedule' | 'complete' | 'reschedule' | 'cancel'
            assigned_staff_id,
            scheduled_at,
            meeting_link,
            outcome,
            interest_level,
            demo_notes,
            deal_probability
        } = body

        // Fetch existing demo request
        const { data: demo, error: fetchErr } = await supabaseAdmin
            .from('lead_demo_requests')
            .select('*, lead:lead_id(id, name, organization, email)')
            .eq('id', demoId)
            .single()

        if (fetchErr || !demo) return NextResponse.json({ error: 'Demo request not found.' }, { status: 404 })

        const updateData: Record<string, any> = {}

        if (action === 'confirm_staff') {
            const staffToAssign = assigned_staff_id || demo.suggested_staff_id
            if (!staffToAssign) return NextResponse.json({ error: 'No staff member selected for assignment.' }, { status: 400 })

            updateData.assigned_staff_id = staffToAssign
            updateData.confirmed_by = user.id
            updateData.confirmed_at = new Date().toISOString()
            updateData.status = 'confirmed'

            // Create task for assigned staff member
            await supabaseAdmin.from('platform_tasks').insert({
                task_type: 'demo_scheduling',
                title: `Schedule & Conduct Demo for ${demo.lead?.organization || demo.lead?.name || 'Prospect'}`,
                description: `Confirmed staff member for demo. Please coordinate with client and set schedule/link.`,
                lead_id: demo.lead_id,
                demo_request_id: demo.id,
                assigned_to: staffToAssign,
                created_by: user.id,
                due_at: demo.sla_deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                priority: 'high',
                sla_minutes: 1440
            })

            // Log timeline event
            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id: demo.lead_id,
                event_type: 'demo_staff_confirmed',
                event_label: 'Demo Staff Confirmed',
                description: `Staff confirmed by Owner/Manager`,
                staff_id: user.id,
                metadata: { demo_id: demoId, assigned_staff_id: staffToAssign }
            })
        } else if (action === 'schedule') {
            if (!scheduled_at) return NextResponse.json({ error: 'Scheduled date and time are required.' }, { status: 400 })

            updateData.scheduled_at = new Date(scheduled_at).toISOString()
            if (meeting_link !== undefined) updateData.meeting_link = meeting_link
            updateData.status = 'scheduled'

            if (assigned_staff_id) updateData.assigned_staff_id = assigned_staff_id

            // Update lead status
            await supabaseAdmin
                .from('owner_leads')
                .update({ status: 'demo_scheduled' })
                .eq('id', demo.lead_id)

            // Timeline
            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id: demo.lead_id,
                event_type: 'demo_scheduled',
                event_label: 'Demo Scheduled',
                description: `Scheduled for ${new Date(scheduled_at).toLocaleString('en-IN')}`,
                staff_id: user.id,
                metadata: { scheduled_at, meeting_link }
            })
        } else if (action === 'complete') {
            if (!outcome) return NextResponse.json({ error: 'Demo outcome is required to complete.' }, { status: 400 })

            updateData.completed_at = new Date().toISOString()
            updateData.outcome = outcome
            updateData.status = 'completed'
            if (interest_level !== undefined) updateData.interest_level = interest_level
            if (demo_notes !== undefined) updateData.demo_notes = demo_notes
            if (deal_probability !== undefined) updateData.deal_probability = deal_probability

            // Update lead status based on outcome
            let newLeadStatus = 'demo_completed'
            if (outcome === 'closed_won') newLeadStatus = 'converted'
            else if (outcome === 'closed_lost') newLeadStatus = 'lost'

            await supabaseAdmin
                .from('owner_leads')
                .update({ status: newLeadStatus })
                .eq('id', demo.lead_id)

            // Timeline
            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id: demo.lead_id,
                event_type: 'demo_completed',
                event_label: `Demo Completed — ${outcome}`,
                description: demo_notes || 'Demo completed successfully',
                staff_id: user.id,
                metadata: { outcome, interest_level, deal_probability }
            })
        } else if (action === 'cancel') {
            updateData.status = 'cancelled'

            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id: demo.lead_id,
                event_type: 'demo_cancelled',
                event_label: 'Demo Cancelled',
                staff_id: user.id,
            })
        } else {
            // General update fallback
            if (assigned_staff_id !== undefined) updateData.assigned_staff_id = assigned_staff_id
            if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at ? new Date(scheduled_at).toISOString() : null
            if (meeting_link !== undefined) updateData.meeting_link = meeting_link
            if (outcome !== undefined) updateData.outcome = outcome
            if (interest_level !== undefined) updateData.interest_level = interest_level
            if (demo_notes !== undefined) updateData.demo_notes = demo_notes
            if (deal_probability !== undefined) updateData.deal_probability = deal_probability
        }

        const { data: updatedDemo, error: updateErr } = await supabaseAdmin
            .from('lead_demo_requests')
            .update(updateData)
            .eq('id', demoId)
            .select(`
                *,
                lead:lead_id(id, name, organization, email, phone),
                suggested_staff:suggested_staff_id(id, first_name, last_name, email, role),
                assigned_staff:assigned_staff_id(id, first_name, last_name, email, role)
            `)
            .single()

        if (updateErr) return NextResponse.json({ error: 'Failed to update demo request.' }, { status: 500 })

        return NextResponse.json({ demo: updatedDemo })
    } catch (err: any) {
        console.error('PATCH /api/owner/demos/[id] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
