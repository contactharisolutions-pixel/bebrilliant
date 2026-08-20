import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

const STAGE_PROGRESS_MAP: Record<string, number> = {
    assigned: 12,
    kickoff: 25,
    account_setup: 38,
    data_setup: 50,
    configuration: 65,
    quality_check: 78,
    customer_review: 88,
    ready_for_training: 95,
    completed: 100
}

/** PATCH /api/owner/onboarding/cases/[id] — Advance stage, update checklists, or complete */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const caseId = params.id
    try {
        const body = await request.json()
        const { action, stage, assigned_staff_id, checklist_id, is_completed, notes } = body

        // Fetch case
        const { data: obCase, error: fetchErr } = await supabaseAdmin
            .from('onboarding_cases')
            .select('*')
            .eq('id', caseId)
            .single()

        if (fetchErr || !obCase) return NextResponse.json({ error: 'Onboarding case not found.' }, { status: 404 })

        const updateData: Record<string, any> = {}

        if (action === 'toggle_checklist' && checklist_id) {
            await supabaseAdmin
                .from('onboarding_checklists')
                .update({
                    is_completed: is_completed,
                    completed_at: is_completed ? new Date().toISOString() : null,
                    completed_by: is_completed ? user.id : null
                })
                .eq('id', checklist_id)
        } else if (action === 'advance_stage') {
            if (!stage || STAGE_PROGRESS_MAP[stage] === undefined) {
                return NextResponse.json({ error: 'Invalid stage selected.' }, { status: 400 })
            }

            updateData.stage = stage
            updateData.stage_progress_pct = STAGE_PROGRESS_MAP[stage]

            if (stage === 'completed') {
                updateData.completed_at = new Date().toISOString()
                updateData.completed_by = user.id

                // Auto-create training case! (Phase 4 integration)
                await supabaseAdmin.from('training_cases').insert({
                    onboarding_case_id: obCase.id,
                    tenant_id: obCase.tenant_id,
                    lead_id: obCase.lead_id,
                    organization_name: obCase.organization_name,
                    status: 'pending_trainer',
                    training_type: 'full_pack',
                    sla_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days SLA for training
                })

                if (obCase.lead_id) {
                    await supabaseAdmin.from('lifecycle_timeline').insert({
                        lead_id: obCase.lead_id,
                        event_type: 'onboarding_completed',
                        event_label: 'Onboarding Completed',
                        description: `Onboarding completed for ${obCase.organization_name}. Training case automatically created.`,
                        staff_id: user.id,
                    })
                }
            } else if (obCase.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: obCase.lead_id,
                    event_type: 'onboarding_stage_advanced',
                    event_label: `Onboarding Stage Advanced — ${stage.toUpperCase()}`,
                    staff_id: user.id,
                    metadata: { new_stage: stage, progress: STAGE_PROGRESS_MAP[stage] }
                })
            }
        } else {
            if (assigned_staff_id !== undefined) updateData.assigned_staff_id = assigned_staff_id
            if (notes !== undefined) updateData.notes = notes
        }

        const { data: updatedCase, error: updateErr } = await supabaseAdmin
            .from('onboarding_cases')
            .update(updateData)
            .eq('id', caseId)
            .select(`
                *,
                assigned_staff:assigned_staff_id(id, first_name, last_name, email, role),
                checklists:onboarding_checklists(*)
            `)
            .single()

        if (updateErr) return NextResponse.json({ error: 'Failed to update onboarding case.' }, { status: 500 })

        return NextResponse.json({ obCase: updatedCase })
    } catch (err: any) {
        console.error('PATCH /onboarding/cases/[id] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
