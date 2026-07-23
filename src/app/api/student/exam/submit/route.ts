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

        // 1. Fetch Exam Detail to evaluate
        const { data: exam } = await supabaseAdmin
            .from('exams')
            .select('*')
            .eq('id', exam_id)
            .single()

        if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

        let meta: any = {}
        try { meta = JSON.parse(exam.description || '{}') } catch (e) {}

        const examQuestions = meta.questions || []
        let totalScore = 0
        let correctCount = 0
        const totalMarks = Number(meta.marks || 100)
        const answerRecords: any[] = []

        examQuestions.forEach((q: any) => {
            const studentAns = answers[q.id]
            const correctAns = q.answer
            const isCorrect = studentAns !== undefined && studentAns !== null && 
                (studentAns.toString().trim().toLowerCase() === correctAns.toString().trim().toLowerCase())

            if (isCorrect) {
                totalScore += Number(q.marks || 4)
                correctCount++
            } else if (studentAns !== undefined && studentAns !== null && studentAns !== '') {
                // Apply negative markings if configured
                totalScore -= Number(meta.negative_marks || 0)
            }

            answerRecords.push({
                question_id: q.id,
                selected_answer: studentAns || null,
                is_correct: isCorrect,
                correct_answer: correctAns
            })
        })

        // 2. Update Attempt status in database
        const { error: updateErr } = await supabaseAdmin
            .from('exam_attempts')
            .update({
                status: 'submitted',
                end_time: new Date().toISOString(),
                total_score: totalScore,
                answers: answerRecords
            })
            .eq('exam_id', exam_id)
            .eq('student_id', user.id)
            .eq('status', 'in_progress')

        if (updateErr) throw updateErr

        // 3. Resolve subject name
        let subjectName = 'General'
        if (meta.syllabus_id) {
            const { data: node } = await supabaseAdmin
                .from('syllabus_nodes')
                .select('name')
                .eq('id', meta.syllabus_id)
                .single()
            if (node) subjectName = node.name
        }

        // 4. Save into student_performance table for report dashboard
        const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0
        await supabaseAdmin.from('student_performance').insert({
            student_id: user.id,
            exam_id,
            marks_obtained: totalScore,
            total_marks: totalMarks,
            percentage,
            exam_date: new Date().toISOString(),
            subject: subjectName
        })

        return NextResponse.json({
            success: true,
            score: totalScore,
            total_marks: totalMarks,
            correct: correctCount,
            percentage
        })

    } catch (e: any) {
        console.error('Submit Exam error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
