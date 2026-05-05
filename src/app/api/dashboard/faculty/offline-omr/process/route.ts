import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { upload_id, exam_id } = body

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner', 'teacher'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 1. Fetch Upload Record
        const { data: upload } = await supabaseAdmin
            .from('omr_uploads')
            .select('*')
            .eq('id', upload_id)
            .single()

        if (!upload) return NextResponse.json({ error: 'Upload not found' }, { status: 404 })

        // 2. Fetch Exam Questions (Answer Key)
        const { data: questions } = await supabaseAdmin
            .from('offline_exam_questions')
            .select('question_no, question_id, questions(correct_answer)')
            .eq('exam_id', exam_id)
            .order('question_no', { ascending: true })

        // 3. SIMULATED OMR PROCESSING
        // In a real environment, this would call an OpenCV/Python microservice via a queue or HTTP.
        // For this implementation, we simulate processing sheets for the class.
        
        const { data: sheets } = await supabaseAdmin
            .from('omr_sheets')
            .select('*')
            .eq('exam_id', exam_id)

        let processed = 0
        
        for (const sheet of (sheets || [])) {
            let correctCount = 0
            
            // Loop through questions and simulate correct/random selections
            const responses = (questions || []).map((q: any) => {
                // Simulation: 80% chance of correct answer for demo purposes
                const isCorrect = Math.random() > 0.2
                const selected = isCorrect ? q.questions.correct_answer : 'B' // Fallback
                
                if (isCorrect) correctCount++
                
                return {
                    tenant_id: profile.tenant_id,
                    exam_id,
                    student_id: sheet.student_id,
                    question_no: q.question_no,
                    selected_option: selected,
                    is_correct: isCorrect,
                    marks: isCorrect ? 4 : -1, // Assuming +4/-1 marking
                    confidence: 95 + Math.random() * 5
                }
            })

            // Store Responses
            await supabaseAdmin.from('omr_responses').upsert(responses, { onConflict: 'exam_id,student_id,question_no' })

            // Create/Update Result
            const totalMarks = responses.reduce((acc, curr) => acc + curr.marks, 0)
            await supabaseAdmin.from('offline_exam_results').upsert({
                tenant_id: profile.tenant_id,
                exam_id,
                student_id: sheet.student_id,
                total_marks: totalMarks,
                correct: correctCount,
                wrong: responses.length - correctCount,
                percentage: (correctCount / responses.length) * 100
            }, { onConflict: 'exam_id,student_id' })

            processed++
        }

        // 4. Finalize Upload status
        await supabaseAdmin
            .from('omr_uploads')
            .update({ status: 'completed', processed_sheets: processed, processed: true })
            .eq('id', upload_id)

        return NextResponse.json({ success: true, processed })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
