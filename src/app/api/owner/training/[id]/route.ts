import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** PATCH /api/owner/training/[id] — Update training case (assign trainer, log session, submit feedback, complete training) */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const caseId = params.id
    try {
        const body = await request.json()
        const {
            action, // 'assign_trainer' | 'log_session' | 'submit_feedback' | 'complete_training'
            assigned_trainer_id,
            session_no, topic, conducted_at, duration_mins, attendees_count, meeting_link, session_notes,
            feedback_rating, feedback_comments, notes
        } = body

        // Fetch case
        const { data: tc, error: fetchErr } = await supabaseAdmin
            .from('training_cases')
            .select('*')
            .eq('id', caseId)
            .single()

        if (fetchErr || !tc) return NextResponse.json({ error: 'Training case not found.' }, { status: 404 })

        const updateData: Record<string, any> = {}

        if (action === 'assign_trainer') {
            if (!assigned_trainer_id) return NextResponse.json({ error: 'Trainer ID is required.' }, { status: 400 })
            updateData.assigned_trainer_id = assigned_trainer_id
            updateData.status = 'trainer_assigned'

            if (tc.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: tc.lead_id,
                    event_type: 'trainer_assigned',
                    event_label: 'Trainer Assigned',
                    staff_id: user.id,
                    metadata: { assigned_trainer_id }
                })
            }
        } else if (action === 'log_session') {
            if (!topic) return NextResponse.json({ error: 'Session topic is required.' }, { status: 400 })

            await supabaseAdmin.from('training_sessions').insert({
                case_id: tc.id,
                session_no: session_no || 1,
                topic,
                conducted_at: conducted_at ? new Date(conducted_at).toISOString() : new Date().toISOString(),
                duration_mins: duration_mins || 60,
                attendees_count: attendees_count || 1,
                meeting_link: meeting_link || null,
                notes: session_notes || null,
                conducted_by: user.id
            })

            updateData.status = 'in_progress'

            if (tc.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: tc.lead_id,
                    event_type: 'training_session_conducted',
                    event_label: `Training Session Logged — ${topic}`,
                    description: `Duration: ${duration_mins || 60} mins | Attendees: ${attendees_count || 1}`,
                    staff_id: user.id,
                })
            }
        } else if (action === 'submit_feedback') {
            if (feedback_rating !== undefined) updateData.feedback_rating = feedback_rating
            if (feedback_comments !== undefined) updateData.feedback_comments = feedback_comments
        } else if (action === 'complete_training') {
            updateData.status = 'completed'
            updateData.completed_at = new Date().toISOString()
            if (feedback_rating !== undefined) updateData.feedback_rating = feedback_rating
            if (feedback_comments !== undefined) updateData.feedback_comments = feedback_comments

            // GO-LIVE REACHED! Log timeline event
            if (tc.lead_id) {
                await supabaseAdmin.from('lifecycle_timeline').insert({
                    lead_id: tc.lead_id,
                    event_type: 'customer_golive',
                    event_label: '🚀 Customer Go-Live Successful',
                    description: `Training completed & customer successfully went live! Rating: ${feedback_rating || 5}/5`,
                    staff_id: user.id,
                    metadata: { feedback_rating, feedback_comments }
                })
            }
        } else {
            if (assigned_trainer_id !== undefined) updateData.assigned_trainer_id = assigned_trainer_id
            if (notes !== undefined) updateData.notes = notes
        }

        const { data: updatedCase, error: updateErr } = await supabaseAdmin
            .from('training_cases')
            .update(updateData)
            .eq('id', caseId)
            .select(`
                *,
                assigned_trainer:assigned_trainer_id(id, first_name, last_name, email, role),
                sessions:training_sessions(*)
            `)
            .single()

        if (updateErr) return NextResponse.json({ error: 'Failed to update training case.' }, { status: 500 })

        return NextResponse.json({ trainingCase: updatedCase })
    } catch (err: any) {
        console.error('PATCH /training/[id] error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
