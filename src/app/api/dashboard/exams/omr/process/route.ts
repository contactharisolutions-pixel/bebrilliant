import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'
import { analyzeImage } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { tenant_id } = session
    const body = await request.json()
    const { examId, imageBase64 } = body

    try {
        // 1. Prompt Gemini for OMR Detection
        const prompt = `
            Analyze this OMR sheet image for an academic exam.
            Identify:
            1. Roll Number: Look for the 'ROLL NUMBER' section and detect which bubbles (0-9) are darkened in each of the columns. Return as a string.
            2. Answers: For each question row (001, 002, etc.), identify which bubble (A, B, C, or D) is filled.
            3. Confidence: Return a score from 0-100 indicating how clear the markings are.
            
            Return ONLY a JSON object in this format:
            {
                "rollNumber": "12345678",
                "answers": { "1": "A", "2": "B", ... },
                "confidence": 98
            }
        `;

        const aiResponse = await analyzeImage(prompt, imageBase64)
        const result = JSON.parse(aiResponse || '{}')

        // 2. Identify Student by Roll Number (Simulated/Mock logic)
        // In a real system, you'd match rollNumber to a student profile in the tenant
        
        // 3. Save to omr_sheets
        const { data: sheet, error: sErr } = await supabaseAdmin.from('omr_sheets').insert([{
            tenant_id,
            exam_id: examId,
            student_id: '00000000-0000-0000-0000-000000000000', // Placeholder
            processed_data: result,
            confidence_score: result.confidence,
            status: result.confidence > 90 ? 'processed' : 'review'
        }]).select().single()

        if (sErr) throw sErr

        return NextResponse.json({ success: true, data: result, sheetId: sheet.id })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
