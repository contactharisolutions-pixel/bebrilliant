import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { STAGE_PROGRESS_MAP, normalizeStage } from '@/app/api/owner/onboarding/cases/route'

/** PATCH /api/owner/onboarding/cases/[id] — Advance stage, update inner setup state, checklists, or training handover */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const caseId = params.id
    try {
        const body = await request.json()
        const { action, stage, assigned_staff_id, checklist_id, is_completed, notes, payload } = body

        // Fetch case
        const { data: obCase, error: fetchErr } = await supabaseAdmin
            .from('onboarding_cases')
            .select('*')
            .eq('id', caseId)
            .single()

        if (fetchErr || !obCase) return NextResponse.json({ error: 'Onboarding case not found.' }, { status: 404 })

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        }

        const currentSetupState = (obCase.setup_state && typeof obCase.setup_state === 'object') ? { ...obCase.setup_state } : {}

        if (action === 'toggle_checklist' && checklist_id) {
            await supabaseAdmin
                .from('onboarding_checklists')
                .update({
                    is_completed: is_completed,
                    completed_at: is_completed ? new Date().toISOString() : null,
                    completed_by: is_completed ? user.id : null
                })
                .eq('id', checklist_id)
        } 
        else if (action === 'provision_credentials') {
            // Milestone 1: Provisioning action
            const adminEmail = payload?.admin_email || obCase.contact_email || 'admin@school.edu'
            const tempPassword = payload?.temp_password || 'Admin@' + Math.random().toString(36).substring(2, 7).toUpperCase() + '2026!'
            const subdomain = payload?.subdomain || (obCase.organization_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.bebrilliant.in')

            currentSetupState.provisioning = {
                ...currentSetupState.provisioning,
                db_status: 'active',
                subdomain,
                admin_email: adminEmail,
                admin_temp_password: tempPassword,
                credentials_dispatched: true,
                dispatched_at: new Date().toISOString(),
                dispatched_by: user.id
            }
            updateData.setup_state = currentSetupState

            // Auto-complete Phase 1 checklists
            await supabaseAdmin
                .from('onboarding_checklists')
                .update({ is_completed: true, completed_at: new Date().toISOString(), completed_by: user.id })
                .eq('case_id', caseId)
                .in('stage', ['provisioning', 'assigned', 'kickoff', 'account_setup'])

            if (obCase.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: obCase.lead_id,
                    event_type: 'credentials_provisioned',
                    event_label: 'Tenant Database & Admin Credentials Dispatched',
                    description: `Admin login provisioned for ${adminEmail} on ${subdomain}`,
                    staff_id: user.id,
                    metadata: { subdomain, admin_email: adminEmail }
                })
            }
        }
        else if (action === 'seed_roster') {
            // Milestone 2: 1-Click Starter Roster Seed action
            const academicYear = payload?.academic_year || '2026-2027'
            const gradesCount = payload?.grades_count || 12
            const teachersCount = payload?.teachers_count || 14
            const studentsCount = payload?.students_count || 140

            currentSetupState.data_setup = {
                ...currentSetupState.data_setup,
                academic_year: academicYear,
                grades_count: gradesCount,
                sections_count: gradesCount * 2,
                teachers_count: teachersCount,
                students_count: studentsCount,
                roster_status: 'seeded',
                seeded_at: new Date().toISOString(),
                sample_roster: {
                    grades: Array.from({ length: gradesCount }, (_, i) => `Grade ${i + 1}`),
                    sample_teachers: ['Dr. A. Sharma (HOD Math)', 'Mrs. P. Verma (Science)', 'Mr. R. Nair (English)'],
                    sample_sections: ['Section A', 'Section B']
                }
            }
            updateData.setup_state = currentSetupState

            // Auto-complete Phase 2 checklists
            await supabaseAdmin
                .from('onboarding_checklists')
                .update({ is_completed: true, completed_at: new Date().toISOString(), completed_by: user.id })
                .eq('case_id', caseId)
                .eq('stage', 'data_setup')

            if (obCase.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: obCase.lead_id,
                    event_type: 'roster_seeded',
                    event_label: 'Starter Academic Roster Provisioned',
                    description: `Configured ${gradesCount} grades, ${teachersCount} faculty profiles, and ${studentsCount} student seats for AY ${academicYear}.`,
                    staff_id: user.id
                })
            }
        }
        else if (action === 'update_config') {
            // Milestone 3: Portal & Exam Engine Configuration
            currentSetupState.configuration = {
                ...currentSetupState.configuration,
                brand_color: payload?.brand_color || '#2563eb',
                syllabus: payload?.syllabus || 'CBSE',
                school_crest_url: payload?.school_crest_url || '',
                exam_modules: payload?.exam_modules || {
                    online_cbt: true,
                    omr_hybrid: true,
                    proctoring_ai: true,
                    question_bank: true
                },
                updated_at: new Date().toISOString()
            }
            updateData.setup_state = currentSetupState

            // Auto-complete Phase 3 checklists
            await supabaseAdmin
                .from('onboarding_checklists')
                .update({ is_completed: true, completed_at: new Date().toISOString(), completed_by: user.id })
                .eq('case_id', caseId)
                .in('stage', ['configuration', 'quality_check'])

            if (obCase.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: obCase.lead_id,
                    event_type: 'exam_engine_configured',
                    event_label: 'Branding & Exam Engine Configured',
                    description: `Theme applied (${currentSetupState.configuration.syllabus} curriculum). CBT & OMR engines active.`,
                    staff_id: user.id
                })
            }
        }
        else if (action === 'handover_to_training') {
            // Milestone 4: Quality Signoff & 1-Click Handover to Training
            currentSetupState.handover = {
                audit_passed: true,
                customer_signoff: true,
                signoff_by: payload?.signoff_by || obCase.contact_name || 'School Authority',
                handover_notes: notes || payload?.handover_notes || 'All 4 onboarding milestones validated and approved.',
                handed_over_at: new Date().toISOString(),
                handed_over_by: user.id
            }
            updateData.setup_state = currentSetupState
            updateData.stage = 'completed'
            updateData.stage_progress_pct = 100
            updateData.completed_at = new Date().toISOString()
            updateData.completed_by = user.id

            // Mark all checklists complete
            await supabaseAdmin
                .from('onboarding_checklists')
                .update({ is_completed: true, completed_at: new Date().toISOString(), completed_by: user.id })
                .eq('case_id', caseId)

            // Auto-create or verify training case
            const { data: existingTraining } = await supabaseAdmin
                .from('training_cases')
                .select('id')
                .eq('onboarding_case_id', caseId)
                .maybeSingle()

            let trainingCaseId = existingTraining?.id
            if (!trainingCaseId) {
                const { data: newTraining } = await supabaseAdmin.from('training_cases').insert({
                    onboarding_case_id: obCase.id,
                    tenant_id: obCase.tenant_id,
                    lead_id: obCase.lead_id,
                    organization_name: obCase.organization_name,
                    status: 'pending_trainer',
                    training_type: 'full_pack',
                    sla_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    notes: `Auto-handed over from onboarding case ${obCase.id}. All configurations ready.`
                }).select('id').single()
                trainingCaseId = newTraining?.id
            }

            currentSetupState.handover.training_case_id = trainingCaseId
            updateData.setup_state = currentSetupState

            if (obCase.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: obCase.lead_id,
                    event_type: 'onboarding_completed',
                    event_label: 'Onboarding Completed & Handed Over to Training',
                    description: `All onboarding phases completed for ${obCase.organization_name}. Training case created.`,
                    staff_id: user.id,
                    metadata: { training_case_id: trainingCaseId }
                })
            }
        }
        else if (action === 'advance_stage') {
            const normStage = normalizeStage(stage)
            const progress = STAGE_PROGRESS_MAP[normStage] ?? 25

            updateData.stage = normStage
            updateData.stage_progress_pct = progress

            if (normStage === 'completed') {
                updateData.completed_at = new Date().toISOString()
                updateData.completed_by = user.id
            }

            if (obCase.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: obCase.lead_id,
                    event_type: 'onboarding_stage_advanced',
                    event_label: `Onboarding Advanced to ${normStage.toUpperCase()}`,
                    staff_id: user.id,
                    metadata: { new_stage: normStage, progress }
                })
            }
        } 
        else {
            if (assigned_staff_id !== undefined) updateData.assigned_staff_id = assigned_staff_id
            if (notes !== undefined) updateData.notes = notes
        }

        const { error: updateErr } = await supabaseAdmin
            .from('onboarding_cases')
            .update(updateData)
            .eq('id', caseId)

        if (updateErr) {
            console.error('PATCH /onboarding/cases/[id] update error:', updateErr)
            return NextResponse.json({ error: 'Failed to update onboarding case.' }, { status: 500 })
        }

        // Fetch fresh hydrated case with checklists and assigned staff
        const { data: updatedCase, error: fetchErr2 } = await supabaseAdmin
            .from('onboarding_cases')
            .select(`
                *,
                assigned_staff:assigned_staff_id(id, first_name, last_name, email, role),
                checklists:onboarding_checklists(*)
            `)
            .eq('id', caseId)
            .single()

        if (fetchErr2 || !updatedCase) {
            console.error('PATCH /onboarding/cases/[id] fetch updated error:', fetchErr2)
            return NextResponse.json({ error: 'Failed to fetch updated onboarding case.' }, { status: 500 })
        }

        return NextResponse.json({
            obCase: {
                ...updatedCase,
                stage: normalizeStage(updatedCase.stage),
                setup_state: updatedCase.setup_state || {}
            }
        })
    } catch (err: any) {
        console.error('PATCH /onboarding/cases/[id] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
