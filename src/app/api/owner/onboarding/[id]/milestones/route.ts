import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/onboarding/[id]/milestones — Get milestone dates */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const { data, error } = await supabaseAdmin
        .from('onboarding_milestones')
        .select('*')
        .eq('checklist_id', id)
        .order('target_date', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to load milestones' }, { status: 500 })

    return NextResponse.json({ milestones: data ?? [] })
}

/** POST /api/owner/onboarding/[id]/milestones — Create a milestone */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const body = await request.json()
    const { name, description, target_date } = body

    if (!name || !target_date) return NextResponse.json({ error: 'name and target_date are required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('onboarding_milestones')
        .insert({ checklist_id: id, name, description, target_date })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })

    return NextResponse.json({ milestone: data }, { status: 201 })
}

/** PATCH /api/owner/onboarding/[id]/milestones — Mark a milestone as complete */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const body = await request.json()
    const { milestone_id, completed } = body

    if (!milestone_id) return NextResponse.json({ error: 'milestone_id is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('onboarding_milestones')
        .update({
            completed_at: completed ? new Date().toISOString() : null,
            completed_by: completed ? user.id : null,
        })
        .eq('id', milestone_id)
        .eq('checklist_id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })

    if (completed) {
        await supabaseAdmin.from('onboarding_timeline_events').insert({
            checklist_id: id,
            type: 'milestone_reached',
            payload: { milestone_id, name: data.name },
            created_by: user.id,
        })
    }

    return NextResponse.json({ milestone: data })
}
