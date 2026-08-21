import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CURRICULUM_TEMPLATES } from '@/lib/ai/curriculum-templates'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Keep at 60s — works on self-hosted Node + Nginx (with proxy_read_timeout 60s)
export const maxDuration = 60

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
    const template = CURRICULUM_TEMPLATES[boardName] || CURRICULUM_TEMPLATES['CBSE']
    const mockTree = []
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
        if (data?.value && typeof data.value === 'string' && data.value.trim()) {
            return data.value.trim()
        }
    } catch { /* fall through */ }
    return process.env.GEMINI_API_KEY || null
}

// ── Helper: Single Gemini call with 25s timeout + real model names ────────────
async function generateWithGemini(prompt: string): Promise<string> {
    const apiKey = await getGeminiApiKey()
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing or not configured')

    // Real model names in priority order (no invented versions)
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']
    const genAI = new GoogleGenerativeAI(apiKey)

    let lastError: Error | null = null
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: { responseMimeType: 'application/json' }
            })

            // Race against 25s timeout per model attempt
            const result = await Promise.race([
                model.generateContent(prompt),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Model ${modelName} timed out after 25s`)), 25000)
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
            if (!deepGen) {
                // Instant: use local curriculum template
                const mockTree = getTemplateMockTree(boardName)
                return NextResponse.json({ tree: mockTree })
            }

            // Deep Gen: ONE Gemini call, no examination agent loop (avoids timeout)
            try {
                const prompt = `You are an academic curriculum expert. Generate a complete, realistic syllabus for "${boardName}".

Return ONLY a valid JSON array (no markdown, no code blocks, no explanation).
Schema:
[
  {
    "class": "Class 6",
    "subjects": [
      {
        "name": "Mathematics",
        "chapters": [
          { "name": "Integers", "topics": ["Introduction to Integers", "Operations", "Number Line"] }
        ]
      }
    ]
  }
]

Rules:
- Classes 6 to 10: English, Mathematics, Science, Social Science, Hindi/Regional Language, Computer Science
- Class 11 & 12: Split into streams — Science (Physics, Chemistry, Biology/Math, English, CS), Commerce (Accountancy, Business Studies, Economics, Math, English), Arts (History, Political Science, Geography, Sociology, English)
- Minimum 4 chapters per subject, 3 topics per chapter
- Each class must have distinct, grade-appropriate content (Class 6 Math ≠ Class 9 Math)
- Return ONLY the JSON array, nothing else`

                const text = await generateWithGemini(prompt)
                const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim()

                let generatedTree: any[]
                try {
                    generatedTree = JSON.parse(clean)
                } catch {
                    // JSON parse failed — use template fallback
                    throw new Error('AI returned malformed JSON')
                }

                if (!Array.isArray(generatedTree) || generatedTree.length === 0) {
                    throw new Error('AI returned empty syllabus tree')
                }

                return NextResponse.json({ tree: generatedTree })

            } catch (aiErr: any) {
                console.warn('[AI Generate Fallback]:', aiErr.message)
                const mockTree = getTemplateMockTree(boardName)
                let warning = aiErr.message || 'AI generation failed'
                if (!warning.includes('template') && !warning.includes('instead')) {
                    warning = `AI generation unavailable (${warning.substring(0, 120)}). Loaded verified standard syllabus.`
                }
                return NextResponse.json({ tree: mockTree, fallback: true, warning })
            }
        }

        // ── ACTION: save ─────────────────────────────────────────────────────
        if (action === 'save') {
            const summary = { categories: 0, boards: 0, classes: 0, subjects: 0, chapters: 0, topics: 0 }

            let parentId: string | null = null
            if (category) {
                parentId = await insertNode(category, 'category', null, 0)
                summary.categories++
            }

            const boardId = await insertNode(boardName, 'board', parentId, 0)
            summary.boards++

            if (Array.isArray(tree)) {
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
                const prompt = `Generate ${targetType}s for a ${parentType} named "${parentName}" in an academic syllabus.
Return ONLY a JSON array of strings (no markdown):
["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"]
Generate 5 to 7 specific, curriculum-relevant items.`

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
