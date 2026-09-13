import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/ai/openai'

function getSamplePreviewData(action: string, subject: string, grade: string) {
    if (action === 'generate_quiz') {
        return {
            questions: [
                {
                    question: `In CBSE ${grade} ${subject}, which process best illustrates Newton's Third Law in action?`,
                    options: [
                        'A rocket propelling forward by expelling exhaust gases downward',
                        'A car decelerating due to friction without applying brakes',
                        'An apple accelerating towards the ground under gravity',
                        'A body remaining at rest on a frictionless surface'
                    ],
                    correct_index: 0,
                    explanation: 'The expulsion of exhaust gases downward exerts an equal and opposite upward thrust on the rocket.'
                },
                {
                    question: `Which fundamental principle is evaluated during high-frequency diagnostic assessments in ${subject}?`,
                    options: [
                        'Rote memorization of numerical constants',
                        'Conceptual mastery and logical deduction under applied contexts',
                        'Speed of hand-written calculations without units',
                        'Reproduction of verbatim textbook definitions'
                    ],
                    correct_index: 1,
                    explanation: 'Competency-based assessment frameworks evaluate deep conceptual understanding and application over rote recall.'
                },
                {
                    question: `When preparing for CBSE Board Examinations in ${subject}, what is the primary purpose of pre-board mock testing?`,
                    options: [
                        'To identify individual subject-matter gap areas and refine time allocation',
                        'To finalize final term report cards prematurely',
                        'To reduce the total number of school instructional days',
                        'To replace classroom syllabus coverage'
                    ],
                    correct_index: 0,
                    explanation: 'Mock examinations serve as formative diagnostics allowing students and teachers to remediate specific weak competencies.'
                }
            ]
        }
    } else if (action === 'draft_circular') {
        return {
            title: `Term-1 Examination Guidelines & Academic Conduct (${grade})`,
            category: 'Examinations',
            content: `Dear Parents and Students,\n\nAs we approach the Term-1 Assessments, the Academic Directorate has finalized the examination schedule, syllabus blueprints, and proctoring protocol.\n\nStudents are advised to review the chapter-wise weightage and ensure attendance in all revision clinics organized this week. Hall tickets will be issued through the student portal.\n\nLet us maintain rigorous focus and academic integrity throughout this cycle.`,
            action_required: 'Parents are requested to acknowledge the examination circular in the portal before Friday.',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        }
    } else {
        return {
            summary: 'Institutional licensure and capacity metrics indicate excellent headroom with standard onboarding benchmarks on track.',
            priorities: [
                'Complete faculty profile onboarding to activate department-level exam authorizations.',
                'Trigger the 1-Click Starter Demo Roster to run an end-to-end diagnostic assessment.',
                'Publish the Term-1 assessment blueprint to the student mobile app and portal.'
            ],
            recommendation: 'Initiate a baseline CBT or OMR mock assessment to validate optical scanning and latency before the official examination term.'
        }
    }
}

export async function POST(request: NextRequest) {
    let action = 'generate_quiz'
    let subject = 'General Science'
    let grade = 'Class 10'

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
        action = body.action || 'generate_quiz'
        subject = body.subject || 'General Science'
        grade = body.grade || 'Class 10'
        const prompt = body.prompt || ''
        const count = body.count || 3

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
        const isQuotaOrCredit = e?.status === 429 || 
            e?.code === 'credit_balance_exhausted' || 
            e?.type === 'insufficient_quota' ||
            e?.message?.includes('credits') || 
            e?.message?.includes('quota')
        if (isQuotaOrCredit) {
            const fallbackData = getSamplePreviewData(action, subject, grade)
            return NextResponse.json({
                success: true,
                action,
                data: fallbackData,
                model: 'gpt-4o (curated preview)',
                warning: 'OpenAI API quota or credit balance is currently exhausted on this API key. Showing curated curriculum preview. Please recharge credits at https://platform.openai.com/settings/organization/billing/.',
                timestamp: new Date().toISOString()
            })
        }
        return NextResponse.json({ error: e.message || 'AI generation failed' }, { status: 500 })
    }
}
