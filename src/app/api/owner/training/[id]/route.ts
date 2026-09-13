import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { pool } from '@/lib/db'

/** GET /api/owner/training/[id] — Fetch detailed training case with hydrated relations */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data: tc, error } = await supabaseAdmin
            .from('training_cases')
            .select(`
                *,
                assigned_trainer:assigned_trainer_id(id, first_name, last_name, email, role),
                sessions:training_sessions(*)
            `)
            .eq('id', params.id)
            .single()

        if (error || !tc) {
            return NextResponse.json({ error: 'Training case not found.' }, { status: 404 })
        }

        return NextResponse.json({ trainingCase: tc })
    } catch (err: any) {
        console.error('GET /training/[id] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** PATCH /api/owner/training/[id] — Lifecycle transitions, curriculum sessions & Go-Live certification */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const caseId = params.id
    try {
        const body = await request.json()
        const {
            action,
            // Assign trainer
            assigned_trainer_id,
            // Session operations
            session_id, session_no, topic, conducted_at, duration_mins, attendees_count, meeting_link, recording_url, session_notes, key_learnings, session_status,
            // Dry run sign-off
            dry_run_status, dry_run_notes, signoff_by, signoff_role,
            // Go-live certification & feedback
            feedback_rating, feedback_comments, certificate_id,
            // General updates
            training_package, training_type, notes
        } = body

        // Verify existence of training case
        const { data: tc, error: fetchErr } = await supabaseAdmin
            .from('training_cases')
            .select('*')
            .eq('id', caseId)
            .single()

        if (fetchErr || !tc) {
            return NextResponse.json({ error: 'Training case not found.' }, { status: 404 })
        }

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString()
        }

        if (action === 'assign_trainer') {
            if (!assigned_trainer_id) return NextResponse.json({ error: 'Trainer ID is required.' }, { status: 400 })
            updateData.assigned_trainer_id = assigned_trainer_id
            if (tc.status === 'pending_trainer') {
                updateData.status = 'trainer_assigned'
            }

            if (tc.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: tc.lead_id,
                    event_type: 'trainer_assigned',
                    event_label: 'Certified Trainer Assigned',
                    description: `Training specialist designated for ${tc.organization_name}.`,
                    staff_id: user.id,
                    metadata: { assigned_trainer_id }
                })
            }
        } else if (action === 'schedule_session' || action === 'log_session') {
            if (!topic) return NextResponse.json({ error: 'Session topic is required.' }, { status: 400 })

            if (session_id) {
                // Update existing session
                await pool.query(`
                    UPDATE public.training_sessions
                    SET topic = $1,
                        conducted_at = $2,
                        duration_mins = $3,
                        attendees_count = $4,
                        meeting_link = $5,
                        recording_url = $6,
                        notes = $7,
                        key_learnings = $8,
                        status = $9
                    WHERE id = $10 AND case_id = $11
                `, [
                    topic,
                    conducted_at ? new Date(conducted_at).toISOString() : new Date().toISOString(),
                    duration_mins || 60,
                    attendees_count || 1,
                    meeting_link || null,
                    recording_url || null,
                    session_notes || null,
                    key_learnings || null,
                    session_status || 'conducted',
                    session_id,
                    caseId
                ])
            } else {
                // Insert new session
                await pool.query(`
                    INSERT INTO public.training_sessions (
                        case_id, session_no, topic, conducted_at, duration_mins,
                        attendees_count, meeting_link, recording_url, notes, key_learnings,
                        status, conducted_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    caseId,
                    session_no || 1,
                    topic,
                    conducted_at ? new Date(conducted_at).toISOString() : new Date().toISOString(),
                    duration_mins || 60,
                    attendees_count || 1,
                    meeting_link || null,
                    recording_url || null,
                    session_notes || null,
                    key_learnings || null,
                    session_status || 'conducted',
                    user.id
                ])
            }

            if (tc.status === 'pending_trainer' || tc.status === 'trainer_assigned') {
                updateData.status = 'in_progress'
            }

            if (tc.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: tc.lead_id,
                    event_type: 'training_session_conducted',
                    event_label: `Training Session: ${topic}`,
                    description: `Duration: ${duration_mins || 60}m | Attendees: ${attendees_count || 1} | Status: ${session_status || 'conducted'}`,
                    staff_id: user.id,
                })
            }
        } else if (action === 'complete_session') {
            if (!session_id) return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 })

            await pool.query(`
                UPDATE public.training_sessions
                SET status = 'conducted',
                    conducted_at = COALESCE($1, conducted_at),
                    duration_mins = COALESCE($2, duration_mins),
                    attendees_count = COALESCE($3, attendees_count),
                    meeting_link = COALESCE($4, meeting_link),
                    recording_url = COALESCE($5, recording_url),
                    notes = COALESCE($6, notes),
                    key_learnings = COALESCE($7, key_learnings)
                WHERE id = $8 AND case_id = $9
            `, [
                conducted_at ? new Date(conducted_at).toISOString() : null,
                duration_mins || null,
                attendees_count || null,
                meeting_link || null,
                recording_url || null,
                session_notes || null,
                key_learnings || null,
                session_id,
                caseId
            ])

            if (tc.status === 'pending_trainer' || tc.status === 'trainer_assigned') {
                updateData.status = 'in_progress'
            }
        } else if (action === 'dry_run_signoff') {
            updateData.dry_run_status = dry_run_status || 'passed'
            if (dry_run_notes !== undefined) updateData.dry_run_notes = dry_run_notes
            if (signoff_by !== undefined) updateData.signoff_by = signoff_by
            if (signoff_role !== undefined) updateData.signoff_role = signoff_role
            updateData.signoff_at = new Date().toISOString()

            if (dry_run_status === 'passed') {
                updateData.status = 'dry_run'
            }

            if (tc.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: tc.lead_id,
                    event_type: 'institutional_signoff',
                    event_label: `Dry-Run Validation: ${dry_run_status === 'passed' ? 'Approved' : 'Revision Required'}`,
                    description: `Sign-off by: ${signoff_by || 'Institutional Authority'} (${signoff_role || 'Lead'}). Notes: ${dry_run_notes || 'Mock trial validated.'}`,
                    staff_id: user.id,
                })
            }
        } else if (action === 'certify_golive' || action === 'complete_training') {
            const certCode = certificate_id || `GL-CERT-${tc.organization_name.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
            
            updateData.status = 'completed'
            updateData.completed_at = new Date().toISOString()
            updateData.certificate_id = certCode
            updateData.certificate_issued_at = new Date().toISOString()
            updateData.feedback_rating = feedback_rating ? Number(feedback_rating) : 5
            if (feedback_comments !== undefined) updateData.feedback_comments = feedback_comments

            // GO-LIVE REACHED! Log executive milestone event
            if (tc.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: tc.lead_id,
                    event_type: 'customer_golive',
                    event_label: '🚀 Institutional Go-Live Certified',
                    description: `System fully certified for production Go-Live! Certificate #${certCode}. Rating: ${feedback_rating || 5}/5. Feedback: "${feedback_comments || 'Seamless transition.'}"`,
                    staff_id: user.id,
                    metadata: {
                        certificate_id: certCode,
                        feedback_rating: feedback_rating || 5,
                        feedback_comments
                    }
                })
            }
        } else {
            // General metadata updates
            if (assigned_trainer_id !== undefined) updateData.assigned_trainer_id = assigned_trainer_id
            if (training_package !== undefined) updateData.training_package = training_package
            if (training_type !== undefined) updateData.training_type = training_type
            if (notes !== undefined) updateData.notes = notes
            if (dry_run_notes !== undefined) updateData.dry_run_notes = dry_run_notes
            if (dry_run_status !== undefined) updateData.dry_run_status = dry_run_status
        }

        // Apply updates to training_cases
        const { error: updateErr } = await supabaseAdmin
            .from('training_cases')
            .update(updateData)
            .eq('id', caseId)

        if (updateErr) {
            console.error('PATCH /training/[id] update error:', updateErr)
            return NextResponse.json({ error: 'Failed to update training case.' }, { status: 500 })
        }

        // Fetch fresh hydrated case
        const { data: freshCase } = await supabaseAdmin
            .from('training_cases')
            .select(`
                *,
                assigned_trainer:assigned_trainer_id(id, first_name, last_name, email, role),
                sessions:training_sessions(*)
            `)
            .eq('id', caseId)
            .single()

        return NextResponse.json({ trainingCase: freshCase })
    } catch (err: any) {
        console.error('PATCH /training/[id] crash:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
