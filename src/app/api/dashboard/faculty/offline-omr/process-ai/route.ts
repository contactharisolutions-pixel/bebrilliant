import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { exam_id, source, image_url } = body // source: 'mobile' or 'bulk'

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner', 'teacher'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 1. Log Upload
        const { data: upload } = await supabaseAdmin
            .from('omr_uploads')
            .insert({
                tenant_id: profile.tenant_id,
                exam_id,
                uploaded_by: user.id,
                file_url: image_url || 'simulated_camera_path.jpg',
                source: source || 'mobile',
                status: 'processing'
            })
            .select()
            .single()

        if (!upload) throw new Error('Upload log failed')

        // 2. Fetch Exam Data & Answer Key
        const { data: questions } = await supabaseAdmin
            .from('offline_exam_questions')
            .select('question_no, questions(correct_answer)')
            .eq('exam_id', exam_id)

        // 3. SIMULATED AI PIPELINE (QR Detect -> Crop -> Align -> Bubble Detect -> AI Classify)
        // Simulate detection of ONE sheet (Mobile scan context)
        const { data: sheet } = await supabaseAdmin
            .from('omr_sheets')
            .select('*')
            .eq('exam_id', exam_id)
            .limit(1)
            .single()

        if (!sheet) throw new Error('No OMR metadata found for this cohort')

        const aiResults = []
        const responses = []
        let correctCount = 0

        for (const q of (questions || [])) {
            const confidence = 60 + Math.random() * 40
            const needsReview = confidence < 85
            
            // Handle possibility of array or object from join
            const qData: any = q.questions
            const correctAnswer = Array.isArray(qData) ? qData[0]?.correct_answer : qData?.correct_answer
            
            // Simulation: 90% correct model prediction
            const isCorrect = Math.random() > 0.1
            const selected = isCorrect ? correctAnswer : 'C'

            if (isCorrect) correctCount++

            aiResults.push({
                tenant_id: profile.tenant_id,
                upload_id: upload.id,
                sheet_id: sheet.id,
                question_no: q.question_no,
                detected_option: selected,
                confidence: confidence,
                needs_review: needsReview
            })

            responses.push({
                tenant_id: profile.tenant_id,
                exam_id,
                student_id: sheet.student_id,
                question_no: q.question_no,
                selected_option: selected,
                is_correct: isCorrect,
                marks: isCorrect ? 4 : -1,
                confidence: confidence
            })
        }

        // 4. Batch Inserts
        await supabaseAdmin.from('omr_ai_results').insert(aiResults)
        await supabaseAdmin.from('omr_responses').upsert(responses, { onConflict: 'exam_id,student_id,question_no' })

        // 5. Update Global Result & Finalize Upload
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

        await supabaseAdmin
            .from('omr_uploads')
            .update({ status: 'completed', processed_sheets: 1, processed: true })
            .eq('id', upload.id)

        return NextResponse.json({ 
            success: true, 
            upload_id: upload.id,
            sheet_mapped: sheet.seat_number,
            low_confidence_count: aiResults.filter(r => r.needs_review).length 
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
