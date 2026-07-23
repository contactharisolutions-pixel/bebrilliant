import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { exam_id, answers } = await request.json()
        if (!exam_id) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })

        // 1. Fetch Custom Exam
        const { data: exam, error: examErr } = await supabaseAdmin
            .from('student_custom_exams')
            .select('*')
            .eq('id', exam_id)
            .eq('student_id', user.id)
            .single()

        if (examErr || !exam) return NextResponse.json({ error: 'Custom exam not found' }, { status: 404 })
        if (exam.status === 'completed') return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 })

        // 2. Fetch Questions
        const { data: questions } = await supabaseAdmin
            .from('student_custom_exam_questions')
            .select('*')
            .eq('exam_id', exam_id)

        const questionsList = questions || []
        let totalScore = 0
        let correctCount = 0
        const totalMarks = questionsList.length * 1 // assuming 1 mark per custom question

        const answerRecords = questionsList.map(q => {
            const studentAns = answers[q.id]
            const correctAns = q.answer
            const isCorrect = studentAns !== undefined && studentAns !== null &&
                (studentAns.toString().trim().toLowerCase() === correctAns.toString().trim().toLowerCase())

            if (isCorrect) {
                totalScore += Number(q.marks || 1)
                correctCount++
            }

            return {
                question_id: q.id,
                selected_answer: studentAns || null,
                is_correct: isCorrect,
                correct_answer: correctAns
            }
        })

        // 3. Update Custom Exam Status
        const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0

        const { error: updateErr } = await supabaseAdmin
            .from('student_custom_exams')
            .update({
                status: 'completed',
                score: totalScore,
                answers_json: JSON.stringify(answerRecords)
            })
            .eq('id', exam_id)

        if (updateErr) throw updateErr

        // 4. Save to student_performance for reports
        await supabaseAdmin.from('student_performance').insert({
            student_id: user.id,
            exam_id: null, // Avoid FK violations
            marks_obtained: totalScore,
            total_marks: totalMarks,
            percentage,
            exam_date: new Date().toISOString(),
            subject: exam.subject || 'General',
            chapter: exam.chapter || 'Foundations',
            topic: exam.topic || 'Core Concepts'
        })

        return NextResponse.json({
            success: true,
            score: totalScore,
            total_marks: totalMarks,
            correct: correctCount,
            percentage
        })

    } catch (e: any) {
        console.error('Custom exam submit error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
