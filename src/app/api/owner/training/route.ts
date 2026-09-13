import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { pool } from '@/lib/db'

/** GET /api/owner/training — List all training cases with metrics and intake candidates */
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

        // Aggregate live status counts
        const { data: statusRows } = await supabaseAdmin.from('training_cases').select('status, feedback_rating')
        const statusCounts: Record<string, number> = {
            all: 0,
            pending_trainer: 0,
            trainer_assigned: 0,
            in_progress: 0,
            dry_run: 0,
            completed: 0,
            cancelled: 0,
        }
        let totalRating = 0
        let ratedCount = 0

        for (const row of statusRows ?? []) {
            statusCounts.all = (statusCounts.all || 0) + 1
            statusCounts[row.status] = (statusCounts[row.status] || 0) + 1
            if (row.feedback_rating) {
                totalRating += Number(row.feedback_rating)
                ratedCount += 1
            }
        }

        const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : '5.0'

        // Identify any completed onboarding cases that have not yet been intaken into training_cases
        let onboardedCandidates: any[] = []
        try {
            const { rows: candidateRows } = await pool.query(`
                SELECT oc.id, oc.organization_name, oc.lead_id, oc.tenant_id, oc.completed_at
                FROM public.onboarding_cases oc
                WHERE oc.stage = 'completed'
                AND NOT EXISTS (
                    SELECT 1 FROM public.training_cases tc WHERE tc.onboarding_case_id = oc.id
                )
                ORDER BY oc.updated_at DESC
                LIMIT 10
            `)
            onboardedCandidates = candidateRows
        } catch (candidateErr) {
            console.warn('Unable to query onboarded candidates for training:', candidateErr)
        }

        return NextResponse.json({
            cases: cases ?? [],
            statusCounts,
            avgRating,
            onboardedCandidates
        })
    } catch (err: any) {
        console.error('GET /training crash:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** POST /api/owner/training — Create a new training case with optional full curriculum setup */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const {
            onboarding_case_id,
            tenant_id,
            lead_id,
            organization_name,
            assigned_trainer_id,
            training_type = 'full_suite',
            training_package = 'Full Enterprise Suite',
            notes = '',
            create_default_curriculum = true
        } = body

        if (!organization_name) {
            return NextResponse.json({ error: 'Organization name is required.' }, { status: 400 })
        }

        const slaDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()

        const { data: tc, error } = await supabaseAdmin
            .from('training_cases')
            .insert({
                onboarding_case_id: onboarding_case_id || null,
                tenant_id: tenant_id || null,
                lead_id: lead_id || null,
                organization_name,
                assigned_trainer_id: assigned_trainer_id || null,
                status: assigned_trainer_id ? 'trainer_assigned' : 'pending_trainer',
                training_type,
                training_package,
                sla_deadline: slaDeadline,
                notes: notes || null,
                dry_run_status: 'pending'
            })
            .select()
            .single()

        if (error || !tc) {
            console.error('Failed to insert training case:', error)
            return NextResponse.json({ error: 'Failed to create training case.' }, { status: 500 })
        }

        // Automatically provision curriculum sessions
        if (create_default_curriculum) {
            const defaultSessions = [
                {
                    session_no: 1,
                    topic: 'Executive Admin & Academic Hierarchy Setup',
                    conducted_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                    duration_mins: 75,
                    attendees_count: 5,
                    status: 'scheduled',
                    notes: 'Initial governance briefing, administrative roles, classes, sections, and permissions allocation.',
                    key_learnings: 'Master administrative access validation.'
                },
                {
                    session_no: 2,
                    topic: 'Faculty CBT Exam Engine & Question Bank Authoring',
                    conducted_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                    duration_mins: 90,
                    attendees_count: 20,
                    status: 'scheduled',
                    notes: 'Teacher onboarding: question formatting, question bank imports, blueprint design, and timed CBT trial.',
                    key_learnings: 'Faculty exam authoring proficiency.'
                },
                {
                    session_no: 3,
                    topic: 'Hybrid OMR Sheet Generation, Scanning & Auto-Grading',
                    conducted_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                    duration_mins: 60,
                    attendees_count: 10,
                    status: 'scheduled',
                    notes: 'Hands-on OMR sheet printing, camera calibration, barcode scanning, and instant optical grading review.',
                    key_learnings: 'OMR scanning calibration & error resolution.'
                },
                {
                    session_no: 4,
                    topic: 'Student & Parent Portal Walkthrough & Results Publishing',
                    conducted_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    duration_mins: 45,
                    attendees_count: 15,
                    status: 'scheduled',
                    notes: 'End-to-end dry run: student portal login, scorecard download, SMS trigger verification, and stakeholder approval.',
                    key_learnings: 'Final institutional Go-Live readiness.'
                }
            ]

            for (const s of defaultSessions) {
                await pool.query(`
                    INSERT INTO public.training_sessions (
                        case_id, session_no, topic, conducted_at, duration_mins,
                        attendees_count, status, notes, key_learnings, conducted_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [
                    tc.id, s.session_no, s.topic, s.conducted_at, s.duration_mins,
                    s.attendees_count, s.status, s.notes, s.key_learnings,
                    assigned_trainer_id || user.id
                ])
            }
        }

        // Timeline logging
        if (lead_id) {
            await supabaseAdmin.from('lifecycle_timeline').insert({
                lead_id,
                event_type: 'training_case_created',
                event_label: 'Customer Training Initiated',
                description: `Training case created for ${organization_name} with ${training_package}.`,
                staff_id: user.id,
            })
        }

        // Fetch freshly hydrated case
        const { data: fullCase } = await supabaseAdmin
            .from('training_cases')
            .select(`
                *,
                assigned_trainer:assigned_trainer_id(id, first_name, last_name, email, role),
                sessions:training_sessions(*)
            `)
            .eq('id', tc.id)
            .single()

        return NextResponse.json({ trainingCase: fullCase || tc }, { status: 201 })
    } catch (err: any) {
        console.error('POST /training error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
