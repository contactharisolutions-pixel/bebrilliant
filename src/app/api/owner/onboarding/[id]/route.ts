import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/onboarding/[id] — Full onboarding detail with comments, milestones, timeline */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const [checklistRes, commentsRes, milestonesRes, timelineRes] = await Promise.all([
        supabaseAdmin.from('onboarding_checklists').select('*').eq('id', id).single(),
        supabaseAdmin.from('onboarding_comments')
            .select('*, created_by_profile:created_by(id, first_name, last_name, avatar_url, role)')
            .eq('checklist_id', id)
            .order('created_at', { ascending: true }),
        supabaseAdmin.from('onboarding_milestones')
            .select('*')
            .eq('checklist_id', id)
            .order('target_date', { ascending: true }),
        supabaseAdmin.from('onboarding_timeline_events')
            .select('*, created_by_profile:created_by(id, first_name, last_name)')
            .eq('checklist_id', id)
            .order('created_at', { ascending: false })
            .limit(50),
    ])

    if (!checklistRes.data) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })

    const checklist = checklistRes.data

    // Resolve tenant and staff
    const [tenantRes, staffRes, secStaffRes] = await Promise.all([
        checklist.tenant_id ? supabaseAdmin.from('tenants').select('id, name, type, tenant_type, email, is_active').eq('id', checklist.tenant_id).single() : Promise.resolve({ data: null }),
        checklist.assigned_staff_id ? supabaseAdmin.from('user_profiles').select('id, first_name, last_name, email, role').eq('id', checklist.assigned_staff_id).single() : Promise.resolve({ data: null }),
        checklist.secondary_staff_ids?.length > 0 ? supabaseAdmin.from('user_profiles').select('id, first_name, last_name, email, role').in('id', checklist.secondary_staff_ids) : Promise.resolve({ data: [] }),
    ])

    return NextResponse.json({
        ...checklist,
        tenant: tenantRes.data,
        assigned_staff: staffRes.data,
        secondary_staff: secStaffRes.data ?? [],
        comments: commentsRes.data ?? [],
        milestones: milestonesRes.data ?? [],
        timeline: timelineRes.data ?? [],
    })
}

/** PATCH /api/owner/onboarding/[id] — Update checklist metadata */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const body = await request.json()
    const allowed = [
        'tasks', 'assigned_staff_id', 'secondary_staff_ids', 'notes',
        'lifecycle_stage', 'expected_completion_date', 'go_live_date',
        'health_score', 'churn_risk_level', 'sla_days',
    ]

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    allowed.forEach(key => { if (body[key] !== undefined) updates[key] = body[key] })

    const { data, error } = await supabaseAdmin
        .from('onboarding_checklists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })

    return NextResponse.json({ checklist: data })
}
