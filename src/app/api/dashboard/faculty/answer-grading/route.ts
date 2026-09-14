import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'
        const url = request.nextUrl
        const statusFilter = url.searchParams.get('status') || 'all'
        const search = url.searchParams.get('search')?.trim() || ''
        const examIdFilter = url.searchParams.get('exam_id') || 'all'
        const classNameFilter = url.searchParams.get('class_name') || 'all'

        // 1. Fetch Submissions with flexible search & filtering
        let whereClauses = ['asu.tenant_id = $1']
        const queryParams: any[] = [tenantId]

        if (statusFilter !== 'all') {
            queryParams.push(statusFilter)
            whereClauses.push(`asu.status = $${queryParams.length}`)
        }

        if (examIdFilter !== 'all') {
            queryParams.push(examIdFilter)
            whereClauses.push(`asu.exam_id = $${queryParams.length}`)
        }

        if (classNameFilter !== 'all') {
            queryParams.push(classNameFilter)
            whereClauses.push(`asu.class_name = $${queryParams.length}`)
        }

        if (search) {
            queryParams.push(`%${search}%`)
            whereClauses.push(`(
                asu.student_name ILIKE $${queryParams.length} OR 
                asu.roll_number ILIKE $${queryParams.length} OR 
                oe.title ILIKE $${queryParams.length} OR
                asu.subject_name ILIKE $${queryParams.length}
            )`)
        }

        const submissionsQuery = `
            SELECT 
                asu.id,
                asu.tenant_id,
                asu.exam_id,
                asu.student_id,
                asu.file_url,
                asu.total_pages,
                asu.status,
                asu.processed,
                asu.awarded_marks,
                asu.max_marks,
                asu.percentage,
                asu.grade_badge,
                asu.teacher_remarks,
                asu.evaluated_by,
                asu.evaluated_at,
                asu.student_name,
                asu.roll_number,
                asu.class_name,
                asu.subject_name,
                asu.created_at,
                COALESCE(oe.title, 'Examination Assessment') AS exam_title,
                COALESCE(oe.duration, 90) AS exam_duration
            FROM public.answer_sheet_uploads asu
            LEFT JOIN public.offline_exams oe ON asu.exam_id = oe.id
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY 
                CASE 
                    WHEN asu.status = 'pending' THEN 1 
                    WHEN asu.status = 'review' THEN 2 
                    ELSE 3 
                END ASC,
                asu.created_at DESC;
        `

        // 2. Fetch Aggregated Metrics
        const metricsQuery = `
            SELECT 
                COUNT(*) AS total_submissions,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
                COUNT(*) FILTER (WHERE status = 'review') AS in_review_count,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
                COUNT(*) FILTER (WHERE status = 'completed' AND evaluated_at >= CURRENT_DATE) AS checked_today_count,
                COALESCE(ROUND(AVG(percentage) FILTER (WHERE status = 'completed'), 1), 0) AS avg_percentage,
                COUNT(*) FILTER (WHERE status = 'completed' AND percentage >= 75) AS distinction_count,
                COUNT(*) FILTER (WHERE status = 'completed' AND percentage >= 60 AND percentage < 75) AS first_class_count,
                COUNT(*) FILTER (WHERE status = 'completed' AND percentage >= 40 AND percentage < 60) AS second_class_count,
                COUNT(*) FILTER (WHERE status = 'completed' AND percentage < 40) AS needs_attention_count
            FROM public.answer_sheet_uploads
            WHERE tenant_id = $1;
        `

        // 3. Dropdown Options (Exams, Classes, Students)
        const filterOptionsQuery = `
            SELECT 
                json_build_object(
                    'exams', COALESCE((
                        SELECT json_agg(json_build_object('id', id, 'title', title, 'total_marks', 50))
                        FROM public.offline_exams WHERE tenant_id = $1 ORDER BY created_at DESC
                    ), '[]'::json),
                    'classes', COALESCE((
                        SELECT json_agg(json_build_object('id', id, 'name', name))
                        FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC
                    ), '[]'::json),
                    'subjects', COALESCE((
                        SELECT json_agg(json_build_object('id', id, 'name', name))
                        FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC
                    ), '[]'::json),
                    'students', COALESCE((
                        SELECT json_agg(json_build_object(
                            'id', id, 
                            'name', CONCAT(first_name, ' ', last_name), 
                            'roll_number', COALESCE(metadata->>'roll_no', 'N/A'),
                            'class_name', COALESCE(metadata->>'school_class', '')
                        ))
                        FROM public.user_profiles 
                        WHERE tenant_id = $1 AND role = 'student' 
                        ORDER BY first_name ASC
                    ), '[]'::json)
                ) AS filters;
        `

        const [subRes, metRes, optRes] = await Promise.all([
            query(submissionsQuery, queryParams),
            query(metricsQuery, [tenantId]),
            query(filterOptionsQuery, [tenantId])
        ])

        const submissions = subRes.rows || []
        const metrics = metRes.rows?.[0] || {
            total_submissions: 0,
            pending_count: 0,
            in_review_count: 0,
            completed_count: 0,
            checked_today_count: 0,
            avg_percentage: 0,
            distinction_count: 0,
            first_class_count: 0,
            second_class_count: 0,
            needs_attention_count: 0
        }
        const filterOptions = optRes.rows?.[0]?.filters || { exams: [], classes: [], subjects: [], students: [] }

        return NextResponse.json({
            submissions,
            metrics: {
                totalSubmissions: Number(metrics.total_submissions) || 0,
                pendingCount: Number(metrics.pending_count) || 0,
                inReviewCount: Number(metrics.in_review_count) || 0,
                completedCount: Number(metrics.completed_count) || 0,
                checkedTodayCount: Number(metrics.checked_today_count) || 0,
                avgPercentage: Number(metrics.avg_percentage) || 0,
                distinctionCount: Number(metrics.distinction_count) || 0,
                firstClassCount: Number(metrics.first_class_count) || 0,
                secondClassCount: Number(metrics.second_class_count) || 0,
                needsAttentionCount: Number(metrics.needs_attention_count) || 0
            },
            filterOptions
        })
    } catch (e: any) {
        console.error('[Answer Grading GET Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'
        const body = await request.json()
        const { action, payload } = body

        // ── 1. SAVE EVALUATION (DRAFT OR FINALIZED) ───────────────────────
        if (action === 'SAVE_EVALUATION') {
            const {
                id,
                awarded_marks = 0,
                max_marks = 50,
                teacher_remarks = '',
                status = 'completed', // 'review' | 'completed'
                evaluated_by = 'Senior Faculty Examiner'
            } = payload

            if (!id) return NextResponse.json({ error: 'Answer sheet submission ID is required' }, { status: 400 })

            const numAwarded = Number(awarded_marks) || 0
            const numMax = Number(max_marks) || 50
            const percentage = numMax > 0 ? Number(((numAwarded / numMax) * 100).toFixed(2)) : 0

            // Determine friendly Letter Grade
            let gradeBadge = 'C'
            if (percentage >= 90) gradeBadge = 'A+'
            else if (percentage >= 80) gradeBadge = 'A'
            else if (percentage >= 70) gradeBadge = 'B+'
            else if (percentage >= 60) gradeBadge = 'B'
            else if (percentage >= 40) gradeBadge = 'C'
            else gradeBadge = 'Needs Focus'

            const updateQuery = `
                UPDATE public.answer_sheet_uploads
                SET awarded_marks = $1,
                    max_marks = $2,
                    percentage = $3,
                    grade_badge = $4,
                    teacher_remarks = $5,
                    status = $6,
                    processed = $7,
                    evaluated_by = $8,
                    evaluated_at = NOW()
                WHERE id = $9 AND tenant_id = $10
                RETURNING *;
            `
            const { rows } = await query(updateQuery, [
                numAwarded,
                numMax,
                percentage,
                gradeBadge,
                teacher_remarks,
                status,
                status === 'completed',
                evaluated_by,
                id,
                tenantId
            ])

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Submission not found or unauthorized' }, { status: 404 })
            }

            // Sync with offline_exam_results if completed
            if (status === 'completed') {
                const sub = rows[0]
                if (sub.student_id && sub.exam_id) {
                    await query(`
                        INSERT INTO public.offline_exam_results 
                            (tenant_id, exam_id, student_id, total_marks, percentage, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                        ON CONFLICT DO NOTHING;
                    `, [tenantId, sub.exam_id, sub.student_id, numAwarded, percentage])
                }
            }

            const message = status === 'completed'
                ? 'Answer sheet evaluated and marked as completed successfully.'
                : 'Evaluation saved as draft for further review.'

            return NextResponse.json({ success: true, message, submission: rows[0] })
        }

        // ── 2. UPLOAD NEW STUDENT ANSWER SHEET ────────────────────────────
        if (action === 'UPLOAD_ANSWER_SHEET') {
            const {
                exam_id,
                student_id,
                file_url = '/assets/images/dashboard/sample_answersheet_math.jpg',
                total_pages = 4,
                student_name,
                roll_number,
                class_name,
                subject_name,
                max_marks = 50
            } = payload

            if (!student_name || !student_name.trim()) {
                return NextResponse.json({ error: 'Student name is required' }, { status: 400 })
            }

            const insertQuery = `
                INSERT INTO public.answer_sheet_uploads (
                    tenant_id, exam_id, student_id, file_url, total_pages, status, processed,
                    awarded_marks, max_marks, percentage, grade_badge, teacher_remarks,
                    student_name, roll_number, class_name, subject_name, created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, 'pending', false,
                    0, $6, 0, 'Pending', '',
                    $7, $8, $9, $10, NOW()
                )
                RETURNING *;
            `
            const { rows } = await query(insertQuery, [
                tenantId,
                exam_id || null,
                student_id || null,
                file_url,
                Number(total_pages) || 4,
                Number(max_marks) || 50,
                student_name.trim(),
                roll_number || 'N/A',
                class_name || 'Standard Secondary Grade',
                subject_name || 'Core Curriculum',
            ])

            return NextResponse.json({
                success: true,
                message: `Answer sheet for ${student_name} uploaded and added to the evaluation queue.`,
                submission: rows[0]
            })
        }

        // ── 3. PUBLISH ALL COMPLETED MARKS ────────────────────────────────
        if (action === 'PUBLISH_ALL_RESULTS') {
            // Mark all completed submissions as processed and announce
            const { rows } = await query(`
                UPDATE public.answer_sheet_uploads 
                SET processed = true 
                WHERE tenant_id = $1 AND status = 'completed'
                RETURNING id;
            `, [tenantId])

            return NextResponse.json({
                success: true,
                count: rows.length,
                message: `Successfully published ${rows.length} checked answer sheets to the Student & Parent Portals.`
            })
        }

        // ── 4. DELETE SUBMISSION ──────────────────────────────────────────
        if (action === 'DELETE_SUBMISSION') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

            await query(`DELETE FROM public.answer_sheet_uploads WHERE id = $1 AND tenant_id = $2`, [id, tenantId])
            return NextResponse.json({ success: true, message: 'Answer sheet submission removed.' })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (e: any) {
        console.error('[Answer Grading POST Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
