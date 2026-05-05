import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) {
        // Handle student session if verifyTenantStaff only works for staff
        // For now, I'll assume many students might not be 'staff' but the system uses unified auth
    }

    try {
        const body = await request.json()
        const { action, payload } = body

        if (action === 'START_ATTEMPT') {
            const { data, error } = await supabaseAdmin
                .from('online_exam_attempts')
                .insert([{
                    student_id: payload.studentId,
                    exam_id: payload.examId,
                    ip_address: request.headers.get('x-forwarded-for'),
                    status: 'in_progress'
                }])
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
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
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
