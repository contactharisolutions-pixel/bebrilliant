import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/**
 * POST /api/owner/crm/leads/[id]/demo
 * Schedule a demo for a CRM lead.
 * Updates lead status to 'demo_scheduled' and inserts a demos record.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { scheduled_at, notes, conducted_by } = body

    if (!scheduled_at) {
        return NextResponse.json({ error: 'scheduled_at is required' }, { status: 400 })
    }

    // Verify the lead exists
    const { data: lead, error: leadError } = await supabaseAdmin
        .from('owner_leads')
        .select('id, status')
        .eq('id', id)
        .single()

    if (leadError || !lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Update lead status to demo_scheduled
    const { error: updateError } = await supabaseAdmin
        .from('owner_leads')
        .update({ status: 'demo_scheduled', updated_at: new Date().toISOString() })
        .eq('id', id)

    if (updateError) {
        return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 })
    }

    // Insert the demo record
    const { data: demo, error: demoError } = await supabaseAdmin
        .from('demos')
        .insert({
            lead_id: id,
            scheduled_at,
            notes: notes || '',
            status: 'scheduled',
            conducted_by: conducted_by || null,
        })
        .select()
        .single()

    if (demoError) {
        return NextResponse.json({ error: 'Failed to schedule demo' }, { status: 500 })
    }

    // Log activity on the lead
    await supabaseAdmin
        .from('lead_activities')
        .insert({
            lead_id: id,
            type: 'meeting',
            content: `Demo scheduled for ${new Date(scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
            metadata: { demo_id: demo.id, scheduled_at, conducted_by },
            created_by: user.id,
        })

    return NextResponse.json({ demo }, { status: 201 })
}

/**
 * GET /api/owner/crm/leads/[id]/demo
 * List all demos scheduled for a lead.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('demos')
        .select('*')
        .eq('lead_id', id)
        .order('scheduled_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to load demos' }, { status: 500 })

    return NextResponse.json({ demos: data ?? [] })
}

/**
 * PATCH /api/owner/crm/leads/[id]/demo
 * Update demo status (e.g. mark as completed).
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { demo_id, status, notes } = body

    if (!demo_id) return NextResponse.json({ error: 'demo_id is required' }, { status: 400 })

    const updateData: any = { updated_at: new Date().toISOString() }
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()

        // Move lead to demo_completed stage
        await supabaseAdmin
            .from('owner_leads')
            .update({ status: 'demo_completed', updated_at: new Date().toISOString() })
            .eq('id', id)

        // Log activity
        await supabaseAdmin
            .from('lead_activities')
            .insert({
                lead_id: id,
                type: 'meeting',
                content: 'Demo completed successfully',
                metadata: { demo_id },
                created_by: user.id,
            })
    }

    const { data, error } = await supabaseAdmin
        .from('demos')
        .update(updateData)
        .eq('id', demo_id)
        .eq('lead_id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to update demo' }, { status: 500 })

    return NextResponse.json({ demo: data })
}
