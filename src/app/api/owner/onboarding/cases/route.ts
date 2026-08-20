import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

const ONBOARDING_STAGES = [
    'assigned', 'kickoff', 'account_setup', 'data_setup',
    'configuration', 'quality_check', 'customer_review',
    'ready_for_training', 'completed'
]

const DEFAULT_STAGE_CHECKLISTS: Record<string, string[]> = {
    assigned: ['Initial case review', 'Assign onboarding specialist', 'Set target completion date'],
    kickoff: ['Schedule kickoff meeting', 'Identify key stakeholders', 'Confirm software requirement checklist'],
    account_setup: ['Create tenant account profile', 'Provision admin credentials', 'Configure subscription plan & limits'],
    data_setup: ['Import master data (teachers & students)', 'Verify data integrity & relationships'],
    configuration: ['Configure branding & custom domain', 'Setup academic structure & courses', 'Configure notification rules'],
    quality_check: ['Internal system validation test', 'Verify permissions & security scopes'],
    customer_review: ['Conduct customer review walkthrough', 'Gather customer feedback & signoff'],
    ready_for_training: ['Prepare training hand-off case', 'Notify training department']
}

/** GET /api/owner/onboarding/cases — List all onboarding cases */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage') || 'all'
    const search = searchParams.get('search') || ''

    try {
        let query = supabaseAdmin
            .from('onboarding_cases')
            .select(`
                *,
                assigned_staff:assigned_staff_id(id, first_name, last_name, email, role),
                checklists:onboarding_checklists(*)
            `)
            .order('created_at', { ascending: false })

        if (stage !== 'all') query = query.eq('stage', stage)
        if (search) query = query.or(`organization_name.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`)

        const { data: cases, error } = await query
        if (error) {
            console.error('GET /api/owner/onboarding/cases error:', error)
            return NextResponse.json({ error: 'Failed to fetch onboarding cases.' }, { status: 500 })
        }

        // Get stage counts for tab badges
        const { data: stageRows } = await supabaseAdmin.from('onboarding_cases').select('stage')
        const stageCounts: Record<string, number> = {}
        for (const row of stageRows ?? []) {
            stageCounts[row.stage] = (stageCounts[row.stage] ?? 0) + 1
        }

        return NextResponse.json({ cases: cases ?? [], stageCounts })
    } catch (err: any) {
        console.error('GET /onboarding/cases crash:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** POST /api/owner/onboarding/cases — Create a new onboarding case */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { tenant_id, lead_id, organization_name, contact_name, contact_email, contact_phone, assigned_staff_id, target_completion_date } = body

        if (!organization_name) {
            return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })
        }

        // Auto-suggest onboarding staff if not specified (workload matching)
        let staffToAssign = assigned_staff_id
        if (!staffToAssign) {
            const { data: staffMembers } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .in('role', ['onboarding_spec', 'platform_staff', 'admin'])
                .eq('is_active', true)
            if (staffMembers && staffMembers.length > 0) {
                staffToAssign = staffMembers[0].id // First available active onboarding staff
            }
        }

        const targetDate = target_completion_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const slaDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const { data: obCase, error } = await supabaseAdmin
            .from('onboarding_cases')
            .insert({
                tenant_id: tenant_id || null,
                lead_id: lead_id || null,
                organization_name,
                contact_name: contact_name || null,
                contact_email: contact_email || null,
                contact_phone: contact_phone || null,
                assigned_staff_id: staffToAssign || null,
                assigned_at: staffToAssign ? new Date().toISOString() : null,
                stage: 'assigned',
                stage_progress_pct: 12,
                target_completion_date: targetDate,
                sla_deadline: slaDeadline,
            })
            .select()
            .single()

        if (error || !obCase) {
            console.error('Failed to insert onboarding case:', error)
            return NextResponse.json({ error: 'Failed to create onboarding case.' }, { status: 500 })
        }

        // Seed initial checklists for stage 1 (assigned) and stage 2 (kickoff)
        const checklistInserts: any[] = []
        for (const [st, tasks] of Object.entries(DEFAULT_STAGE_CHECKLISTS)) {
            for (const task_name of tasks) {
                checklistInserts.push({
                    case_id: obCase.id,
                    stage: st,
                    task_name,
                    is_completed: false
                })
            }
        }
        await supabaseAdmin.from('onboarding_checklists').insert(checklistInserts)

        // Log timeline if lead_id exists
        if (lead_id) {
            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id,
                event_type: 'onboarding_started',
                event_label: 'Onboarding Case Started',
                description: `Onboarding started for ${organization_name}`,
                staff_id: user.id,
                metadata: { case_id: obCase.id, assigned_staff_id: staffToAssign }
            })
        }

        return NextResponse.json({ obCase }, { status: 201 })
    } catch (err: any) {
        console.error('POST /onboarding/cases error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
