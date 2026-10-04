import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase/server'

async function resolveSession() {
    try {
        const staff = await verifyTenantStaff()
        if (staff?.tenant_id) return staff
    } catch {}

    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user?.id) {
            const { rows } = await query(
                `SELECT role, tenant_id, metadata, is_active FROM public.user_profiles WHERE id = $1`,
                [user.id]
            )
            const profile = rows[0]
            if (profile?.is_active && profile?.tenant_id) {
                return { user, tenant_id: profile.tenant_id, role: profile.role }
            }
        }
    } catch {}

    return null
}

export async function GET(request: NextRequest) {
    try {
        const session = await resolveSession()
        if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
        const tenantId = session?.tenant_id
        if (!tenantId) return NextResponse.json({ success: false, error: 'Tenant context missing' }, { status: 403 })

        const url = request.nextUrl
        const requestedYear = url.searchParams.get('academic_year') || 'all'
        const requestedClass = url.searchParams.get('class_name') || 'all'
        const requestedDivision = url.searchParams.get('division') || 'all'
        const requestedSubject = url.searchParams.get('subject_name') || 'all'
        const requestedExamId = url.searchParams.get('exam_id') || 'all'

        // 1. Fetch Filter Metadata (Academic Years, Classes, Divisions, Subjects)
        const [yearsRes, classesRes, divsRes, subjectsRes] = await Promise.all([
            query(`SELECT id, name, is_active FROM public.academic_years WHERE tenant_id = $1 ORDER BY start_date DESC`, [tenantId]),
            query(`SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]),
            query(`SELECT id, name, class_id FROM public.divisions WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]),
            query(`SELECT id, name FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId])
        ])

        const academicYears = yearsRes.rows.length > 0
            ? yearsRes.rows.map(y => ({ id: y.id, name: y.name, is_active: y.is_active }))
            : [{ id: 'curr', name: 'Academic Session 2026-27', is_active: true }]

        const classes = classesRes.rows.map(c => ({ id: c.id, name: c.name }))
        const divisions = divsRes.rows.map(d => ({ id: d.id, name: d.name, class_id: d.class_id }))
        const subjects = subjectsRes.rows.map(s => ({ id: s.id, name: s.name }))

        // Determine active Class selection
        let selectedClass = requestedClass
        if (selectedClass === 'all') {
            selectedClass = classes.length > 0 ? classes[0].name : 'Class 10'
        }

        // Determine active Division selection
        const availableDivisions = divisions.filter(d => {
            const matchedClass = classes.find(c => c.name === selectedClass)
            return matchedClass ? d.class_id === matchedClass.id : true
        })

        let selectedDivision = requestedDivision
        if (selectedDivision === 'all') {
            selectedDivision = availableDivisions.length > 0 ? availableDivisions[0].name : 'A'
        }

        // Determine active Subject selection
        let selectedSubject = requestedSubject
        if (selectedSubject === 'all') {
            selectedSubject = subjects.length > 0 ? subjects[0].name : 'Science'
        }

        // 2. Fetch Examinations for the selected Class + Subject context
        const examsQuery = `
            SELECT 
                oe.id,
                oe.title,
                oe.created_at,
                oe.status,
                s.name as subject_name,
                c.name as class_name
            FROM public.offline_exams oe
            LEFT JOIN public.subjects s ON oe.subject_id = s.id
            LEFT JOIN public.classes c ON oe.class_id = c.id
            WHERE oe.tenant_id = $1
              AND (
                  s.name = $2 OR s.name ILIKE '%' || $2 || '%'
                  OR oe.title ILIKE '%' || $2 || '%'
                  OR $2 = 'all'
              )
            ORDER BY oe.created_at DESC;
        `
        const examsRes = await query(examsQuery, [tenantId, selectedSubject])
        const availableExams = examsRes.rows.map(e => ({
            id: e.id,
            title: e.title || 'Examination Assessment',
            subject_name: e.subject_name || selectedSubject,
            class_name: e.class_name || selectedClass,
            date: e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '25 Jun 2026'
        }))

        // Determine active Exam selection
        let activeExam = null
        if (requestedExamId !== 'all') {
            activeExam = availableExams.find(e => e.id === requestedExamId)
        }
        if (!activeExam && availableExams.length > 0) {
            activeExam = availableExams[0]
        }

        // 3. Fetch Enrolled Students for this Class & Section
        let studentWhere = ["up.tenant_id = $1", "up.role = 'student'"]
        let studentParams: any[] = [tenantId]

        if (selectedClass) {
            studentParams.push(selectedClass)
            studentWhere.push(`(up.metadata->>'school_class' = $${studentParams.length} OR up.metadata->>'class' = $${studentParams.length} OR up.metadata->>'school_class' ILIKE '%' || $${studentParams.length} || '%')`)
        }

        const enrolledStudentsRes = await query(`
            SELECT up.id, up.first_name, up.last_name, up.metadata
            FROM public.user_profiles up
            WHERE ${studentWhere.join(' AND ')}
            ORDER BY up.first_name ASC, up.last_name ASC;
        `, studentParams)

        const enrolledStudents = enrolledStudentsRes.rows.map(st => {
            const fullName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Student'
            const meta = st.metadata || {}
            return {
                id: st.id,
                name: fullName,
                roll_no: meta.roll_no || meta.roll_number || '—',
                admission_no: meta.admission_no || meta.admission_number || `ADM-${st.id.slice(0, 5).toUpperCase()}`,
                school_class: meta.school_class || meta.class || selectedClass,
                division: meta.division || meta.section || selectedDivision
            }
        })

        // If no exam found at all
        if (!activeExam) {
            return NextResponse.json({
                success: true,
                data: {
                    filters: {
                        academic_years: academicYears,
                        classes,
                        divisions: availableDivisions,
                        subjects,
                        exams: []
                    },
                    header: {
                        class_name: selectedClass,
                        division: selectedDivision,
                        subject: selectedSubject,
                        exam_name: 'No Exam Found',
                        academic_year: academicYears.find(y => y.is_active)?.name || 'Academic Session 2026-27',
                        maximum_marks: 100,
                        passing_marks: 35,
                        exam_date: '—'
                    },
                    summary: {
                        students_enrolled: enrolledStudents.length,
                        students_appeared: 0,
                        average_percentage: 0,
                        highest_percentage: 0,
                        lowest_percentage: 0,
                        pass_count: 0,
                        fail_count: 0,
                        pass_percentage: 0,
                        absent_count: 0,
                        pending_count: 0
                    },
                    students: [],
                    score_distribution: [],
                    pass_fail_distribution: []
                }
            })
        }

        // 4. Query student results for this exam
        const resultsRes = await query(`
            SELECT 
                asu.id,
                asu.student_id,
                asu.student_name,
                asu.roll_number,
                asu.awarded_marks,
                asu.max_marks,
                asu.percentage,
                asu.grade_badge,
                asu.status,
                asu.created_at,
                COALESCE(up.first_name || ' ' || up.last_name, asu.student_name) as full_name,
                up.metadata
            FROM public.answer_sheet_uploads asu
            LEFT JOIN public.user_profiles up ON asu.student_id = up.id
            WHERE asu.tenant_id = $1
              AND asu.exam_id = $2
            ORDER BY asu.percentage DESC NULLS LAST, asu.awarded_marks DESC NULLS LAST;
        `, [tenantId, activeExam.id])

        const rawResults = resultsRes.rows || []

        // If results exist in table
        const maxMarks = rawResults.length > 0 && rawResults[0].max_marks ? Number(rawResults[0].max_marks) : 100
        const passingPercentage = 35.0
        const passingMarks = Math.round((maxMarks * passingPercentage) / 100)

        // Classify appeared vs absent vs pending
        const validResults = rawResults.filter(r => 
            r.percentage !== null && 
            r.awarded_marks !== null && 
            r.grade_badge !== 'Absent' && 
            r.status !== 'absent' &&
            r.status !== 'pending'
        )

        const appearedCount = validResults.length
        const absentResults = rawResults.filter(r => r.grade_badge === 'Absent' || r.status === 'absent' || r.awarded_marks === null)
        const pendingResults = rawResults.filter(r => r.status === 'pending' || r.status === 'review')

        const validPercentages = validResults.map(r => Number(r.percentage))
        const avgPercentage = validPercentages.length > 0
            ? Math.round((validPercentages.reduce((a, b) => a + b, 0) / validPercentages.length) * 10) / 10
            : 0

        const highestScore = validPercentages.length > 0 ? Math.max(...validPercentages) : 0
        const lowestScore = validPercentages.length > 0 ? Math.min(...validPercentages) : 0

        const passResults = validResults.filter(r => Number(r.percentage) >= passingPercentage)
        const failResults = validResults.filter(r => Number(r.percentage) < passingPercentage)

        const passCount = passResults.length
        const failCount = failResults.length
        const passPct = appearedCount > 0
            ? Math.round((passCount / appearedCount) * 1000) / 10
            : 0

        // 5. Build Student Performance Ranking Table (Dense / Competition Rank)
        let currentRank = 1
        const studentTable = rawResults.map((rec, idx) => {
            const isAbsent = rec.grade_badge === 'Absent' || rec.status === 'absent' || rec.awarded_marks === null
            const isPending = rec.status === 'pending' || rec.status === 'review'
            const scorePct = rec.percentage !== null ? Number(rec.percentage) : null
            const isPass = scorePct !== null && scorePct >= passingPercentage

            let status = 'Pass'
            if (isAbsent) status = 'Absent'
            else if (isPending) status = 'Result Pending'
            else if (!isPass) status = 'Fail'

            // Dense rank assignment for appeared students
            let rankDisplay = '—'
            if (!isAbsent && !isPending && scorePct !== null) {
                if (idx > 0 && rawResults[idx - 1].percentage === rec.percentage) {
                    rankDisplay = String(currentRank)
                } else {
                    currentRank = idx + 1
                    rankDisplay = String(currentRank)
                }
            }

            const meta = rec.metadata || {}
            const admissionNo = meta.admission_no || meta.admission_number || `ADM-${(rec.student_id || '').slice(0, 5).toUpperCase()}`
            const rollNo = rec.roll_number || meta.roll_no || meta.roll_number || String(idx + 1)
            const stName = rec.full_name || rec.student_name || 'Enrolled Student'

            return {
                id: rec.id || `res-${idx}`,
                student_id: rec.student_id,
                rank: rankDisplay,
                numeric_rank: rankDisplay !== '—' ? Number(rankDisplay) : 999,
                student_name: stName,
                roll_no: rollNo,
                admission_no: admissionNo,
                marks_obtained: isAbsent ? '—' : Number(rec.awarded_marks),
                max_marks: maxMarks,
                percentage: isAbsent ? '—' : `${scorePct}%`,
                raw_percentage: scorePct || 0,
                grade: rec.grade_badge || (isPass ? 'A' : 'F'),
                status: status,
                avatar: stName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            }
        })

        // Sort table: Ranked students first by rank ASC, then Absent / Pending
        studentTable.sort((a, b) => a.numeric_rank - b.numeric_rank)

        // 6. Score Distribution Histogram Buckets (Section 21)
        const buckets = [
            { range: '90–100%', min: 90, max: 100, count: 0, label: 'Distinction' },
            { range: '80–89%', min: 80, max: 89.99, count: 0, label: 'First Class Dist.' },
            { range: '70–79%', min: 70, max: 79.99, count: 0, label: 'First Class' },
            { range: '60–69%', min: 60, max: 69.99, count: 0, label: 'Second Class' },
            { range: '50–59%', min: 50, max: 59.99, count: 0, label: 'Pass Class' },
            { range: 'Below 50%', min: 0, max: 49.99, count: 0, label: 'Needs Focus' }
        ]

        validPercentages.forEach(p => {
            const b = buckets.find(b => p >= b.min && p <= b.max)
            if (b) b.count++
        })

        const scoreDistribution = buckets.map(b => ({
            range: b.range,
            count: b.count,
            percentage: appearedCount > 0 ? Math.round((b.count / appearedCount) * 100) : 0,
            label: b.label
        }))

        // 7. Pass / Fail / Absent Distribution (Section 22)
        const passFailDistribution = [
            { name: 'Pass', value: passCount, percentage: passPct, fill: '#09834F' },
            { name: 'Fail', value: failCount, percentage: appearedCount > 0 ? Math.round((failCount / appearedCount) * 1000) / 10 : 0, fill: '#EF4444' },
            { name: 'Absent', value: absentResults.length, percentage: 0, fill: '#F59E0B' }
        ]

        return NextResponse.json({
            success: true,
            data: {
                filters: {
                    academic_years: academicYears,
                    classes,
                    divisions: availableDivisions.length > 0 ? availableDivisions : [{ id: 'd1', name: 'A' }, { id: 'd2', name: 'B' }],
                    subjects,
                    exams: availableExams
                },
                header: {
                    class_name: selectedClass,
                    division: selectedDivision,
                    subject: selectedSubject,
                    exam_id: activeExam.id,
                    exam_name: activeExam.title,
                    academic_year: academicYears.find(y => y.is_active)?.name || 'Academic Session 2026-27',
                    maximum_marks: maxMarks,
                    passing_marks: passingMarks,
                    exam_date: activeExam.date
                },
                summary: {
                    students_enrolled: Math.max(enrolledStudents.length, rawResults.length),
                    students_appeared: appearedCount,
                    average_percentage: avgPercentage,
                    highest_percentage: highestScore,
                    lowest_percentage: lowestScore,
                    pass_count: passCount,
                    fail_count: failCount,
                    pass_percentage: passPct,
                    absent_count: absentResults.length,
                    pending_count: pendingResults.length
                },
                students: studentTable,
                score_distribution: scoreDistribution,
                pass_fail_distribution: passFailDistribution
            }
        })

    } catch (error: any) {
        console.error('Error fetching class performance report:', error)
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 })
    }
}
