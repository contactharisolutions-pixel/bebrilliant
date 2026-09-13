import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner', 'admin', 'teacher'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden: Requires admin or teacher role' }, { status: 403 })
        }

        const body = await request.json().catch(() => ({}))
        const { action = 'generate_quiz', prompt = '', subject = 'General Science', grade = 'Class 10', count = 3 } = body

        const openai = getOpenAIClient()

        let systemPrompt = ''
        let userPrompt = ''

        if (action === 'generate_quiz') {
            systemPrompt = `You are an expert CBSE/ICSE academic curriculum designer and assessment author for EduBrilliant institutional platform.
Generate exactly ${count} multiple choice questions for ${grade} in ${subject}.
Return ONLY valid JSON matching this exact structure (no markdown, no backticks):
{
  "questions": [
    {
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Clear explanation of why this answer is correct..."
    }
  ]
}`
            userPrompt = prompt ? `Topic / Focus: ${prompt}` : `Create comprehensive conceptual questions for ${grade} ${subject}.`
        } else if (action === 'draft_circular') {
            systemPrompt = `You are an executive administrator for a premier Indian K-12 private school.
Draft a professional, authoritative, warm circular/notice for students and parents.
Return ONLY valid JSON matching this exact structure:
{
  "title": "Clear concise notice title",
  "category": "Examinations | Academic | Circular",
  "content": "Official circular body text formatted with paragraphs and bullet points...",
  "action_required": "Summary of next action for parents/students",
  "date": "${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}"
}`
            userPrompt = prompt ? `Notice Brief: ${prompt}` : `Draft an upcoming Term-1 Examination Guidelines circular.`
        } else {
            // General academic insight
            systemPrompt = `You are a strategic school education advisor for an institutional administrator. Provide high-impact operational advice.
Return ONLY valid JSON:
{
  "summary": "Key strategic takeaway in 2 sentences",
  "priorities": ["Priority 1", "Priority 2", "Priority 3"],
  "recommendation": "Actionable next step for school principal"
}`
            userPrompt = prompt || 'Analyze readiness for a newly onboarded school with Standard Plan capacity (1,000 students).'
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 0.3,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })

        const rawContent = completion.choices?.[0]?.message?.content || '{}'
        const parsed = JSON.parse(rawContent)

        return NextResponse.json({
            success: true,
            action,
            data: parsed,
            model: 'gpt-4o',
            timestamp: new Date().toISOString()
        })
    } catch (e: any) {
        console.error('[admin/ai/copilot] Error:', e)
        return NextResponse.json({ error: e.message || 'AI generation failed' }, { status: 500 })
    }
}
