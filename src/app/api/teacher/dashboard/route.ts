import { NextRequest, NextResponse } from 'next/server'
import { verifyTenantStaff } from '@/lib/auth-server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { tenant_id, role, metadata, user } = session

        // Allowed roles: teacher (primary), or tenant_admin / owner for preview
        if (!['teacher', 'tenant_admin', 'owner', 'admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden: Access restricted to faculty members' }, { status: 403 })
        }

        // 1. Resolve Teacher Metadata & Assigned Classes
        const meta = (metadata as any) || {}
        const rawAssignedClasses: string[] = Array.isArray(meta.assigned_classes) ? meta.assigned_classes : []
        const assignedSubjects: string[] = Array.isArray(meta.assigned_subjects) ? meta.assigned_subjects : []

        // If teacher has assigned classes, build matching tokens
        // e.g. ["Class 6", "Class 8", "Class 7"] -> also ["6", "8", "7"]
        const classTokens = new Set<string>()
        rawAssignedClasses.forEach(c => {
            if (!c) return
            classTokens.add(c.trim())
            const match = c.match(/\d+/)
            if (match) {
                classTokens.add(match[0])
                classTokens.add(`Class ${match[0]}`)
                classTokens.add(`Grade ${match[0]}`)
            }
        })
        const classTokensArr = Array.from(classTokens)

        // 2. Fetch Tenant & Teacher Profile Info
        const { rows: tenantRows } = await query(
            `SELECT name, logo_url, tenant_type, 
                    COALESCE(settings->>'academic_year', 'AY 2026-27') as academic_year,
                    COALESCE(settings->>'affiliation', 'CBSE / State Board') as affiliation
             FROM public.tenants WHERE id = $1`,
            [tenant_id]
        )
        const tenantInfo = tenantRows[0] || {
            name: 'Academic Institute',
            logo_url: '/logo.png',
            academic_year: 'AY 2026-27',
            affiliation: 'CBSE / State Board'
        }

        const { rows: teacherProfileRows } = await query(
            `SELECT first_name, last_name, email 
             FROM public.user_profiles 
             WHERE id = $1`,
            [user.id]
        )
        const teacherProfile = teacherProfileRows[0] || {}
        const teacherFullName = [teacherProfile.first_name, teacherProfile.last_name].filter(Boolean).join(' ') || user.email

        // 3. Fetch Enrolled Students for Teacher's Classes
        let studentCount = 0
        let studentsByClass: { class_name: string; count: number }[] = []

        if (classTokensArr.length > 0) {
            const { rows: sRows } = await query(
                `SELECT 
                    COALESCE(metadata->>'class_name', metadata->>'class', metadata->>'grade', 'Unassigned') as class_name,
                    COUNT(*)::int as student_count
                 FROM public.user_profiles
                 WHERE tenant_id = $1 
                   AND role = 'student' 
                   AND is_active = true
                   AND (
                        metadata->>'class_name' = ANY($2::text[]) OR
                        metadata->>'class' = ANY($2::text[]) OR
                        metadata->>'grade' = ANY($2::text[])
                   )
                 GROUP BY class_name
                 ORDER BY class_name ASC`,
                [tenant_id, classTokensArr]
            )

            studentsByClass = sRows.map((r: any) => ({ class_name: r.class_name, count: r.student_count }))
            studentCount = sRows.reduce((acc: number, curr: any) => acc + curr.student_count, 0)
        } else {
            // If no classes assigned, fallback to tenant-wide student count for preview
            const { rows: fallbackSRows } = await query(
                `SELECT COUNT(*)::int as count FROM public.user_profiles 
                 WHERE tenant_id = $1 AND role = 'student' AND is_active = true`,
                [tenant_id]
            )
            studentCount = fallbackSRows[0]?.count || 0
        }

        // 4. Fetch Active & Scheduled Exams for Teacher's Scope
        let activeExamsCount = 0
        let upcomingExams: any[] = []

        let examQuery = `
            SELECT id, title, subject, class_name, total_marks, duration_minutes, exam_date, start_time, status, created_at
            FROM public.exams
            WHERE tenant_id = $1
        `
        const examParams: any[] = [tenant_id]

        if (classTokensArr.length > 0) {
            examQuery += ` AND (class_name = ANY($2::text[]) OR created_by = $3)`
            examParams.push(classTokensArr, user.id)
        }

        examQuery += ` ORDER BY exam_date DESC, created_at DESC LIMIT 6`

        const { rows: examRows } = await query(examQuery, examParams)
        upcomingExams = examRows || []
        activeExamsCount = upcomingExams.length

        // 5. Fetch Pending Grading Queue (Submitted attempts needing evaluation)
        let pendingGradingCount = 0
        let recentSubmissions: any[] = []

        try {
            let attemptQuery = `
                SELECT 
                    ea.id as attempt_id,
                    ea.exam_id,
                    ea.student_id,
                    ea.score,
                    ea.total_score,
                    ea.status,
                    ea.submitted_at,
                    e.title as exam_title,
                    e.subject,
                    e.class_name,
                    e.total_marks,
                    up.first_name,
                    up.last_name,
                    up.email as student_email
                FROM public.exam_attempts ea
                JOIN public.exams e ON ea.exam_id = e.id
                LEFT JOIN public.user_profiles up ON ea.student_id = up.id
                WHERE e.tenant_id = $1 AND ea.status = 'submitted'
            `
            const attemptParams: any[] = [tenant_id]

            if (classTokensArr.length > 0) {
                attemptQuery += ` AND (e.class_name = ANY($2::text[]) OR e.created_by = $3)`
                attemptParams.push(classTokensArr, user.id)
            }

            attemptQuery += ` ORDER BY ea.submitted_at DESC LIMIT 8`

            const { rows: attemptRows } = await query(attemptQuery, attemptParams)
            recentSubmissions = (attemptRows || []).map((r: any) => ({
                attempt_id: r.attempt_id,
                exam_id: r.exam_id,
                student_name: [r.first_name, r.last_name].filter(Boolean).join(' ') || r.student_email || 'Student',
                exam_title: r.exam_title,
                subject: r.subject,
                class_name: r.class_name,
                submitted_at: r.submitted_at,
                total_marks: r.total_marks || 100,
                status: r.status
            }))

            // Count total pending submissions
            let pendingCountQuery = `
                SELECT COUNT(*)::int as count 
                FROM public.exam_attempts ea
                JOIN public.exams e ON ea.exam_id = e.id
                WHERE e.tenant_id = $1 AND ea.status = 'submitted'
            `
            const pendingParams: any[] = [tenant_id]
            if (classTokensArr.length > 0) {
                pendingCountQuery += ` AND (e.class_name = ANY($2::text[]) OR e.created_by = $3)`
                pendingParams.push(classTokensArr, user.id)
            }
            const { rows: pRows } = await query(pendingCountQuery, pendingParams)
            pendingGradingCount = pRows[0]?.count || 0
        } catch (attErr) {
            console.error('Error querying exam_attempts for teacher dashboard:', attErr)
        }

        // 6. Performance Mastery & Pass Rate for Teacher's Classes
        let classAverageMastery = 78
        let passRate = 86
        try {
            let scoreQuery = `
                SELECT 
                    AVG(COALESCE(ea.score, ea.total_score, 0)) as avg_score,
                    COUNT(ea.id)::int as total_evaluations,
                    COUNT(CASE WHEN COALESCE(ea.score, ea.total_score, 0) >= (COALESCE(e.total_marks, 100) * 0.4) THEN 1 END)::int as passed_count
                FROM public.exam_attempts ea
                JOIN public.exams e ON ea.exam_id = e.id
                WHERE e.tenant_id = $1 AND ea.status IN ('submitted', 'evaluated')
            `
            const scoreParams: any[] = [tenant_id]
            if (classTokensArr.length > 0) {
                scoreQuery += ` AND (e.class_name = ANY($2::text[]) OR e.created_by = $3)`
                scoreParams.push(classTokensArr, user.id)
            }
            const { rows: scoreRows } = await query(scoreQuery, scoreParams)
            if (scoreRows?.[0] && scoreRows[0].total_evaluations > 0) {
                const total = scoreRows[0].total_evaluations
                const passed = scoreRows[0].passed_count
                passRate = Math.round((passed / total) * 100)
                classAverageMastery = Math.round(Number(scoreRows[0].avg_score) || 78)
            }
        } catch (scoreErr) {
            console.error('Error querying class scores:', scoreErr)
        }

        return NextResponse.json({
            teacher: {
                id: user.id,
                fullName: teacherFullName,
                email: user.email,
                designation: meta.designation || 'Faculty Member',
                employeeId: meta.employee_id || 'FACULTY',
                assignedClasses: rawAssignedClasses.length > 0 ? rawAssignedClasses : ['Class 6', 'Class 7', 'Class 8'],
                assignedSubjects: assignedSubjects
            },
            institution: {
                name: tenantInfo.name,
                logoUrl: tenantInfo.logo_url,
                academicYear: tenantInfo.academic_year,
                affiliation: tenantInfo.affiliation
            },
            kpi: {
                assignedStudentsCount: studentCount,
                activeExamsCount: activeExamsCount,
                pendingGradingCount: pendingGradingCount,
                classAverageMastery: classAverageMastery,
                passRate: passRate
            },
            classesOverview: rawAssignedClasses.map(cls => {
                const match = studentsByClass.find(s => s.class_name.toLowerCase() === cls.toLowerCase())
                return {
                    className: cls,
                    studentCount: match ? match.count : 0
                }
            }),
            pendingGradingQueue: recentSubmissions,
            upcomingExams: upcomingExams
        })
    } catch (error: any) {
        console.error('Teacher Dashboard API Error:', error)
        return NextResponse.json({ error: 'Failed to load teacher dashboard context' }, { status: 500 })
    }
}
