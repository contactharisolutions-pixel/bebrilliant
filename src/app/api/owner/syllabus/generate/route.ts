import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CURRICULUM_TEMPLATES } from '@/lib/ai/curriculum-templates'
import { GoogleGenerativeAI } from '@google/generative-ai'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    const role = p?.role?.toLowerCase()
    return (role === 'owner' || role === 'admin' || role === 'platform_staff') ? user : null
}

// ── Helper: insert a node and return its ID ────────────────────────────────────
async function insertNode(
    name: string,
    type: string,
    parentId: string | null,
    orderIndex: number
): Promise<string> {
    // Check for existence to avoid duplicates at the same level
    let query = supabaseAdmin
        .from('syllabus_nodes')
        .select('id')
        .eq('name', name)
        .eq('type', type);

    if (parentId === null) {
        query = query.is('parent_id', null);
    } else {
        query = query.eq('parent_id', parentId);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await supabaseAdmin
        .from('syllabus_nodes')
        .insert([{ name, type, parent_id: parentId, order_index: orderIndex, is_active: true }])
        .select('id')
        .single()
    if (error) throw new Error(`Failed to insert ${type} "${name}": ${error.message}`)
    return data.id
}

// ── Helper: Generate mock tree from verified curriculum templates ─────────────
function getTemplateMockTree(boardName: string) {
    const template = CURRICULUM_TEMPLATES[boardName] || CURRICULUM_TEMPLATES['CBSE'];
    const mockTree = [];
    if (template) {
        for (let i = 0; i < template.classes.length; i++) {
            const className = template.classes[i];
            const subjects = Object.entries(template.subjects);
            const lowerClass = className.toLowerCase();
            let allowedSubjects = subjects;
            if (lowerClass.includes('science')) {
                allowedSubjects = subjects.filter(([name]) => ['physics', 'chemistry', 'biology', 'mathematics', 'math'].some(c => name.toLowerCase().includes(c)));
            } else if (lowerClass.includes('commerce') || lowerClass.includes('ca ')) {
                allowedSubjects = subjects.filter(([name]) => ['accountancy', 'business', 'economics', 'finance', 'math'].some(c => name.toLowerCase().includes(c)));
            } else if (lowerClass.includes('arts')) {
                allowedSubjects = subjects.filter(([name]) => ['history', 'geography', 'polity', 'sociology', 'english'].some(c => name.toLowerCase().includes(c)));
            } else if (lowerClass.match(/grade [1-8]|std [1-8]|class [1-8]/)) {
                allowedSubjects = subjects.filter(([name]) => ['physics', 'chemistry', 'biology', 'accountancy', 'business'].every(c => !name.toLowerCase().includes(c)));
            }
            if (allowedSubjects.length === 0) allowedSubjects = subjects.slice(0, 2);

            const formattedSubjects = allowedSubjects.map(([sName, sData]: any) => ({
                name: sName,
                chapters: sData.chapters.map((cName: string) => ({
                    name: cName,
                    topics: sData.topics?.[cName] || ['Introduction', 'Core Concepts', 'Practice Questions']
                }))
            }));
            mockTree.push({ class: className, subjects: formattedSubjects });
        }
    }
    return mockTree;
}

// ── Helper: Retrieve Gemini API Key (DB config override or env) ────────────────
async function getGeminiApiKey(): Promise<string | null> {
    try {
        const { data } = await supabaseAdmin
            .from('ai_engine_config')
            .select('value')
            .eq('parameter', 'gemini_api_key')
            .maybeSingle();
        if (data?.value && typeof data.value === 'string' && data.value.trim()) {
            return data.value.trim();
        }
    } catch (e) {
        // ignore fallback
    }
    return process.env.GEMINI_API_KEY || null;
}

// ── Helper: Execute Gemini content generation with multi-model fallback ────────
async function generateWithGemini(prompt: string): Promise<string> {
    const apiKey = await getGeminiApiKey();
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing or not configured");

    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError: any = null;

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text) return text;
        } catch (err: any) {
            lastError = err;
            console.warn(`[Gemini Model Retry Warn] Model ${modelName} failed:`, err.message);
        }
    }

    let userFriendlyMsg = lastError?.message || "Gemini AI models failed to respond";
    if (userFriendlyMsg.includes("403 Forbidden") || userFriendlyMsg.includes("leaked")) {
        userFriendlyMsg = "Gemini API key is blocked or reported as leaked by Google. Please update GEMINI_API_KEY in environment or AI Engine settings.";
    }
    throw new Error(userFriendlyMsg);
}

// ── POST /api/owner/syllabus/generate ─────────────────────────────────────────
export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let body: any
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const { boardName, category, deepGen = false, action = 'save', tree = [] } = body

    if (!boardName) return NextResponse.json({ error: 'boardName is required' }, { status: 400 })

    try {
        if (action === 'preview') {
            if (!deepGen) {
                const mockTree = getTemplateMockTree(boardName);
                return NextResponse.json({ tree: mockTree });
            }

            // Gemini Deep Generation & Examination
            try {
                let validTree = null;
                let attempts = 0;

                while (!validTree && attempts < 3) {
                    attempts++;
                    const prompt = `Generate a realistic syllabus hierarchy for the board/exam "${boardName}".
                    Return a JSON array of class objects. Each class MUST have its own specific subjects, chapters, and topics designed uniquely for that grade level.
                    
                    CRITICAL CURRICULUM GUIDELINES:
                    - Generate classes for 6th to 12th standards.
                    - For Class 11 and 12, explicitly divide classes into streams, e.g., "Class 11 Science", "Class 11 Commerce", "Class 11 Arts".
                    - Middle School (Class 6-8): English, Regional/Hindi Language, Mathematics, Science, Social Science, Computer Science, Art.
                    - Secondary (Class 9-10): English, Regional/Hindi Language, Mathematics, Science, Social Science (History, Geography, Economics), IT/Computer Studies.
                    - Senior Secondary Science: Physics, Chemistry, Biology, Mathematics, English, Computer Science.
                    - Senior Secondary Commerce: Accountancy, Business Studies, Economics, Statistics/Math, English.
                    - Senior Secondary Arts/Humanities: History, Political Science, Geography, Psychology, Sociology, English, Regional Languages/Philosophy.

                    Strict JSON Format (NO markdown text, pure unformatted JSON array):
                    [
                        {
                            "class": "Class 10",
                            "subjects": [
                                {
                                    "name": "Mathematics",
                                    "chapters": [
                                        {
                                            "name": "Algebra",
                                            "topics": ["Polynomials", "Linear Equations"]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                    Maintain generating 3 to 5 core subjects per class, at least 4 chapters per subject, and 3 topics per chapter to ensure structural integrity across 6th to 12th grades (and streams).`;

                    const text = await generateWithGemini(prompt);
                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    let generatedJson;
                    try { generatedJson = JSON.parse(cleanJson); } catch (e) { continue; }

                    // EXAMINATION AGENT
                    const examinePrompt = `Examine the following JSON array representing an academic syllabus.
                    JSON:
                    ${JSON.stringify(generatedJson)}

                    Requirements for Success:
                    1. Is it a JSON Array?
                    2. Are there multiple classes?
                    3. Are the subjects fundamentally different or are the chapters fully distinct across different classes? (e.g. Class 9 Math chapters should NOT be identical to Class 10 Math chapters).
                    4. Does every chapter have an array of topics?

                    Return evaluation strictly as JSON (no markdown block): {"valid": true} OR {"valid": false, "reason": "..."}`;

                    const evalText = await generateWithGemini(examinePrompt);
                    const cleanEvalText = evalText.replace(/```json/g, '').replace(/```/g, '').trim();
                    let evalJson;
                    try { evalJson = JSON.parse(cleanEvalText); } catch (e) { continue; }

                    if (evalJson.valid) {
                        validTree = generatedJson;
                    }
                }

                if (!validTree) {
                    // Fall back to template mock tree if examination fails
                    const mockTree = getTemplateMockTree(boardName);
                    return NextResponse.json({
                        tree: mockTree,
                        fallback: true,
                        warning: "AI syllabus examination did not complete. Loaded verified curriculum template."
                    });
                }

                return NextResponse.json({ tree: validTree });
            } catch (aiErr: any) {
                console.warn("[AI Generate Fallback Triggered]:", aiErr.message);
                const mockTree = getTemplateMockTree(boardName);
                let cleanWarning = aiErr.message || "";
                if (cleanWarning.includes("leaked") || cleanWarning.includes("403 Forbidden") || cleanWarning.includes("blocked")) {
                    cleanWarning = "Gemini API key is reported as leaked by Google. Loaded verified standard syllabus structure instead.";
                } else {
                    cleanWarning = `AI generation unavailable (${cleanWarning}). Loaded verified standard syllabus structure.`;
                }
                return NextResponse.json({
                    tree: mockTree,
                    fallback: true,
                    warning: cleanWarning
                });
            }

        } else if (action === 'save') {
            const created = { summary: { categories: 0, boards: 0, classes: 0, subjects: 0, chapters: 0, topics: 0 } };

            let parentId = null;
            if (category) {
                parentId = await insertNode(category, 'category', null, 0);
                created.summary.categories++;
            }
            const boardId = await insertNode(boardName, 'board', parentId, 0)
            created.summary.boards++

            if (Array.isArray(tree)) {
                for (let i = 0; i < tree.length; i++) {
                    const cls = tree[i];
                    if (!cls.class) continue;
                    const classId = await insertNode(cls.class, 'class', boardId, i);
                    created.summary.classes++;

                    if (Array.isArray(cls.subjects)) {
                        for (let j = 0; j < cls.subjects.length; j++) {
                            const subj = cls.subjects[j];
                            if (!subj.name) continue;
                            const subjId = await insertNode(subj.name, 'subject', classId, j);
                            created.summary.subjects++;

                            if (Array.isArray(subj.chapters)) {
                                for (let k = 0; k < subj.chapters.length; k++) {
                                    const chap = subj.chapters[k];
                                    if (!chap.name) continue;
                                    const chapId = await insertNode(chap.name, 'chapter', subjId, k);
                                    created.summary.chapters++;

                                    if (Array.isArray(chap.topics)) {
                                        for (let l = 0; l < chap.topics.length; l++) {
                                            const topicName = chap.topics[l];
                                            if (!topicName) continue;
                                            const tName = typeof topicName === 'string' ? topicName : topicName.name || 'Topic';
                                            await insertNode(tName, 'topic', chapId, l);
                                            created.summary.topics++;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return NextResponse.json({
                success: true,
                boardId,
                created: created.summary,
                message: `Successfully saved ${Object.values(created.summary).reduce((a, b) => a + b, 0)} nodes for ${boardName}`
            })
        } else if (action === 'generate_children') {
            const { parentId, parentName, parentType, targetType } = body;
            if (!parentId || !parentName || !parentType || !targetType) throw new Error("Missing params for contextual generation");

            let generatedItems: string[] = [];
            try {
                const prompt = `I am building an academic syllabus. You must generate realistic, standard academic ${targetType}s that belong under a ${parentType} named "${parentName}".
                Strict JSON Format (NO markdown text, pure unformatted JSON array of strings):
                ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"]
                Generate at least 5 to 7 highly relevant items based on standard CBSE/state board curriculum. Only return the JSON array of strings.`;

                const text = await generateWithGemini(prompt);
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                generatedItems = JSON.parse(cleanJson);
            } catch (aiErr: any) {
                console.warn("[Contextual AI Generation Fallback]:", aiErr.message);
                generatedItems = [
                    `${parentName} - Fundamentals`,
                    `${parentName} - Core Concepts`,
                    `${parentName} - Advanced Topics`,
                    `${parentName} - Practical Applications`,
                    `${parentName} - Review & Assessment`
                ];
            }

            if (!Array.isArray(generatedItems)) {
                generatedItems = [`${parentName} Overview`, `${parentName} Practice`].filter(Boolean);
            }

            for (let i = 0; i < generatedItems.length; i++) {
                const item = generatedItems[i];
                if (typeof item === 'string' && item.trim().length > 0) {
                    await insertNode(item.trim(), targetType, parentId, i);
                } else if (item && (item as any).name) {
                    await insertNode((item as any).name.trim(), targetType, parentId, i);
                }
            }

            return NextResponse.json({
                success: true,
                message: `Successfully generated ${generatedItems.length} ${targetType}s for ${parentName}`
            });
        }

        return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

    } catch (e: any) {
        console.error('[AI Generate Error]', e.message)
        return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 })
    }
}

// ── GET: Return available templates ───────────────────────────────────────────
export async function GET() {
    const templates = Object.entries(CURRICULUM_TEMPLATES).map(([board, data]) => ({
        board,
        classes: data.classes,
        subjects: Object.keys(data.subjects),
        totalChapters: Object.values(data.subjects).reduce((sum, s) => sum + s.chapters.length, 0),
    }))
    return NextResponse.json({ templates })
}

