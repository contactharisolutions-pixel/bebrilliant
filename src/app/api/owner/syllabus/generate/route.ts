import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CURRICULUM_TEMPLATES, getClassTree, getBoardType, getEntranceSubjects, BoardType } from '@/lib/ai/curriculum-templates'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Set max duration to 300s (5 minutes) — no cap on syllabus AI generation
export const maxDuration = 300

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    const role = p?.role?.toLowerCase()
    return (role === 'owner' || role === 'admin' || role === 'platform_staff') ? user : null
}

// ── Helper: insert a node (upsert-style, skip duplicates) ─────────────────────
async function insertNode(
    name: string,
    type: string,
    parentId: string | null,
    orderIndex: number
): Promise<string> {
    let query = supabaseAdmin
        .from('syllabus_nodes')
        .select('id')
        .eq('name', name)
        .eq('type', type)

    if (parentId === null) {
        query = query.is('parent_id', null)
    } else {
        query = query.eq('parent_id', parentId)
    }

    const { data: existing } = await query.maybeSingle()
    if (existing) return existing.id

    const { data, error } = await supabaseAdmin
        .from('syllabus_nodes')
        .insert([{ name, type, parent_id: parentId, order_index: orderIndex, is_active: true }])
        .select('id')
        .single()
    if (error) throw new Error(`Failed to insert ${type} "${name}": ${error.message}`)
    return data.id
}

// ── Helper: Build template tree from local CURRICULUM_TEMPLATES ───────────────
function getTemplateMockTree(boardName: string) {
    // Use new per-class detailed tree when available
    const classTree = getClassTree(boardName)
    if (classTree && classTree.length > 0) return classTree

    // Fallback: legacy flat subject pool for boards without detailed trees
    const template = CURRICULUM_TEMPLATES[boardName] || CURRICULUM_TEMPLATES['CBSE']
    const mockTree: any[] = []
    if (!template) return mockTree

    for (let i = 0; i < template.classes.length; i++) {
        const className = template.classes[i]
        const lowerClass = className.toLowerCase()
        let allowedSubjects = Object.entries(template.subjects)

        if (lowerClass.includes('science')) {
            allowedSubjects = allowedSubjects.filter(([n]) =>
                ['physics', 'chemistry', 'biology', 'mathematics', 'math'].some(c => n.toLowerCase().includes(c)))
        } else if (lowerClass.includes('commerce') || lowerClass.includes('ca ')) {
            allowedSubjects = allowedSubjects.filter(([n]) =>
                ['accountancy', 'business', 'economics', 'finance', 'math'].some(c => n.toLowerCase().includes(c)))
        } else if (lowerClass.includes('arts')) {
            allowedSubjects = allowedSubjects.filter(([n]) =>
                ['history', 'geography', 'polity', 'sociology', 'english'].some(c => n.toLowerCase().includes(c)))
        } else if (lowerClass.match(/grade [1-8]|std [1-8]|class [1-8]/i)) {
            allowedSubjects = allowedSubjects.filter(([n]) =>
                !['physics', 'chemistry', 'biology', 'accountancy', 'business'].some(c => n.toLowerCase().includes(c)))
        }

        if (allowedSubjects.length === 0) allowedSubjects = Object.entries(template.subjects).slice(0, 3)

        const formattedSubjects = allowedSubjects.map(([sName, sData]: any) => ({
            name: sName,
            chapters: sData.chapters.map((cName: string) => ({
                name: cName,
                topics: sData.topics?.[cName] || ['Introduction', 'Core Concepts', 'Practice Questions']
            }))
        }))

        mockTree.push({ class: className, subjects: formattedSubjects })
    }
    return mockTree
}

// ── Helper: Fetch Gemini key from DB config or env ────────────────────────────
async function getGeminiApiKey(): Promise<string | null> {
    try {
        const { data } = await supabaseAdmin
            .from('ai_engine_config')
            .select('value')
            .eq('parameter', 'gemini_api_key')
            .maybeSingle()
        if (data?.value) {
            // value column is JSONB — may be stored as a JSON string ("key") or plain string
            let raw = data.value
            if (typeof raw === 'object') raw = JSON.stringify(raw)
            // Strip wrapping JSON quotes if present: "AIza..." -> AIza...
            raw = String(raw).trim()
            if (raw.startsWith('"') && raw.endsWith('"')) {
                raw = raw.slice(1, -1).trim()
            }
            if (raw && raw.length > 10) return raw
        }
    } catch { /* fall through to env */ }
    return process.env.GEMINI_API_KEY || null
}

// ── Helper: Enrich AI generated tree with official curriculum template ─────────
function enrichWithTemplate(generatedTree: any[], boardName: string): any[] {
    const templateTree = getTemplateMockTree(boardName)
    if (!Array.isArray(generatedTree) || generatedTree.length === 0) return templateTree

    const enrichedTree = [...generatedTree]

    for (const tClass of templateTree) {
        let gClass = enrichedTree.find(c => c.class?.toLowerCase().trim() === tClass.class?.toLowerCase().trim())
        if (!gClass) {
            gClass = { class: tClass.class, subjects: [] }
            enrichedTree.push(gClass)
        }

        if (!Array.isArray(gClass.subjects)) gClass.subjects = []

        for (const tSubj of tClass.subjects) {
            let gSubj = gClass.subjects.find((s: any) => s.name?.toLowerCase().trim() === tSubj.name?.toLowerCase().trim())
            if (!gSubj) {
                gSubj = { name: tSubj.name, chapters: [] }
                gClass.subjects.push(gSubj)
            }

            if (!Array.isArray(gSubj.chapters)) gSubj.chapters = []

            for (const tChap of tSubj.chapters) {
                let gChap = gSubj.chapters.find((c: any) => c.name?.toLowerCase().trim() === tChap.name?.toLowerCase().trim())
                if (!gChap) {
                    gChap = { name: tChap.name, topics: [...(tChap.topics || [])] }
                    gSubj.chapters.push(gChap)
                } else {
                    if (!Array.isArray(gChap.topics) || gChap.topics.length === 0) {
                        gChap.topics = [...(tChap.topics || [])]
                    }
                }
            }
        }
    }

    return enrichedTree
}

// ── Helper: Single Gemini call with 25s timeout + real model names ────────────
async function generateWithGemini(prompt: string): Promise<string> {
    const apiKey = await getGeminiApiKey()
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing or not configured')

    // Priority: gemini-3.1-flash-lite is fastest (5.5s verified), 2.5-flash uses extended thinking (~25s+)
    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.6-flash']
    const genAI = new GoogleGenerativeAI(apiKey)

    let lastError: Error | null = null
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: 'application/json' }
            })

            // Race against 180s timeout per model attempt (no artificial early cap)
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Model ${modelName} timed out after 180s`)), 180000)
                )
            ])

            const text = (result as any).response.text()
            if (text && text.trim().length > 2) return text
        } catch (err: any) {
            lastError = err
            console.warn(`[Gemini] ${modelName} failed: ${err.message}`)
            // Don't retry on auth errors — they'll fail on all models too
            if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('403')) break
        }
    }

    let msg = lastError?.message || 'All Gemini models failed'
    if (msg.includes('403') || msg.includes('leaked') || msg.includes('API_KEY_INVALID')) {
        msg = 'Gemini API key is invalid or blocked. Using verified curriculum template instead.'
    } else if (msg.includes('404') || msg.includes('not found')) {
        msg = 'Gemini model unavailable. Using verified curriculum template instead.'
    }
    throw new Error(msg)
}

// ── POST /api/owner/syllabus/generate ─────────────────────────────────────────
export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let body: any
    try { body = await request.json() } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { boardName, category, deepGen = false, action = 'save', tree = [] } = body
    if (!boardName) return NextResponse.json({ error: 'boardName is required' }, { status: 400 })

    try {
        // ── ACTION: preview ──────────────────────────────────────────────────
        if (action === 'preview') {
            const boardType: BoardType = getBoardType(boardName)

            if (!deepGen) {
                // Instant: use local curriculum template
                if (boardType === 'School') {
                    const mockTree = getTemplateMockTree(boardName)
                    return NextResponse.json({ tree: mockTree, boardType })
                } else {
                    // Entrance / Competitive: return flat subject list
                    const subjects = getEntranceSubjects(boardName)
                    return NextResponse.json({ tree: subjects, boardType })
                }
            }

            // Deep Gen: Gemini call with board-type-specific prompt
            try {
                let prompt: string

                if (boardType === 'School') {
                    // ── School prompt: Class → Subject → Chapter → Topic ──────────────
                    prompt = `You are an expert Indian school curriculum designer. Generate a COMPLETE, EXHAUSTIVE and DETAILED syllabus for the "${boardName}" board covering ALL classes from Class 1 to Class 12.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation.

JSON Schema:
[
  {
    "class": "Class 1",
    "subjects": [
      {
        "name": "Mathematics",
        "chapters": [
          { "name": "Numbers 1-100", "topics": ["Counting 1-10", "Counting 11-50", "Before After Between", "Skip Counting"] }
        ]
      }
    ]
  }
]

Rules (MUST follow every rule):
1. Include ALL classes: Class 1, Class 2, Class 3, Class 4, Class 5, Class 6, Class 7, Class 8, Class 9, Class 10, Class 11 Science, Class 11 Commerce, Class 11 Arts, Class 12 Science, Class 12 Commerce, Class 12 Arts
2. Class 1–5: English, Mathematics, Environmental Studies / Science, Social Studies
3. Class 6–8: English, Mathematics, Science, Social Science, Hindi, Computer Science
4. Class 9–10: English, Mathematics, Science, Social Science, Hindi, Computer Science (Class 10 Mathematics MUST include ALL 14 official NCERT chapters: Real Numbers, Polynomials, Pair of Linear Equations in Two Variables, Quadratic Equations, Arithmetic Progressions, Triangles, Coordinate Geometry, Introduction to Trigonometry, Some Applications of Trigonometry, Circles, Areas Related to Circles, Surface Areas and Volumes, Statistics, Probability)
5. Class 11 & 12 Science stream: Physics, Chemistry, Biology, Mathematics, English, Computer Science
6. Class 11 & 12 Commerce stream: Accountancy, Business Studies, Economics, Mathematics, English
7. Class 11 & 12 Arts stream: History, Political Science, Geography, Sociology, English
8. Include EVERY SINGLE CHAPTER and topic required by the official NCERT/CBSE curriculum. Do NOT truncate or skip chapters.
9. Minimum 4 detailed topics per chapter
10. Each class must have DISTINCT grade-appropriate content
11. Return ONLY the JSON array — nothing else`

                } else {
                    // ── Entrance / Competitive prompt: Subject → Chapter → Topic ──────
                    // NO class level — generate subjects directly under the board
                    const examLabel = boardType === 'Entrance' ? 'entrance exam' : 'competitive exam'
                    prompt = `You are an expert Indian ${examLabel} curriculum designer. Generate a COMPLETE, EXHAUSTIVE and DETAILED syllabus for "${boardName}".

Return ONLY a valid JSON array — no markdown, no code fences, no explanation.

JSON Schema:
[
  {
    "subject": "Physics",
    "chapters": [
      { "name": "Units and Dimensions", "topics": ["SI Units", "Dimensional Analysis", "Significant Figures", "Error Analysis"] }
    ]
  }
]

Rules (MUST follow every rule):
1. Include ALL official subjects tested in ${boardName}
2. Do NOT use class names (Class 11, Class 12, etc.) — subjects go directly at the top level
3. Include EVERY chapter and topic from the official ${boardName} syllabus — do NOT omit any
4. Minimum 4 detailed, exam-relevant topics per chapter
5. Topics should reflect actual exam pattern and weightage of ${boardName}
6. Return ONLY the JSON array — nothing else`
                }

                const text = await generateWithGemini(prompt)
                const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim()

                let generatedTree: any[]
                try {
                    generatedTree = JSON.parse(clean)
                } catch {
                    throw new Error('AI returned malformed JSON')
                }

                if (!Array.isArray(generatedTree) || generatedTree.length === 0) {
                    throw new Error('AI returned empty syllabus tree')
                }

                // Only enrich School boards with template — entrance/competitive have unique structures
                if (boardType === 'School') {
                    const enrichedTree = enrichWithTemplate(generatedTree, boardName)
                    return NextResponse.json({ tree: enrichedTree, boardType })
                }

                return NextResponse.json({ tree: generatedTree, boardType })

            } catch (aiErr: any) {
                console.warn('[AI Generate Fallback]:', aiErr.message)
                let fallbackTree: any[]
                const boardType: BoardType = getBoardType(boardName)
                if (boardType === 'School') {
                    fallbackTree = getTemplateMockTree(boardName)
                } else {
                    fallbackTree = getEntranceSubjects(boardName)
                }
                let warning = aiErr.message || 'AI generation failed'
                if (!warning.includes('template') && !warning.includes('instead')) {
                    warning = `AI generation unavailable (${warning.substring(0, 120)}). Loaded verified standard syllabus.`
                }
                return NextResponse.json({ tree: fallbackTree, boardType, fallback: true, warning })
            }
        }

        // ── ACTION: save ─────────────────────────────────────────────────────
        if (action === 'save') {
            const summary = { categories: 0, boards: 0, classes: 0, subjects: 0, chapters: 0, topics: 0 }
            const boardType: BoardType = getBoardType(boardName)

            let parentId: string | null = null
            if (category) {
                parentId = await insertNode(category, 'category', null, 0)
                summary.categories++
            }

            const boardId = await insertNode(boardName, 'board', parentId, 0)
            summary.boards++

            if (Array.isArray(tree)) {
                if (boardType === 'School') {
                    // ── School path: Board → Class → Subject → Chapter → Topic ────────
                    for (let i = 0; i < tree.length; i++) {
                        const cls = tree[i]
                        if (!cls.class) continue
                        const classId = await insertNode(cls.class, 'class', boardId, i)
                        summary.classes++

                        if (Array.isArray(cls.subjects)) {
                            for (let j = 0; j < cls.subjects.length; j++) {
                                const subj = cls.subjects[j]
                                if (!subj.name) continue
                                const subjId = await insertNode(subj.name, 'subject', classId, j)
                                summary.subjects++

                                if (Array.isArray(subj.chapters)) {
                                    for (let k = 0; k < subj.chapters.length; k++) {
                                        const chap = subj.chapters[k]
                                        if (!chap.name) continue
                                        const chapId = await insertNode(chap.name, 'chapter', subjId, k)
                                        summary.chapters++

                                        if (Array.isArray(chap.topics)) {
                                            for (let l = 0; l < chap.topics.length; l++) {
                                                const t = chap.topics[l]
                                                if (!t) continue
                                                const tName = typeof t === 'string' ? t : (t as any).name || 'Topic'
                                                await insertNode(tName.trim(), 'topic', chapId, l)
                                                summary.topics++
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // ── Entrance / Competitive path: Board → Subject → Chapter → Topic ─
                    // NO class node inserted — subjects hang directly from boardId
                    for (let j = 0; j < tree.length; j++) {
                        const subj = tree[j]
                        // Support both { subject, chapters } and { name, chapters } shapes
                        const subjName = subj.subject || subj.name
                        if (!subjName) continue
                        const subjId = await insertNode(subjName, 'subject', boardId, j)
                        summary.subjects++

                        if (Array.isArray(subj.chapters)) {
                            for (let k = 0; k < subj.chapters.length; k++) {
                                const chap = subj.chapters[k]
                                if (!chap.name) continue
                                const chapId = await insertNode(chap.name, 'chapter', subjId, k)
                                summary.chapters++

                                if (Array.isArray(chap.topics)) {
                                    for (let l = 0; l < chap.topics.length; l++) {
                                        const t = chap.topics[l]
                                        if (!t) continue
                                        const tName = typeof t === 'string' ? t : (t as any).name || 'Topic'
                                        await insertNode(tName.trim(), 'topic', chapId, l)
                                        summary.topics++
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const total = Object.values(summary).reduce((a, b) => a + b, 0)
            return NextResponse.json({
                success: true,
                boardId,
                created: summary,
                message: `Successfully saved ${total} nodes for ${boardName}`
            })
        }

        // ── ACTION: generate_children (contextual AI gen for tree node) ──────
        if (action === 'generate_children') {
            const { parentId, parentName, parentType, targetType } = body
            if (!parentId || !parentName || !parentType || !targetType) {
                throw new Error('Missing params for contextual generation')
            }

            let generatedItems: string[] = []
            try {
                const prompt = `Generate ALL complete, exhaustive, and curriculum-aligned ${targetType}s for a ${parentType} named "${parentName}" in an official academic syllabus.
Return ONLY a JSON array of strings (no markdown):
["Item 1", "Item 2", "Item 3"]
Include EVERY official ${targetType} required by the standard curriculum. Do NOT truncate or restrict to a small count.`

                const text = await generateWithGemini(prompt)
                const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim()
                generatedItems = JSON.parse(clean)
            } catch (aiErr: any) {
                console.warn('[Contextual AI Fallback]:', aiErr.message)
                generatedItems = [
                    `${parentName} — Fundamentals`,
                    `${parentName} — Core Concepts`,
                    `${parentName} — Advanced Topics`,
                    `${parentName} — Practical Applications`,
                    `${parentName} — Assessment & Review`
                ]
            }

            if (!Array.isArray(generatedItems)) generatedItems = [`${parentName} Overview`]

            for (let i = 0; i < generatedItems.length; i++) {
                const item = generatedItems[i]
                const name = typeof item === 'string' ? item.trim() : (item as any)?.name?.trim()
                if (name && name.length > 0) {
                    await insertNode(name, targetType, parentId, i)
                }
            }

            return NextResponse.json({
                success: true,
                message: `Generated ${generatedItems.length} ${targetType}s for "${parentName}"`
            })
        }

        return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 })

    } catch (e: any) {
        console.error('[AI Generate Error]', e.message)
        return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 })
    }
}

// ── GET: Return available curriculum templates ─────────────────────────────────
export async function GET() {
    const templates = Object.entries(CURRICULUM_TEMPLATES).map(([board, data]) => ({
        board,
        classes: data.classes,
        subjects: Object.keys(data.subjects),
        totalChapters: Object.values(data.subjects).reduce((sum: number, s: any) => sum + s.chapters.length, 0),
    }))
    return NextResponse.json({ templates })
}
