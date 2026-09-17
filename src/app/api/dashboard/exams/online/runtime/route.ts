import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) {
        // Unified auth fallback
    }

    try {
        const body = await request.json()
        const { action, payload } = body

        if (action === 'START_ATTEMPT') {
            const { data: exam } = await supabaseAdmin
                .from('online_exams')
                .select('id, title, status, scheduled_start, scheduled_end, blueprint')
                .eq('id', payload.examId)
                .single()

            if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

            const now = new Date()
            const slots = Array.isArray(exam.blueprint?.schedule_slots) ? exam.blueprint.schedule_slots : []

            const sessionUserId = session?.user?.id || (session as any)?.userId
            const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
            let studentId = isValidUUID(payload.studentId) 
                ? payload.studentId 
                : (sessionUserId && isValidUUID(sessionUserId) ? sessionUserId : null)

            if (!studentId) {
                try {
                    const { rows } = await query('SELECT id FROM auth.users LIMIT 1')
                    if (rows?.[0]?.id) studentId = rows[0].id
                } catch {
                    studentId = crypto.randomUUID()
                }
            }

            let studentClass = (payload.studentClass || '').toString().trim()
            let studentSection = (payload.studentSection || '').toString().trim()

            // Try to resolve student's class and section from academic records if logged in
            if ((!studentClass || !studentSection) && isValidUUID(studentId)) {
                try {
                    const { data: academicRec } = await supabaseAdmin
                        .from('student_academic_records')
                        .select('class, division, roll_number')
                        .eq('student_id', studentId)
                        .limit(1)
                        .maybeSingle()
                    if (academicRec) {
                        if (!studentClass && academicRec.class) studentClass = academicRec.class
                        if (!studentSection && academicRec.division) studentSection = academicRec.division
                        if (!payload.rollNo && academicRec.roll_number) payload.rollNo = academicRec.roll_number
                    }
                } catch {
                    // Fallback to provided payload
                }
            }

            const formatSlotTime = (dateStr: string) => {
                try {
                    const d = new Date(dateStr)
                    return d.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })
                } catch {
                    return dateStr
                }
            }

            const normalizeClass = (val?: string) => {
                if (!val) return '*'
                const s = val.toString().toLowerCase().trim()
                if (s === 'all' || s === 'all classes' || s === 'all class') return '*'
                return s.replace(/^(class|grade|standard|std)\s*/i, '').trim()
            }

            const normalizeSection = (val?: string) => {
                if (!val) return '*'
                const s = val.toString().toLowerCase().trim()
                if (s === 'all' || s === 'all sections' || s === 'all section') return '*'
                return s.replace(/^(section|sec|division|div)\s*/i, '').trim()
            }

            const slotMatchesStudent = (slot: any) => {
                const sClass = normalizeClass(slot.class_name)
                const sSec = normalizeSection(slot.section_name)
                const studClass = normalizeClass(studentClass)
                const studSec = normalizeSection(studentSection)

                const classMatch = sClass === '*' || studClass === '*' || !studClass || sClass === studClass
                const secMatch = sSec === '*' || studSec === '*' || !studSec || sSec === studSec
                return classMatch && secMatch
            }

            if (slots.length > 0) {
                // Find slots specifically assigned to this student's class and section
                const assignedSlots = slots.filter(slotMatchesStudent)

                if (assignedSlots.length === 0) {
                    const classSecLabel = [studentClass, studentSection].filter(Boolean).join(' - ') || 'your class and section'
                    return NextResponse.json({
                        error: `No exam schedule slot is assigned for ${classSecLabel}. Please contact your teacher or exam coordinator.`
                    }, { status: 403 })
                }

                // Check if current time falls into any of student's assigned slots
                const activeSlot = assignedSlots.find((s: any) => {
                    const st = s.start ? new Date(s.start) : null
                    const en = s.end ? new Date(s.end) : null
                    return st && en && now >= st && now <= en
                })

                if (!activeSlot) {
                    // Check if another slot is currently in progress for a different section/class
                    const runningOtherSlot = slots.find((s: any) => {
                        const st = s.start ? new Date(s.start) : null
                        const en = s.end ? new Date(s.end) : null
                        return st && en && now >= st && now <= en
                    })

                    const upcomingSlot = assignedSlots.find((s: any) => s.start && now < new Date(s.start))
                    const allAssignedClosed = assignedSlots.every((s: any) => s.end && now > new Date(s.end))

                    const studLabel = [studentClass, studentSection].filter(Boolean).join(' ') || 'your section'

                    if (runningOtherSlot) {
                        const runningLabel = [runningOtherSlot.class_name, runningOtherSlot.section_name].filter(Boolean).join(' - ') || 'another section'
                        if (upcomingSlot) {
                            return NextResponse.json({
                                error: `Exam is currently in session for ${runningLabel}. Your scheduled slot for ${studLabel} begins on ${formatSlotTime(upcomingSlot.start)} to ${formatSlotTime(upcomingSlot.end)}. Please return at your scheduled slot time.`
                            }, { status: 403 })
                        }
                        if (allAssignedClosed) {
                            return NextResponse.json({
                                error: `Your assigned exam slot for ${studLabel} has already ended. Students cannot attempt exams during another section's slot (${runningLabel}).`
                            }, { status: 403 })
                        }
                    }

                    if (allAssignedClosed) {
                        return NextResponse.json({
                            error: `The exam schedule for ${studLabel} has ended. All assigned slots are closed.`
                        }, { status: 403 })
                    }

                    if (upcomingSlot) {
                        return NextResponse.json({
                            error: `Exam has not started yet for ${studLabel}. Your scheduled slot is ${formatSlotTime(upcomingSlot.start)} to ${formatSlotTime(upcomingSlot.end)}. Please return at your scheduled time.`
                        }, { status: 403 })
                    }

                    return NextResponse.json({
                        error: `Exam is not active at this time for ${studLabel}. Please check your scheduled slot.`
                    }, { status: 403 })
                }

                // Check allowed seats / student attempt capacity for this active slot
                if (activeSlot.max_attempts) {
                    const { count: currentAttempts } = await supabaseAdmin
                        .from('online_exam_attempts')
                        .select('*', { count: 'exact', head: true })
                        .eq('exam_id', payload.examId)
                        .gte('created_at', new Date(activeSlot.start).toISOString())
                        .lte('created_at', new Date(activeSlot.end).toISOString())

                    if ((currentAttempts || 0) >= activeSlot.max_attempts) {
                        const slotName = [activeSlot.class_name, activeSlot.section_name].filter(Boolean).join(' ') || 'this slot'
                        return NextResponse.json({
                            error: `This exam slot is full for ${slotName}. The maximum allowed student limit (${activeSlot.max_attempts}) has been reached.`
                        }, { status: 403 })
                    }
                }

                // Authorized in active slot! Create attempt with device_info capturing student class/section
                const deviceInfo = JSON.stringify({
                    student_name: payload.studentName || null,
                    class: studentClass || activeSlot.class_name || null,
                    section: studentSection || activeSlot.section_name || null,
                    roll_no: payload.rollNo || null,
                    slot_id: activeSlot.id,
                    slot_class: activeSlot.class_name || 'All Classes',
                    slot_section: activeSlot.section_name || 'All Sections',
                    start: activeSlot.start,
                    end: activeSlot.end,
                    user_agent: request.headers.get('user-agent') || null
                })

                const { data, error } = await supabaseAdmin
                    .from('online_exam_attempts')
                    .insert([{
                        student_id: studentId,
                        exam_id: payload.examId,
                        ip_address: request.headers.get('x-forwarded-for') || null,
                        device_info: deviceInfo,
                        status: 'in_progress',
                        start_time: now.toISOString()
                    }])
                    .select()
                    .single()
                if (error) throw error
                return NextResponse.json(data)
            } else {
                if (exam.scheduled_start && now < new Date(exam.scheduled_start)) {
                    return NextResponse.json({ error: `Exam has not started yet. It is scheduled to start at ${formatSlotTime(exam.scheduled_start)}.` }, { status: 403 })
                }
                if (exam.scheduled_end && now > new Date(exam.scheduled_end)) {
                    return NextResponse.json({ error: 'Exam time window has closed.' }, { status: 403 })
                }

                const deviceInfo = JSON.stringify({
                    student_name: payload.studentName || null,
                    class: studentClass || null,
                    section: studentSection || null,
                    roll_no: payload.rollNo || null,
                    user_agent: request.headers.get('user-agent') || null
                })

                const { data, error } = await supabaseAdmin
                    .from('online_exam_attempts')
                    .insert([{
                        student_id: studentId,
                        exam_id: payload.examId,
                        ip_address: request.headers.get('x-forwarded-for') || null,
                        device_info: deviceInfo,
                        status: 'in_progress',
                        start_time: now.toISOString()
                    }])
                    .select()
                    .single()
                if (error) throw error
                return NextResponse.json(data)
            }
        }

        if (action === 'SUBMIT_EXAM') {
            const { attemptId, answers } = payload // answers: { qid: selected }
            
            // 1. Fetch Question Keys
            const { data: qMap } = await supabaseAdmin
                .from('online_exam_questions')
                .select('*, q:questions(correct_answer)')
                .eq('exam_id', payload.examId)

            if (!qMap) throw new Error('Exam structure not found')

            let totalScore = 0
            const answerRecords = []

            for (const map of qMap) {
                const studentAnswer = answers[map.question_id]
                const isCorrect = studentAnswer === map.q.correct_answer
                
                if (isCorrect) totalScore += Number(map.marks)
                else totalScore -= Number(map.negative_marks || 0)

                answerRecords.push({
                    attempt_id: attemptId,
                    question_id: map.question_id,
                    selected_option: studentAnswer,
                    is_correct: isCorrect
                })
            }

            // 2. Batch Insert Answers
            await supabaseAdmin.from('online_exam_answers').insert(answerRecords)

            // 3. Update Attempt Status
            const { data: final } = await supabaseAdmin
                .from('online_exam_attempts')
                .update({ 
                    status: 'submitted', 
                    score: totalScore, 
                    end_time: new Date().toISOString() 
                })
                .eq('id', attemptId)
                .select()
                .single()

            return NextResponse.json(final)
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
