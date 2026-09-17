import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ── Master Gemini AI Question Generator for BeBrilliant Platform ──────────────
// Strictly adheres to GEMINI_AI_QUESTION_PREPARATION_RULES.md and GEMINI_AI_QUESTION_PREPARATION_SKILL.md
const GEMINI_MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]

async function generateQuestionsWithGemini(params: {
    subject_name: string
    class_name: string
    syllabus_name: string
    pattern_name?: string
    section_name?: string
    chapters: string[]
    topics: string[]
    count: number
    marks: number
    negative_marks: number
    question_type: string
    difficulty: string
    language: string
}) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured in environment variables.')
    }

    const {
        subject_name,
        class_name,
        syllabus_name,
        pattern_name,
        section_name = 'Section A',
        chapters,
        topics,
        count,
        marks,
        negative_marks,
        question_type,
        difficulty,
        language
    } = params

    const combinedTopicStr = [
        chapters.length > 0 ? `Chapters: ${chapters.join(', ')}` : '',
        topics.length > 0 ? `Topics: ${topics.join(', ')}` : ''
    ].filter(Boolean).join(' | ') || 'Core Prescribed Curriculum'

    const prompt = `
You are the Gemini AI Question Preparation Agent for the BeBrilliant Examination Platform, adhering strictly to Indian curriculum standards (CBSE / State Boards).

Generate exactly ${count} distinct, high-quality, syllabus-aligned examination questions strictly adhering to the parameters below:

ACADEMIC CONTEXT & BLUEPRINT:
- Board / Curriculum: ${syllabus_name}
- Class / Grade: ${class_name}
- Subject: ${subject_name}
- Target Chapters & Topics: ${combinedTopicStr}
${pattern_name ? `- Exam Pattern: ${pattern_name}` : ''}
- Section: ${section_name} (${marks} Marks per question, ${negative_marks} Negative Marks)
- Question Format: ${question_type === 'subjective' ? 'Subjective (Short/Long Answer, Descriptive)' : 'Objective (Multiple Choice Questions with 4 distinct options)'}
- Difficulty Level: ${difficulty} (easy = foundational concept, medium = standard school board level, hard = higher-order thinking skill / HOTS)
- Medium / Language: ${language}

MANDATORY RULES (Strictly Follow These Rules):
1. EASY, SIMPLE, AND CLEAN ENGLISH (MANDATORY RULE 24 & SKILL 31):
   - All questions and options MUST use short, direct, clear, and natural English suitable for Indian school students of ${class_name}.
   - Use familiar school-level vocabulary. Ask one clear thing at a time with unambiguous wording.
   - Strictly avoid unnecessary academic jargon, complex passive sentence structures, and decorative vocabulary.
   - Difficulty must come from the concept and application, NEVER from difficult English.
2. SYLLABUS & SUBJECT PRESERVATION (RULE 13):
   - Every question MUST be strictly and exclusively for "${subject_name}" for ${class_name}.
   - NEVER generate questions for Mathematics or any other subject when "${subject_name}" is requested.
   - If chapters are specified (${chapters.join(', ') || 'prescribed syllabus'}), all questions must be derived from these chapters.
3. FRESHNESS & NON-REPETITION (RULE 2):
   - Generate fresh, original questions. Do not repeat question phrasing or standard clichés.
4. ANSWER INTEGRITY (RULE 9 & 10):
   - For MCQs: Provide exactly 4 realistic, plausible options. Exactly ONE option must be unambiguously correct.
   - Provide a clear, student-friendly explanation showing the direct reasoning or solution step.
5. NO HARDCODED OR PLACEHOLDER DATA:
   - Generate authentic, accurate questions matching the syllabus.

OUTPUT FORMAT:
Respond ONLY with a valid JSON array of objects without any markdown wrappers (no \`\`\`json, no backticks, no comments).
Exact schema for each item:
[
  {
    "section": "${section_name}",
    "subject": "${subject_name}",
    "topic": "Name of specific chapter or topic",
    "type": "${question_type}",
    "sub_type": "${question_type === 'subjective' ? 'descriptive' : 'mcq'}",
    "difficulty": "${difficulty}",
    "marks": ${marks},
    "negative_marks": ${negative_marks},
    "text": "Clearly written question text in simple English",
    "options": ${question_type === 'subjective' ? 'null' : '["Option A", "Option B", "Option C", "Option D"]'},
    "correct_answer": "Exact text of the correct option",
    "explanation": "Concise step-by-step rationale in simple English"
  }
]
`

    const genAI = new GoogleGenerativeAI(apiKey)
    let lastErr: any = null

    for (const modelName of GEMINI_MODELS_TO_TRY) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName })
            const result = await model.generateContent(prompt)
            const text = result.response.text()
            if (!text) continue

            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
            const match = cleanJson.match(/\[[\s\S]*\]/)
            const jsonStr = match ? match[0] : cleanJson
            const questions = JSON.parse(jsonStr)

            if (Array.isArray(questions) && questions.length > 0) {
                // Ensure proper formatting, fields, and globally unique IDs
                const secSlug = (section_name || 'sec').toLowerCase().replace(/[^a-z0-9]/g, '_')
                const timestamp = Date.now()
                return questions.map((q: any, idx: number) => {
                    const uniqueSuffix = Math.random().toString(36).substring(2, 8)
                    return {
                        id: `gen_${secSlug}_${timestamp}_${idx + 1}_${uniqueSuffix}`,
                        section: q.section || section_name,
                        subject: q.subject || subject_name,
                        topic: q.topic || combinedTopicStr,
                        type: q.type || question_type,
                        sub_type: q.sub_type || (question_type === 'subjective' ? 'descriptive' : 'mcq'),
                        difficulty: q.difficulty || difficulty,
                        marks: Number(q.marks) || marks,
                        negative_marks: Number(q.negative_marks) || negative_marks,
                        text: q.text || q.question_text || '',
                        question_text: q.text || q.question_text || '',
                        options: Array.isArray(q.options) ? q.options : (question_type === 'subjective' ? null : ['Option A', 'Option B', 'Option C', 'Option D']),
                        correct_answer: q.correct_answer || '',
                        explanation: q.explanation || ''
                    }
                })
            }
        } catch (err: any) {
            lastErr = err
            console.warn(`[GeminiAI] Model ${modelName} attempt failed:`, err?.message?.split('\n')[0])
        }
    }

    throw new Error(lastErr?.message || 'Gemini AI was unable to generate questions. Please verify your connection or API key.')
}

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        const tenantId = session?.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        // 1. Fetch Question Counts & Statistics
        const statsQuery = `
            SELECT 
                COUNT(*) AS total_questions,
                COUNT(*) FILTER (WHERE type = 'objective') AS objective_count,
                COUNT(*) FILTER (WHERE type = 'subjective') AS subjective_count,
                COUNT(*) FILTER (WHERE difficulty = 'easy') AS easy_count,
                COUNT(*) FILTER (WHERE difficulty = 'medium') AS medium_count,
                COUNT(*) FILTER (WHERE difficulty = 'hard') AS hard_count,
                COUNT(*) FILTER (WHERE source = 'ai') AS ai_generated_count,
                COUNT(DISTINCT subject_id) AS subjects_covered
            FROM public.questions
            WHERE tenant_id = $1;
        `
        const statsRes = await query(statsQuery, [tenantId])
        const stats = statsRes.rows[0] || {
            total_questions: 0,
            objective_count: 0,
            subjective_count: 0,
            easy_count: 0,
            medium_count: 0,
            hard_count: 0,
            ai_generated_count: 0,
            subjects_covered: 0
        }

        // 2. Fetch Recent Questions from Question Bank
        const questionsQuery = `
            SELECT 
                q.id,
                q.tenant_id,
                q.type,
                q.sub_type,
                q.difficulty,
                q.marks,
                q.negative_marks,
                q.source,
                q.created_at,
                q.question_text,
                q.options,
                q.correct_answer,
                q.explanation,
                COALESCE(s.name, 'General Knowledge') AS subject_name
            FROM public.questions q
            LEFT JOIN public.subjects s ON q.subject_id = s.id
            WHERE q.tenant_id = $1
            ORDER BY q.created_at DESC
            LIMIT 50;
        `
        const questionsRes = await query(questionsQuery, [tenantId])
        const rawQuestions = questionsRes.rows || []

        const questions = rawQuestions.map((q: any) => {
            let parsedText = q.question_text
            if (typeof parsedText === 'object' && parsedText !== null) {
                parsedText = parsedText.en || parsedText.text || JSON.stringify(parsedText)
            }

            let parsedOptions = q.options
            if (typeof parsedOptions === 'string') {
                try { parsedOptions = JSON.parse(parsedOptions) } catch (e) {}
            }

            let parsedAns = q.correct_answer
            if (typeof parsedAns === 'object' && parsedAns !== null) {
                parsedAns = parsedAns.answer || parsedAns.text || JSON.stringify(parsedAns)
            }

            let parsedExp = q.explanation
            if (typeof parsedExp === 'object' && parsedExp !== null) {
                parsedExp = parsedExp.en || parsedExp.text || JSON.stringify(parsedExp)
            }

            return {
                id: q.id,
                type: q.type,
                sub_type: q.sub_type,
                difficulty: q.difficulty || 'medium',
                marks: q.marks || 1,
                source: q.source || 'manual',
                created_at: q.created_at,
                subject_name: q.subject_name,
                question_text: parsedText,
                options: parsedOptions,
                correct_answer: parsedAns,
                explanation: parsedExp
            }
        })

        // 3. Fetch Classes & Subjects Dropdowns
        const classesRes = await query('SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC;', [tenantId])
        const subjectsRes = await query('SELECT id, name FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC;', [tenantId])

        // 4. Fetch Tenant AI Settings
        const tenantSettingsRes = await query('SELECT settings FROM public.tenants WHERE id = $1;', [tenantId])
        const tenantSettings = tenantSettingsRes.rows[0]?.settings?.ai || {
            adaptive_learning: true,
            auto_grading: true,
            ai_question_generation: true,
            strict_syllabus_mapping: true,
            include_marking_scheme: true,
            llm_model: 'gemini-2.5-flash'
        }

        return NextResponse.json({
            success: true,
            data: {
                stats,
                questions,
                classes: classesRes.rows || [],
                subjects: subjectsRes.rows || [],
                settings: tenantSettings
            }
        })
    } catch (error: any) {
        console.error('Error fetching AI question generator data:', error)
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        const tenantId = session?.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        const body = await request.json()
        const { action, payload } = body

        // 1. UPDATE INSTITUTIONAL AI SETTINGS
        if (action === 'UPDATE_SETTINGS') {
            const currentRes = await query('SELECT settings FROM public.tenants WHERE id = $1;', [tenantId])
            const currentSettings = currentRes.rows[0]?.settings || {}
            const updatedSettings = { ...currentSettings, ai: payload }

            await query('UPDATE public.tenants SET settings = $1, updated_at = NOW() WHERE id = $2;', [JSON.stringify(updatedSettings), tenantId])
            return NextResponse.json({ success: true, message: 'Institutional AI Settings Saved' })
        }

        // 2. GENERATE TEST QUESTIONS
        if (action === 'GENERATE_QUESTIONS') {
            const p = payload || body || {}

            // Extract subject name — never fallback to math if subject or syllabus is passed
            const subject_name = (
                p.subject_name ||
                p.subject ||
                (p.syllabus_name && !p.syllabus_name.toLowerCase().includes('board') ? p.syllabus_name : '') ||
                'English'
            ).trim()

            // Extract class, board, and pattern
            const class_name = (p.class_name || p.class || p.target_class || 'Class 10').trim()
            const syllabus_name = (p.board_name || p.board || p.syllabus_name || p.syllabus || 'Gujarat / CBSE Board').trim()
            const pattern_name = (p.pattern_name || p.exam_pattern || p.pattern || '').trim()

            // Extract section, marks, negative marks
            const section_name = (p.section_name || p.section || 'Section A').trim()
            const marks = Number(p.marks ?? p.mark ?? 1)
            const negative_marks = Number(p.negative_marks ?? p.negMark ?? 0)

            // Extract chapters & topics
            let chapters: string[] = []
            if (Array.isArray(p.chapters)) chapters = p.chapters.filter(Boolean).map(String)
            else if (typeof p.chapters === 'string') chapters = p.chapters.split(',').map((s: string) => s.trim()).filter(Boolean)
            else if (p.chapter) chapters = [String(p.chapter).trim()]

            let topics: string[] = []
            if (Array.isArray(p.topics)) topics = p.topics.filter(Boolean).map(String)
            else if (typeof p.topics === 'string') topics = p.topics.split(',').map((s: string) => s.trim()).filter(Boolean)
            else if (p.topic && typeof p.topic === 'string') {
                topics = p.topic.split(',').map((s: string) => s.trim()).filter(Boolean)
            }

            // Extract question types and difficulty
            const question_type = p.question_type || p.type || 'objective'
            const difficulty = p.difficulty || 'medium'
            const language = p.language || 'English'

            // Extract exact requested count (capped to reasonable bounds for single LLM call)
            const rawCount = p.count ?? p.total_nodes ?? p.num_questions ?? 10
            const count = Math.min(Math.max(Number(rawCount) || 1, 1), 60)

            try {
                const questions = await generateQuestionsWithGemini({
                    subject_name,
                    class_name,
                    syllabus_name,
                    pattern_name,
                    section_name,
                    chapters,
                    topics,
                    count,
                    marks,
                    negative_marks,
                    question_type,
                    difficulty,
                    language
                })

                return NextResponse.json({
                    success: true,
                    questions,
                    count: questions.length,
                    source: 'gemini',
                    metadata: {
                        subject: subject_name,
                        class: class_name,
                        board: syllabus_name,
                        section: section_name,
                        pattern: pattern_name
                    }
                })
            } catch (err: any) {
                console.error('[AI Generation Error]', err)
                return NextResponse.json({
                    success: false,
                    error: err.message || 'AI generation failed. Please ensure GEMINI_API_KEY is valid and try again.'
                }, { status: 500 })
            }
        }

        // 3. SAVE QUESTIONS TO SCHOOL QUESTION BANK
        if (action === 'SAVE_QUESTIONS') {
            const { questions, subject_id } = payload
            if (!Array.isArray(questions) || questions.length === 0) {
                return NextResponse.json({ error: 'No questions provided' }, { status: 400 })
            }

            let insertedCount = 0
            for (const q of questions) {
                const questionTextObj = { en: q.text || q.question_text }
                const optionsObj = q.options ? JSON.stringify(q.options) : null
                const answerObj = { answer: q.correct_answer }
                const expObj = { en: q.explanation || '' }

                const insertQuery = `
                    INSERT INTO public.questions (
                        tenant_id,
                        type,
                        sub_type,
                        question_text,
                        options,
                        correct_answer,
                        explanation,
                        subject_id,
                        difficulty,
                        marks,
                        negative_marks,
                        source,
                        created_at,
                        updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ai', NOW(), NOW()
                    );
                `
                await query(insertQuery, [
                    tenantId,
                    q.type || 'objective',
                    q.sub_type || 'mcq',
                    JSON.stringify(questionTextObj),
                    optionsObj,
                    JSON.stringify(answerObj),
                    JSON.stringify(expObj),
                    subject_id || null,
                    q.difficulty || 'medium',
                    q.marks || 1,
                    q.negative_marks || 0
                ])
                insertedCount++
            }

            return NextResponse.json({
                success: true,
                message: `Successfully saved ${insertedCount} questions to the school question bank.`,
                inserted_count: insertedCount
            })
        }

        // 4. DELETE QUESTION FROM SCHOOL QUESTION BANK
        if (action === 'DELETE_QUESTION') {
            const { question_id } = payload
            if (!question_id) return NextResponse.json({ error: 'Question ID required' }, { status: 400 })

            await query('DELETE FROM public.questions WHERE id = $1 AND tenant_id = $2;', [question_id, tenantId])
            return NextResponse.json({ success: true, message: 'Question deleted from bank.' })
        }

        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    } catch (error: any) {
        console.error('Error handling AI questions POST action:', error)
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
