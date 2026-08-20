import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/training — List all training cases */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''

    try {
        let query = supabaseAdmin
            .from('training_cases')
            .select(`
                *,
                assigned_trainer:assigned_trainer_id(id, first_name, last_name, email, role),
                sessions:training_sessions(*)
            `)
            .order('created_at', { ascending: false })

        if (status !== 'all') query = query.eq('status', status)
        if (search) query = query.or(`organization_name.ilike.%${search}%`)

        const { data: cases, error } = await query
        if (error) {
            console.error('GET /api/owner/training error:', error)
            return NextResponse.json({ error: 'Failed to fetch training cases.' }, { status: 500 })
        }

        // Count by status
        const { data: statusRows } = await supabaseAdmin.from('training_cases').select('status')
        const statusCounts: Record<string, number> = {}
        for (const row of statusRows ?? []) {
            statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1
        }

        return NextResponse.json({ cases: cases ?? [], statusCounts })
    } catch (err: any) {
        console.error('GET /training crash:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** POST /api/owner/training — Create a new training case */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { onboarding_case_id, tenant_id, lead_id, organization_name, assigned_trainer_id, training_type } = body

        if (!organization_name) {
            return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })
        }

        const slaDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: tc, error } = await supabaseAdmin
            .from('training_cases')
            .insert({
                onboarding_case_id: onboarding_case_id || null,
                tenant_id: tenant_id || null,
                lead_id: lead_id || null,
                organization_name,
                assigned_trainer_id: assigned_trainer_id || null,
                status: assigned_trainer_id ? 'trainer_assigned' : 'pending_trainer',
                training_type: training_type || 'full_pack',
                sla_deadline: slaDeadline,
            })
            .select()
            .single()

        if (error || !tc) {
            console.error('Failed to insert training case:', error)
            return NextResponse.json({ error: 'Failed to create training case.' }, { status: 500 })
        }

        if (lead_id) {
            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id,
                event_type: 'training_case_created',
                event_label: 'Training Case Created',
                description: `Training case created for ${organization_name}`,
                staff_id: user.id,
            })
        }

        return NextResponse.json({ trainingCase: tc }, { status: 201 })
    } catch (err: any) {
        console.error('POST /training error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
