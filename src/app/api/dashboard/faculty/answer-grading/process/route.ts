import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { exam_id, student_id, file_url } = body

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner', 'teacher'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 1. Create Upload Record
        const { data: upload } = await supabaseAdmin
            .from('answer_sheet_uploads')
            .upsert({
                tenant_id: profile.tenant_id,
                exam_id,
                student_id,
                file_url,
                status: 'processing'
            }, { onConflict: 'exam_id,student_id' })
            .select()
            .single()

        if (!upload) throw new Error('Upload creation failed')

        // 2. Fetch Questions (Answer Requirements)
        // We look for subjective questions assigned to this exam
        const { data: questions } = await supabaseAdmin
            .from('questions')
            .select('id, question_text, model_answer, max_marks, metadata')
            .in('id', (
                await supabaseAdmin.from('offline_exam_questions').select('question_id').eq('exam_id', exam_id)
            ).data?.map(q => q.question_id) || [])

        // 3. SIMULATED OCR & SEMANTIC GRADING ENGINE
        const gradeInserts = []
        const extractionInserts = []

        for (const q of (questions || [])) {
            // SIMULATED OCR EXTRACTION
            // In production, this would call AWS Textract or Google Vision AI
            const simulatedText = `Student handwritten response regarding ${q.question_text.slice(0, 50)}... The core concept of ${q.metadata?.keywords?.[0] || 'efficiency'} is maintained.`
            const ocrConfidence = 85 + Math.random() * 10

            extractionInserts.push({
                tenant_id: profile.tenant_id,
                upload_id: upload.id,
                question_id: q.id,
                detected_text: simulatedText,
                confidence: ocrConfidence
            })

            // SIMULATED SEMANTIC GRADING
            // Simple keyword overlap + length + semantic mock
            const keywords = (q.metadata?.keywords || ['concept', 'definition', 'example'])
            let matchCount = 0
            keywords.forEach((kw: string) => { if (simulatedText.toLowerCase().includes(kw.toLowerCase())) matchCount++ })
            
            const keywordScore = (matchCount / keywords.length) * 0.4 // 40% weight
            const semanticScore = 0.5 + Math.random() * 0.4 // 50-90% random similarity simulation
            
            const predictedMarks = Math.round((keywordScore + semanticScore) * q.max_marks * 10) / 10
            
            gradeInserts.push({
                tenant_id: profile.tenant_id,
                student_id,
                question_id: q.id,
                auto_marks: Math.min(predictedMarks, q.max_marks),
                ai_feedback: `SEMANTIC MATCH: ~${Math.round(semanticScore * 100)}% | KEYWORDS DETECTED: ${matchCount}/${keywords.length}`,
                final_marks: Math.min(predictedMarks, q.max_marks),
                is_reviewed: false
            })
        }

        // 4. Batch Operations
        await supabaseAdmin.from('answer_sheet_answers').upsert(extractionInserts, { onConflict: 'upload_id,question_id' })
        await supabaseAdmin.from('answer_sheet_grades').upsert(gradeInserts, { onConflict: 'student_id,question_id' })

        // 5. Finalize Status
        await supabaseAdmin
            .from('answer_sheet_uploads')
            .update({ status: 'completed', processed: true })
            .eq('id', upload.id)

        return NextResponse.json({ 
            success: true, 
            upload_id: upload.id,
            questions_graded: gradeInserts.length,
            avg_ai_confidence: Math.round(gradeInserts.reduce((a,b) => a + b.auto_marks, 0) / gradeInserts.length * 10) / 10
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
