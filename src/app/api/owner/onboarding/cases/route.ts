import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export const COMPACT_STAGES = ['provisioning', 'data_setup', 'configuration', 'handover', 'completed'] as const
export type CompactStage = typeof COMPACT_STAGES[number]

export const LEGACY_STAGE_MAP: Record<string, CompactStage> = {
    assigned: 'provisioning',
    kickoff: 'provisioning',
    account_setup: 'provisioning',
    data_setup: 'data_setup',
    configuration: 'configuration',
    quality_check: 'configuration',
    customer_review: 'handover',
    ready_for_training: 'handover',
    handover: 'handover',
    completed: 'completed',
}

export function normalizeStage(stage: string): CompactStage {
    return LEGACY_STAGE_MAP[stage] || (COMPACT_STAGES.includes(stage as any) ? (stage as CompactStage) : 'provisioning')
}

export const DEFAULT_STAGE_CHECKLISTS: Record<string, string[]> = {
    provisioning: [
        'Kickoff briefing & stakeholder identification',
        'Tenant database & school subdomain routing provisioned',
        'School super-admin initial credentials dispatched'
    ],
    data_setup: [
        'Academic calendar & term dates established',
        'Grade tiers (Grades 1–12) and section groupings defined',
        'Faculty & student baseline master roster imported'
    ],
    configuration: [
        'School branding, crest & color palette configured',
        'Curriculum framework & subject matrix configured',
        'Assessment & CBT examination engines enabled'
    ],
    handover: [
        'End-to-end data & security verification audit passed',
        'Executive stakeholder walkthrough & customer acceptance signoff',
        'Training case scheduled and handoff package dispatched'
    ]
}

export const STAGE_PROGRESS_MAP: Record<string, number> = {
    provisioning: 25,
    data_setup: 50,
    configuration: 75,
    handover: 90,
    completed: 100
}

/** GET /api/owner/onboarding/cases — List all onboarding cases with compact 4-stage metadata */
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

        if (search) {
            query = query.or(`organization_name.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`)
        }

        const { data: cases, error } = await query
        if (error) {
            console.error('GET /api/owner/onboarding/cases error:', error)
            return NextResponse.json({ error: 'Failed to fetch onboarding cases.' }, { status: 500 })
        }

        // Normalize stage and ensure setup_state for every case
        const normalizedCases = (cases ?? []).map(c => {
            const normStage = normalizeStage(c.stage)
            let checklists = c.checklists || []
            if (checklists.length === 0) {
                checklists = []
                for (const [st, tasks] of Object.entries(DEFAULT_STAGE_CHECKLISTS)) {
                    for (const task_name of tasks) {
                        checklists.push({
                            id: `gen-${c.id}-${st}-${task_name.substring(0, 8)}`,
                            case_id: c.id,
                            stage: st,
                            task_name,
                            is_completed: false
                        })
                    }
                }
            }
            return {
                ...c,
                stage: normStage,
                original_stage: c.stage,
                checklists,
                setup_state: c.setup_state && typeof c.setup_state === 'object' ? c.setup_state : {}
            }
        })

        // Compute stage counts across normalized stages
        const stageCounts: Record<string, number> = {
            all: normalizedCases.length,
            provisioning: 0,
            data_setup: 0,
            configuration: 0,
            handover: 0,
            completed: 0,
        }

        for (const c of normalizedCases) {
            const st = c.stage
            if (stageCounts[st] !== undefined) {
                stageCounts[st]++
            }
        }

        // Apply stage filter
        const filteredCases = stage === 'all'
            ? normalizedCases
            : normalizedCases.filter(c => c.stage === stage)

        return NextResponse.json({
            cases: filteredCases,
            stageCounts,
            milestones: [
                { id: 'provisioning', number: 1, title: 'Kickoff & Account Provisioning', targetPct: 25 },
                { id: 'data_setup', number: 2, title: 'Academic Structure & Data Import', targetPct: 50 },
                { id: 'configuration', number: 3, title: 'Portal Branding & Exam Engine', targetPct: 75 },
                { id: 'handover', number: 4, title: 'Quality Signoff & Training Handover', targetPct: 100 },
            ]
        })
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

        // Auto-suggest onboarding staff if not specified
        let staffToAssign = assigned_staff_id
        if (!staffToAssign) {
            const { data: staffMembers } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                .in('role', ['onboarding_spec', 'platform_staff', 'admin'])
                .eq('is_active', true)
            if (staffMembers && staffMembers.length > 0) {
                staffToAssign = staffMembers[0].id
            }
        }

        const targetDate = target_completion_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const slaDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

        const defaultSubdomain = organization_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'school'

        const initialSetupState = {
            provisioning: {
                db_status: 'ready',
                subdomain: `${defaultSubdomain}.bebrilliant.in`,
                admin_email: contact_email || `admin@${defaultSubdomain}.edu`,
                credentials_dispatched: false,
                created_at: new Date().toISOString()
            },
            data_setup: {
                academic_year: '2026-2027',
                grades_count: 0,
                teachers_count: 0,
                students_count: 0,
                roster_status: 'pending'
            },
            configuration: {
                brand_color: '#2563eb',
                syllabus: 'CBSE',
                exam_modules: {
                    online_cbt: true,
                    omr_hybrid: true,
                    proctoring_ai: true,
                    question_bank: true
                }
            },
            handover: {
                audit_passed: false,
                customer_signoff: false,
                training_case_id: null
            }
        }

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
                stage: 'provisioning',
                stage_progress_pct: 25,
                target_completion_date: targetDate,
                sla_deadline: slaDeadline,
                setup_state: initialSetupState
            })
            .select()
            .single()

        if (error || !obCase) {
            console.error('Failed to insert onboarding case:', error)
            return NextResponse.json({ error: 'Failed to create onboarding case.' }, { status: 500 })
        }

        // Seed checklists for the 4 compact stages
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
                event_label: 'Onboarding Milestone 1 (Kickoff) Started',
                description: `Institutional onboarding started for ${organization_name}. Milestone 1: Provisioning.`,
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
