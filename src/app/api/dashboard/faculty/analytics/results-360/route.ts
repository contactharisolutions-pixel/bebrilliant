import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
        const tenantId = session?.tenant_id
        if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant context missing' }, { status: 403 })
        const url = request.nextUrl
        const classFilter = url.searchParams.get('class_name') || 'all'
        const subjectFilter = url.searchParams.get('subject_name') || 'all'
        const examIdFilter = url.searchParams.get('exam_id') || 'all'
        const search = url.searchParams.get('search')?.trim() || ''

        // 1. Identify User Role & Teacher Assigned Classes Scope
        let userRole = 'admin'
        let assignedClasses: string[] = []
        let assignedDivisions: string[] = []

        if (session?.user?.id) {
            const userRes = await query(
                `SELECT role, metadata FROM public.user_profiles WHERE id = $1`,
                [session.user.id]
            )
            if (userRes.rows.length > 0) {
                userRole = userRes.rows[0].role || 'teacher'
                const meta = userRes.rows[0].metadata || {}
                if (Array.isArray(meta.assigned_classes)) {
                    assignedClasses = meta.assigned_classes
                }
                if (Array.isArray(meta.assigned_divisions)) {
                    assignedDivisions = meta.assigned_divisions
                }
            }
        }

        const isTeacher = userRole === 'teacher'
        const teacherScope = {
            is_scoped: isTeacher,
            assigned_classes: isTeacher ? assignedClasses : [],
            assigned_divisions: isTeacher ? assignedDivisions : []
        }

        // If teacher has 0 assigned classes, return empty scoped analytics
        if (isTeacher && assignedClasses.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    teacherScope,
                    overview: {
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
                    },
                    students: [],
                    subjects: [],
                    weaker_analytics: {
                        weaker_subjects: [],
                        weaker_chapters: [],
                        weaker_topics: []
                    },
                    student_360_map: {},
                    exams: [],
                    filters: { classes: [], subjects: [], exams: [] }
                }
            })
        }

        // 2. Build Base WHERE Clauses for Submissions
        const whereClauses = ['asu.tenant_id = $1']
        const queryParams: any[] = [tenantId]

        // Teacher Class Isolation
        if (isTeacher && assignedClasses.length > 0) {
            const classTokens = assignedClasses.map(c => c.replace(/[^0-9]/g, '')).filter(Boolean)
            queryParams.push(assignedClasses)
            const exactParamIdx = queryParams.length
            queryParams.push(classTokens)
            const tokenParamIdx = queryParams.length

            whereClauses.push(`(
                asu.class_name = ANY($${exactParamIdx})
                OR (
                    regexp_replace(asu.class_name, '[^0-9]', '', 'g') <> ''
                    AND regexp_replace(asu.class_name, '[^0-9]', '', 'g') = ANY($${tokenParamIdx})
                )
            )`)
        }

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

        const combinedWhere = whereClauses.join(' AND ')

        // 3. Fetch Student Marks Ledger
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
                COALESCE(NULLIF(oe.title, ''), '') AS exam_title,
                DENSE_RANK() OVER (ORDER BY asu.percentage DESC, asu.awarded_marks DESC) AS rank
            FROM public.answer_sheet_uploads asu
            LEFT JOIN public.offline_exams oe ON asu.exam_id = oe.id
            WHERE ${combinedWhere}
            ORDER BY rank ASC, asu.student_name ASC;
        `
        const studentsRes = await query(studentsQuery, queryParams)
        const students = studentsRes.rows || []

        // 4. Overall Metrics Overview
        const metricsWhere = combinedWhere.replace(/asu\./g, '')
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
            WHERE ${metricsWhere};
        `
        const metricsRes = await query(metricsQuery, queryParams)
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

        // 5. Subject-Wise Performance Analysis
        const subjectsQuery = `
            SELECT 
                asu.subject_name,
                COUNT(*) AS total_students,
                COALESCE(ROUND(AVG(asu.percentage), 1), 0) AS average_score,
                COALESCE(MAX(asu.percentage), 0) AS highest_score,
                COALESCE(MIN(asu.percentage), 0) AS lowest_score,
                COALESCE(ROUND((COUNT(*) FILTER (WHERE asu.percentage >= 40)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 1), 0) AS passing_rate,
                COUNT(*) FILTER (WHERE asu.percentage < 50) AS at_risk_count,
                CASE 
                    WHEN AVG(asu.percentage) >= 80 THEN 'High Mastery'
                    WHEN AVG(asu.percentage) >= 60 THEN 'Good Progress'
                    ELSE 'Needs Coaching'
                END AS performance_status
            FROM public.answer_sheet_uploads asu
            WHERE ${combinedWhere}
            GROUP BY asu.subject_name
            ORDER BY average_score DESC;
        `
        const subjectsRes = await query(subjectsQuery, queryParams)
        const subjects = subjectsRes.rows || []

        // 6. Weaker Areas Diagnostic Engine (Subjects, Chapters, Topics)
        // A. Weaker Subjects
        const weakerSubjects = subjects
            .filter((s: any) => Number(s.average_score) < 75 || Number(s.at_risk_count) > 0)
            .map((s: any) => ({
                subject_name: s.subject_name,
                average_score: Number(s.average_score),
                passing_rate: Number(s.passing_rate),
                at_risk_count: Number(s.at_risk_count),
                severity: Number(s.average_score) < 55 ? 'Critical' : 'Moderate',
                recommended_action: Number(s.average_score) < 55 
                    ? 'Schedule 2 weekly remedial revision sessions and small-group problem reviews.'
                    : 'Target question banks and assign supplementary practice worksheets.'
            }))

        // B. Chapters & Micro-Topics from Syllabus Tree
        // Fetch chapters corresponding to evaluated subjects & active classes
        const targetClasses = (isTeacher && assignedClasses.length > 0) 
            ? assignedClasses 
            : (classFilter !== 'all' ? [classFilter] : [])
        
        const classTokens = targetClasses.map(c => c.replace(/[^0-9]/g, '')).filter(Boolean)

        const syllabusChaptersQuery = `
            SELECT 
                c.id AS chapter_id,
                c.name AS chapter_name,
                s.name AS subject_name,
                cls.name AS class_name
            FROM public.syllabus_nodes c
            JOIN public.syllabus_nodes s ON c.parent_id = s.id AND s.type = 'subject'
            JOIN public.syllabus_nodes cls ON s.parent_id = cls.id AND cls.type = 'class'
            WHERE (
                cls.name = ANY($1)
                OR regexp_replace(cls.name, '[^0-9]', '', 'g') = ANY($2)
            )
            ORDER BY cls.name, s.name, c.name
            LIMIT 40;
        `
        const syllabusChapsRes = await query(syllabusChaptersQuery, [targetClasses, classTokens])
        const rawChapters = syllabusChapsRes.rows || []

        // Correlate chapters with student subject averages — use real subject avg, no fake variance
        const weakerChapters = rawChapters.map((ch: any) => {
            const matchedSub = subjects.find((s: any) => s.subject_name.toLowerCase() === ch.subject_name.toLowerCase())
            // If we have a real subject average, use it; otherwise mark as untracked
            const accuracy = matchedSub ? Number(matchedSub.average_score) : 0
            const isCritical = accuracy > 0 && accuracy < 50
            const isModerate = accuracy >= 50 && accuracy < 70

            return {
                chapter_id: ch.chapter_id,
                chapter_name: ch.chapter_name,
                subject_name: ch.subject_name,
                class_name: ch.class_name,
                average_accuracy: accuracy,
                risk_severity: accuracy === 0 ? 'Proficient' : isCritical ? 'Critical' : isModerate ? 'Moderate' : 'Proficient',
                remedial_priority: isCritical ? 'High' : isModerate ? 'Medium' : 'Low',
                at_risk_students: Number(matchedSub?.at_risk_count || 0)
            }
        }).sort((a: any, b: any) => {
            // Put chapters with real data first, sorted by accuracy ascending (worst first)
            if (a.average_accuracy === 0 && b.average_accuracy > 0) return 1
            if (b.average_accuracy === 0 && a.average_accuracy > 0) return -1
            return a.average_accuracy - b.average_accuracy
        })

        // C. Weaker Micro-Topics with Remedial Recommendations
        const topicQuery = `
            SELECT 
                t.id AS topic_id,
                t.name AS topic_name,
                c.name AS chapter_name,
                s.name AS subject_name
            FROM public.syllabus_nodes t
            JOIN public.syllabus_nodes c ON t.parent_id = c.id AND c.type = 'chapter'
            JOIN public.syllabus_nodes s ON c.parent_id = s.id AND s.type = 'subject'
            JOIN public.syllabus_nodes cls ON s.parent_id = cls.id AND cls.type = 'class'
            WHERE (
                cls.name = ANY($1)
                OR regexp_replace(cls.name, '[^0-9]', '', 'g') = ANY($2)
            )
            LIMIT 30;
        `
        const topicRes = await query(topicQuery, [targetClasses, classTokens])
        const rawTopics = topicRes.rows || []

        const remedialActions = [
            'Provide step-by-step formula derivation sheets and daily 10-minute warm-up drills.',
            'Conduct visual concept walkthroughs with real-world examples and interactive demonstrations.',
            'Assign focused diagnostic flashcards and peer-review problem solving sessions.',
            'Review foundational pre-requisite definitions before tackling complex word problems.',
            'Reinforce diagrammatic annotations and structured step marking schemes.'
        ]

        const weakerTopics = rawTopics.map((tp: any) => {
            // Use real subject average to drive topic difficulty — no fake random variance
            const matchedSub = subjects.find((s: any) => s.subject_name.toLowerCase() === tp.subject_name.toLowerCase())
            const accuracy = matchedSub ? Number(matchedSub.average_score) : 0
            const isCritical = accuracy > 0 && accuracy < 45
            const isModerate = accuracy >= 45 && accuracy < 65

            return {
                topic_id: tp.topic_id,
                topic_name: tp.topic_name,
                chapter_name: tp.chapter_name,
                subject_name: tp.subject_name,
                accuracy_rate: accuracy,
                risk_level: accuracy === 0 ? 'Proficient' : isCritical ? 'Critical' : isModerate ? 'Moderate' : 'Proficient',
                remedial_action: isCritical
                    ? 'Schedule focused remedial session; assign targeted problem sets and formula drills.'
                    : isModerate
                    ? 'Assign supplementary practice worksheets and peer-review exercises.'
                    : 'Continue with current pacing; monitor for regression.'
            }
        }).sort((a: any, b: any) => {
            if (a.accuracy_rate === 0 && b.accuracy_rate > 0) return 1
            if (b.accuracy_rate === 0 && a.accuracy_rate > 0) return -1
            return a.accuracy_rate - b.accuracy_rate
        })

        // 7. Generate 360-Degree Profiles for Students
        // Fetch real attendance rates for all students in this tenant/scope
        let attendanceByStudentId: Record<string, number | null> = {}
        if (students.length > 0) {
            const studentIds = [...new Set(students.map((s: any) => s.student_id).filter(Boolean))]
            if (studentIds.length > 0) {
                try {
                    const attRes = await query(
                        `SELECT student_id,
                                COUNT(*)::int as total_days,
                                COUNT(*) FILTER (WHERE status = 'present')::int as present_days
                         FROM public.attendance_logs
                         WHERE tenant_id = $1 AND student_id = ANY($2::uuid[])
                         GROUP BY student_id`,
                        [tenantId, studentIds]
                    )
                    attRes.rows.forEach((row: any) => {
                        if (row.total_days > 0) {
                            attendanceByStudentId[row.student_id] = Math.round((row.present_days / row.total_days) * 100)
                        } else {
                            attendanceByStudentId[row.student_id] = null
                        }
                    })
                } catch {
                    // If attendance table doesn't support student_id, skip — don't fabricate
                }
            }
        }

        const studentMap: Record<string, any> = {}
        students.forEach((st: any) => {
            if (!studentMap[st.student_id]) {
                studentMap[st.student_id] = {
                    student_id: st.student_id,
                    student_name: st.student_name,
                    roll_number: st.roll_number,
                    class_name: st.class_name,
                    rank: st.rank,
                    total_exams: 0,
                    total_percentage: 0,
                    overall_average: 0,
                    overall_grade: 'A',
                    // Use real attendance rate; null means no data available
                    attendance_rate: attendanceByStudentId[st.student_id] ?? null,
                    subject_mastery: [],
                    exam_history: [],
                    strengths: [],
                    weaker_areas: [],
                    teacher_recommendation: st.teacher_remarks || ''
                }
            }

            studentMap[st.student_id].total_exams += 1
            studentMap[st.student_id].total_percentage += Number(st.percentage)
            studentMap[st.student_id].exam_history.push({
                exam_title: st.exam_title,
                subject_name: st.subject_name,
                date: st.evaluated_at ? new Date(st.evaluated_at).toLocaleDateString() : null,
                awarded_marks: Number(st.awarded_marks),
                max_marks: Number(st.max_marks),
                percentage: Number(st.percentage),
                grade_badge: st.grade_badge,
                remarks: st.teacher_remarks
            })

            // Subject mastery entry
            studentMap[st.student_id].subject_mastery.push({
                subject_name: st.subject_name,
                score: Number(st.percentage),
                grade: st.grade_badge,
                status: Number(st.percentage) >= 75 ? 'Mastered' : Number(st.percentage) >= 55 ? 'On Track' : 'Needs Support'
            })
        })

        // Finalize student 360 summaries
        Object.values(studentMap).forEach((st: any) => {
            st.overall_average = Math.round(st.total_percentage / (st.total_exams || 1))
            st.overall_grade = st.overall_average >= 90 ? 'A+' : st.overall_average >= 75 ? 'A' : st.overall_average >= 60 ? 'B' : st.overall_average >= 40 ? 'C' : 'F'
            
            // Derive strengths & weaker areas
            const sortedMastery = [...st.subject_mastery].sort((a: any, b: any) => b.score - a.score)
            // Only emit data-derived bullets — no generic fabricated text
            st.strengths = sortedMastery
                .filter((s: any) => s.score >= 75)
                .map((s: any) => `${s.subject_name}: ${s.score}% (Grade ${s.grade})`)
            st.weaker_areas = sortedMastery
                .filter((s: any) => s.score < 60)
                .map((s: any) => `${s.subject_name}: ${s.score}% — targeted revision required`)
        })

        // 8. Exam-Wise Performance Trends — teacher class-scoped
        const examsWhereClauses = ['oe.tenant_id = $1']
        const examsQueryParams: any[] = [tenantId]

        if (isTeacher && assignedClasses.length > 0) {
            const exClassTokens = assignedClasses.map((c: string) => c.replace(/[^0-9]/g, '')).filter(Boolean)
            examsQueryParams.push(assignedClasses)
            examsQueryParams.push(exClassTokens)
            examsWhereClauses.push(`(
                c.name = ANY($${examsQueryParams.length - 1})
                OR regexp_replace(COALESCE(c.name, ''), '[^0-9]', '', 'g') = ANY($${examsQueryParams.length})
                OR asu.class_name = ANY($${examsQueryParams.length - 1})
                OR regexp_replace(COALESCE(asu.class_name, ''), '[^0-9]', '', 'g') = ANY($${examsQueryParams.length})
            )`)
        }

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
            WHERE ${examsWhereClauses.join(' AND ')}
            GROUP BY oe.id, oe.title, c.name, s.name, oe.created_at
            ORDER BY oe.created_at DESC;
        `
        const examsRes = await query(examsQuery, examsQueryParams)
        const exams = examsRes.rows || []

        // 9. Scoped Filter Dropdown Options — fully teacher-isolated
        let classFilterQuery = `SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC;`
        let classFilterParams = [tenantId]

        if (isTeacher && assignedClasses.length > 0) {
            const tokens = assignedClasses.map((c: string) => c.replace(/[^0-9]/g, '')).filter(Boolean)
            classFilterQuery = `
                SELECT id, name FROM public.classes 
                WHERE tenant_id = $1 
                AND (name = ANY($2) OR regexp_replace(name, '[^0-9]', '', 'g') = ANY($3))
                ORDER BY name ASC;
            `
            classFilterParams = [tenantId, assignedClasses, tokens] as any
        }

        const filterClassesRes = await query(classFilterQuery, classFilterParams)

        // Subjects: derived from actual answer_sheet_uploads for teacher's classes — not all school subjects
        let filterSubjectsRes
        if (isTeacher && assignedClasses.length > 0) {
            const subTokens = assignedClasses.map((c: string) => c.replace(/[^0-9]/g, '')).filter(Boolean)
            filterSubjectsRes = await query(
                `SELECT DISTINCT subject_name AS id, subject_name AS name
                 FROM public.answer_sheet_uploads
                 WHERE tenant_id = $1
                   AND (
                       class_name = ANY($2)
                       OR regexp_replace(COALESCE(class_name, ''), '[^0-9]', '', 'g') = ANY($3)
                   )
                   AND subject_name IS NOT NULL AND subject_name <> ''
                 ORDER BY subject_name ASC`,
                [tenantId, assignedClasses, subTokens]
            )
        } else {
            filterSubjectsRes = await query(
                `SELECT id::text AS id, name FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC`,
                [tenantId]
            )
        }

        // Exams: scoped to teacher's assigned classes only
        let filterExamsRes
        if (isTeacher && assignedClasses.length > 0) {
            const exTokens = assignedClasses.map((c: string) => c.replace(/[^0-9]/g, '')).filter(Boolean)
            filterExamsRes = await query(
                `SELECT oe.id, oe.title
                 FROM public.offline_exams oe
                 LEFT JOIN public.classes c ON oe.class_id = c.id
                 WHERE oe.tenant_id = $1
                   AND (
                       c.name = ANY($2)
                       OR regexp_replace(COALESCE(c.name, ''), '[^0-9]', '', 'g') = ANY($3)
                   )
                 ORDER BY oe.created_at DESC`,
                [tenantId, assignedClasses, exTokens]
            )
        } else {
            filterExamsRes = await query(
                `SELECT id, title FROM public.offline_exams WHERE tenant_id = $1 ORDER BY created_at DESC`,
                [tenantId]
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                teacherScope,
                overview,
                students,
                subjects,
                weaker_analytics: {
                    weaker_subjects: weakerSubjects,
                    weaker_chapters: weakerChapters,
                    weaker_topics: weakerTopics
                },
                student_360_map: studentMap,
                exams,
                filters: {
                    classes: filterClassesRes.rows || [],
                    subjects: filterSubjectsRes.rows || [],
                    exams: filterExamsRes.rows || []
                }
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
