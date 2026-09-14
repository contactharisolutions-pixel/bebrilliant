import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'
        const url = request.nextUrl
        const classFilter = url.searchParams.get('class_name') || 'all'
        const subjectFilter = url.searchParams.get('subject_name') || 'all'
        const examIdFilter = url.searchParams.get('exam_id') || 'all'
        const search = url.searchParams.get('search')?.trim() || ''

        // 1. Base WHERE clauses for submissions
        const whereClauses = ['asu.tenant_id = $1']
        const queryParams: any[] = [tenantId]

        if (classFilter !== 'all') {
            queryParams.push(classFilter)
            whereClauses.push(`asu.class_name = $${queryParams.length}`)
        }

        if (subjectFilter !== 'all') {
            queryParams.push(subjectFilter)
            whereClauses.push(`asu.subject_name = $${queryParams.length}`)
        }

        if (examIdFilter !== 'all') {
            queryParams.push(examIdFilter)
            whereClauses.push(`asu.exam_id = $${queryParams.length}`)
        }

        if (search) {
            queryParams.push(`%${search}%`)
            whereClauses.push(`(
                asu.student_name ILIKE $${queryParams.length} OR 
                asu.roll_number ILIKE $${queryParams.length} OR 
                asu.subject_name ILIKE $${queryParams.length} OR
                oe.title ILIKE $${queryParams.length}
            )`)
        }

        // 2. Fetch Ranked Student Marks Ledger
        const studentsQuery = `
            SELECT 
                asu.id,
                asu.student_id,
                asu.student_name,
                asu.roll_number,
                asu.class_name,
                asu.subject_name,
                asu.awarded_marks,
                asu.max_marks,
                asu.percentage,
                asu.grade_badge,
                asu.status,
                asu.teacher_remarks,
                asu.evaluated_by,
                asu.evaluated_at,
                asu.file_url,
                COALESCE(oe.title, 'Academic Term Exam') AS exam_title,
                DENSE_RANK() OVER (ORDER BY asu.percentage DESC, asu.awarded_marks DESC) AS rank
            FROM public.answer_sheet_uploads asu
            LEFT JOIN public.offline_exams oe ON asu.exam_id = oe.id
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY rank ASC, asu.student_name ASC;
        `
        const studentsRes = await query(studentsQuery, queryParams)
        const students = studentsRes.rows || []

        // 3. Overall Overview Metrics (Calculated dynamically)
        const metricsWhere = ['tenant_id = $1']
        const metricsParams: any[] = [tenantId]
        if (classFilter !== 'all') {
            metricsParams.push(classFilter)
            metricsWhere.push(`class_name = $${metricsParams.length}`)
        }
        if (subjectFilter !== 'all') {
            metricsParams.push(subjectFilter)
            metricsWhere.push(`subject_name = $${metricsParams.length}`)
        }
        if (examIdFilter !== 'all') {
            metricsParams.push(examIdFilter)
            metricsWhere.push(`exam_id = $${metricsParams.length}`)
        }

        const metricsQuery = `
            SELECT 
                COUNT(*) AS total_submissions,
                COUNT(DISTINCT student_id) AS total_students_assessed,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
                COALESCE(ROUND(AVG(percentage) FILTER (WHERE status = 'completed' OR percentage > 0), 1), 0) AS class_average_score,
                COALESCE(MAX(percentage) FILTER (WHERE status = 'completed' OR percentage > 0), 0) AS highest_score,
                COALESCE(MIN(percentage) FILTER (WHERE (status = 'completed' OR percentage > 0) AND percentage > 0), 0) AS lowest_score,
                COALESCE(ROUND((COUNT(*) FILTER (WHERE percentage >= 40)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 1), 0) AS passing_rate,
                COUNT(*) FILTER (WHERE percentage >= 90) AS distinction_count,
                COUNT(*) FILTER (WHERE percentage >= 75 AND percentage < 90) AS first_class_count,
                COUNT(*) FILTER (WHERE percentage >= 60 AND percentage < 75) AS second_class_count,
                COUNT(*) FILTER (WHERE percentage >= 40 AND percentage < 60) AS pass_class_count,
                COUNT(*) FILTER (WHERE percentage < 40) AS needs_attention_count
            FROM public.answer_sheet_uploads
            WHERE ${metricsWhere.join(' AND ')};
        `
        const metricsRes = await query(metricsQuery, metricsParams)
        const overview = metricsRes.rows[0] || {
            total_submissions: 0,
            total_students_assessed: 0,
            completed_count: 0,
            class_average_score: 0,
            highest_score: 0,
            lowest_score: 0,
            passing_rate: 0,
            distinction_count: 0,
            first_class_count: 0,
            second_class_count: 0,
            pass_class_count: 0,
            needs_attention_count: 0
        }

        // 4. Subject-Wise Performance Analysis
        const subjectsQuery = `
            SELECT 
                asu.subject_name,
                COUNT(*) AS total_students,
                COALESCE(ROUND(AVG(asu.percentage), 1), 0) AS average_score,
                COALESCE(MAX(asu.percentage), 0) AS highest_score,
                COALESCE(MIN(asu.percentage), 0) AS lowest_score,
                COALESCE(ROUND((COUNT(*) FILTER (WHERE asu.percentage >= 40)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 1), 0) AS passing_rate,
                CASE 
                    WHEN AVG(asu.percentage) >= 80 THEN 'High Mastery'
                    WHEN AVG(asu.percentage) >= 60 THEN 'Good Progress'
                    ELSE 'Needs Coaching'
                END AS performance_status
            FROM public.answer_sheet_uploads asu
            WHERE ${metricsWhere.join(' AND ')}
            GROUP BY asu.subject_name
            ORDER BY average_score DESC;
        `
        const subjectsRes = await query(subjectsQuery, metricsParams)
        const subjects = subjectsRes.rows || []

        // 5. Exam-Wise Performance Trends
        const examsQuery = `
            SELECT 
                oe.id AS exam_id,
                oe.title AS exam_title,
                c.name AS class_name,
                s.name AS subject_name,
                oe.created_at,
                COUNT(asu.id) AS total_submissions,
                COALESCE(ROUND(AVG(asu.percentage), 1), 0) AS average_score,
                COALESCE(ROUND((COUNT(*) FILTER (WHERE asu.percentage >= 40)::numeric / NULLIF(COUNT(asu.id), 0)::numeric) * 100, 1), 0) AS passing_rate
            FROM public.offline_exams oe
            LEFT JOIN public.classes c ON oe.class_id = c.id
            LEFT JOIN public.subjects s ON oe.subject_id = s.id
            LEFT JOIN public.answer_sheet_uploads asu ON asu.exam_id = oe.id
            WHERE oe.tenant_id = $1
            GROUP BY oe.id, oe.title, c.name, s.name, oe.created_at
            ORDER BY oe.created_at DESC;
        `
        const examsRes = await query(examsQuery, [tenantId])
        const exams = examsRes.rows || []

        // 6. Filter Dropdown Options (Classes, Subjects, Available Exams)
        const filterOptionsQuery = `
            SELECT 
                json_build_object(
                    'classes', COALESCE((
                        SELECT json_agg(t) FROM (
                            SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC
                        ) t
                    ), '[]'::json),
                    'subjects', COALESCE((
                        SELECT json_agg(t) FROM (
                            SELECT id, name FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC
                        ) t
                    ), '[]'::json),
                    'exams', COALESCE((
                        SELECT json_agg(t) FROM (
                            SELECT id, title FROM public.offline_exams WHERE tenant_id = $1 ORDER BY created_at DESC
                        ) t
                    ), '[]'::json)
                ) AS filters;
        `
        const filterOptionsRes = await query(filterOptionsQuery, [tenantId])
        const filterOptions = filterOptionsRes.rows[0]?.filters || { classes: [], subjects: [], exams: [] }

        return NextResponse.json({
            success: true,
            data: {
                overview,
                students,
                subjects,
                exams,
                filters: filterOptions
            }
        })
    } catch (error: any) {
        console.error('Error fetching result 360 analytics:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal Server Error'
        }, { status: 500 })
    }
}
