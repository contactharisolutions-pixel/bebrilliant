import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/leads/bulk — Bulk actions on multiple leads */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { action, lead_ids, payload } = body

        if (!action || !Array.isArray(lead_ids) || lead_ids.length === 0) {
            return NextResponse.json({ error: 'action and lead_ids array are required' }, { status: 400 })
        }

        const VALID_ACTIONS = ['status_change', 'stage_change', 'assign', 'delete', 'tag_add', 'tag_remove']
        if (!VALID_ACTIONS.includes(action)) {
            return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 })
        }

        let affected = 0

        if (action === 'delete') {
            const { count } = await supabaseAdmin.from('owner_leads').delete().in('id', lead_ids)
            affected = count ?? lead_ids.length
        } else if (action === 'status_change' && payload?.status) {
            const { count } = await supabaseAdmin
                .from('owner_leads')
                .update({ status: payload.status, updated_at: new Date().toISOString() })
                .in('id', lead_ids)
            affected = count ?? lead_ids.length
        } else if (action === 'assign' && payload?.assigned_to !== undefined) {
            const { count } = await supabaseAdmin
                .from('owner_leads')
                .update({ assigned_to: payload.assigned_to, allocated_at: new Date().toISOString() })
                .in('id', lead_ids)
            affected = count ?? lead_ids.length
        } else if (action === 'stage_change' && payload?.stage_id) {
            const { count } = await supabaseAdmin
                .from('owner_leads')
                .update({ stage_id: payload.stage_id, updated_at: new Date().toISOString() })
                .in('id', lead_ids)
            affected = count ?? lead_ids.length
        }

        // Log bulk activity for each affected lead
        if (action !== 'delete' && affected > 0) {
            const activities = lead_ids.map(id => ({
                lead_id: id,
                type: action,
                content: `Bulk ${action.replace('_', ' ')}: ${JSON.stringify(payload)}`,
                created_by: user.id,
            }))
            await supabaseAdmin.from('lead_activities').insert(activities)
        }

        return NextResponse.json({ success: true, affected })
    } catch (err: any) {
        console.error('POST /crm/leads/bulk error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
