import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

        const tenantId = session.tenant_id
        if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })

        const setId = request.nextUrl.searchParams.get('setId')

        // 1. If setId provided: Return set details with full question list
        if (setId) {
            const setRes = await query(`
                SELECT 
                    qs.*,
                    COUNT(q.id) AS total_questions,
                    COALESCE(SUM(q.marks), 0) AS total_marks
                FROM public.question_sets qs
                LEFT JOIN public.questions q ON q.set_id = qs.id
                WHERE qs.id = $1 AND qs.tenant_id = $2
                GROUP BY qs.id;
            `, [setId, tenantId])

            if (setRes.rows.length === 0) {
                return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
            }

            const questionsRes = await query(`
                SELECT 
                    id,
                    type,
                    sub_type,
                    question_text,
                    options,
                    correct_answer,
                    explanation,
                    difficulty,
                    marks,
                    negative_marks,
                    source,
                    created_at,
                    updated_at
                FROM public.questions
                WHERE set_id = $1 AND tenant_id = $2
                ORDER BY created_at ASC;
            `, [setId, tenantId])

            const formattedQuestions = (questionsRes.rows || []).map((q: any) => {
                let textEn = ''
                let textGu = ''
                if (typeof q.question_text === 'object' && q.question_text !== null) {
                    textEn = q.question_text.en || q.question_text.text || ''
                    textGu = q.question_text.gu || ''
                } else {
                    textEn = String(q.question_text || '')
                }

                let parsedOptions = q.options
                if (typeof parsedOptions === 'string') {
                    try { parsedOptions = JSON.parse(parsedOptions) } catch (e) { parsedOptions = [] }
                }

                let parsedCorrect = q.correct_answer
                if (typeof parsedCorrect === 'object' && parsedCorrect !== null) {
                    parsedCorrect = parsedCorrect.answer || parsedCorrect.en || Object.values(parsedCorrect)[0]
                }

                let parsedExp = q.explanation
                if (typeof parsedExp === 'object' && parsedExp !== null) {
                    parsedExp = parsedExp.en || parsedExp.text || ''
                }

                return {
                    ...q,
                    text_en: textEn,
                    text_gu: textGu,
                    options: Array.isArray(parsedOptions) ? parsedOptions : [],
                    correct_answer: parsedCorrect || '',
                    explanation: parsedExp || '',
                    marks: Number(q.marks) || 1,
                    difficulty: q.difficulty || 'medium'
                }
            })

            return NextResponse.json({
                set: setRes.rows[0],
                questions: formattedQuestions
            })
        }

        // 2. Default: Return all question sets with statistics
        const setsRes = await query(`
            SELECT 
                qs.id,
                qs.tenant_id,
                qs.title,
                qs.description,
                qs.board_id,
                qs.class_id,
                qs.subject_id,
                qs.chapter_id,
                qs.board_name,
                qs.class_name,
                qs.subject_name,
                qs.chapter_name,
                qs.created_at,
                qs.updated_at,
                COUNT(q.id) AS total_questions,
                COUNT(q.id) FILTER (WHERE q.type = 'objective' OR q.sub_type = 'mcq') AS objective_count,
                COUNT(q.id) FILTER (WHERE q.type = 'subjective' OR q.type = 'theory' OR q.sub_type = 'short_answer' OR q.sub_type = 'long_answer') AS descriptive_count,
                COUNT(q.id) FILTER (WHERE q.difficulty = 'easy') AS easy_count,
                COUNT(q.id) FILTER (WHERE q.difficulty = 'medium' OR q.difficulty IS NULL) AS medium_count,
                COUNT(q.id) FILTER (WHERE q.difficulty = 'hard') AS hard_count,
                COALESCE(SUM(q.marks), 0) AS total_marks
            FROM public.question_sets qs
            LEFT JOIN public.questions q ON q.set_id = qs.id
            WHERE qs.tenant_id = $1
            GROUP BY qs.id
            ORDER BY qs.updated_at DESC, qs.created_at DESC;
        `, [tenantId])

        // 3. Fetch syllabus nodes (boards, classes, subjects, chapters, topics) belonging to this school's course syllabus
        const syllabusTreeQuery = `
            WITH RECURSIVE syllabus_tree AS (
                SELECT 
                    sn.id,
                    sn.name,
                    sn.type,
                    sn.parent_id,
                    sn.tenant_id,
                    sn.is_active,
                    sn.order_index,
                    0 AS depth
                FROM public.syllabus_nodes sn
                WHERE sn.id IN (
                    SELECT master_syllabus_id 
                    FROM public.tenant_syllabus 
                    WHERE tenant_id = $1 AND is_active = true
                ) OR (sn.tenant_id = $1 AND sn.parent_id IS NULL AND sn.type = 'board' AND sn.is_active = true)

                UNION ALL

                SELECT 
                    child.id,
                    child.name,
                    child.type,
                    child.parent_id,
                    child.tenant_id,
                    child.is_active,
                    child.order_index,
                    st.depth + 1 AS depth
                FROM public.syllabus_nodes child
                JOIN syllabus_tree st ON child.parent_id = st.id
            )
            SELECT id, parent_id, type, name FROM syllabus_tree 
            WHERE is_active = true
            ORDER BY depth ASC, order_index ASC, name ASC;
        `
        const syllabusNodesRes = await query(syllabusTreeQuery, [tenantId])
        const allNodes = syllabusNodesRes.rows || []

        const boards = allNodes.filter(n => n.type === 'board')
        const classes = allNodes.filter(n => n.type === 'class')
        const subjects = allNodes.filter(n => n.type === 'subject')
        const chapters = allNodes.filter(n => n.type === 'chapter')
        const topics = allNodes.filter(n => n.type === 'topic')

        return NextResponse.json({
            sets: setsRes.rows || [],
            syllabus: {
                boards,
                classes,
                subjects,
                chapters,
                topics
            }
        })
    } catch (err: any) {
        console.error('Error fetching question bank:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

        const tenantId = session.tenant_id
        const userId = session.id
        if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })

        const body = await request.json()
        const { action, payload } = body

        // 1. CREATE NEW QUESTION SET
        if (action === 'CREATE_SET') {
            const {
                title,
                description,
                board_id,
                class_id,
                subject_id,
                chapter_id,
                board_name,
                class_name,
                subject_name,
                chapter_name
            } = payload || {}

            if (!title?.trim()) {
                return NextResponse.json({ error: 'Question set title is required' }, { status: 400 })
            }

            const { rows } = await query(`
                INSERT INTO public.question_sets (
                    tenant_id,
                    title,
                    description,
                    board_id,
                    class_id,
                    subject_id,
                    chapter_id,
                    board_name,
                    class_name,
                    subject_name,
                    chapter_name,
                    created_by,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
                RETURNING *;
            `, [
                tenantId,
                title.trim(),
                description?.trim() || '',
                board_id || null,
                class_id || null,
                subject_id || null,
                chapter_id || null,
                board_name || 'Board Standard',
                class_name || 'Class 10',
                subject_name || 'General',
                chapter_name || 'Chapter Practice',
                userId || null
            ])

            return NextResponse.json({ success: true, set: rows[0] })
        }

        // 2. UPDATE EXISTING QUESTION SET
        if (action === 'UPDATE_SET') {
            const {
                id,
                title,
                description,
                board_id,
                class_id,
                subject_id,
                chapter_id,
                board_name,
                class_name,
                subject_name,
                chapter_name
            } = payload || {}

            if (!id || !title?.trim()) {
                return NextResponse.json({ error: 'Question set ID and title are required' }, { status: 400 })
            }

            const { rows } = await query(`
                UPDATE public.question_sets SET
                    title = $1,
                    description = $2,
                    board_id = $3,
                    class_id = $4,
                    subject_id = $5,
                    chapter_id = $6,
                    board_name = $7,
                    class_name = $8,
                    subject_name = $9,
                    chapter_name = $10,
                    updated_at = NOW()
                WHERE id = $11 AND tenant_id = $12
                RETURNING *;
            `, [
                title.trim(),
                description?.trim() || '',
                board_id || null,
                class_id || null,
                subject_id || null,
                chapter_id || null,
                board_name || '',
                class_name || '',
                subject_name || '',
                chapter_name || '',
                id,
                tenantId
            ])

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
            }

            return NextResponse.json({ success: true, set: rows[0] })
        }

        // 3. DELETE ENTIRE QUESTION SET
        if (action === 'DELETE_SET') {
            const { id } = payload || {}
            if (!id) return NextResponse.json({ error: 'Set ID is required' }, { status: 400 })

            // Delete questions associated with the set
            await query(`DELETE FROM public.questions WHERE set_id = $1 AND tenant_id = $2;`, [id, tenantId])

            // Delete the set
            const { rowCount } = await query(`DELETE FROM public.question_sets WHERE id = $1 AND tenant_id = $2;`, [id, tenantId])

            if (rowCount === 0) {
                return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
            }

            return NextResponse.json({ success: true, message: 'Question set and all associated questions deleted.' })
        }

        // 4. ADD QUESTION TO SET
        if (action === 'ADD_QUESTION') {
            const {
                set_id,
                type = 'objective',
                sub_type = 'mcq',
                text_en,
                text_gu,
                options = [],
                correct_answer,
                explanation,
                marks = 1,
                negative_marks = 0,
                difficulty = 'medium'
            } = payload || {}

            if (!set_id) {
                return NextResponse.json({ error: 'Target question set is required' }, { status: 400 })
            }
            if (!text_en?.trim()) {
                return NextResponse.json({ error: 'Question text is required' }, { status: 400 })
            }

            // Verify set ownership
            const setRes = await query(`SELECT subject_id, chapter_id FROM public.question_sets WHERE id = $1 AND tenant_id = $2;`, [set_id, tenantId])
            if (setRes.rows.length === 0) {
                return NextResponse.json({ error: 'Question set not found' }, { status: 404 })
            }
            const { subject_id, chapter_id } = setRes.rows[0]

            const questionTextObj: any = { en: text_en.trim() }
            if (text_gu?.trim()) {
                questionTextObj.gu = text_gu.trim()
            }

            // Normalize type and sub_type to DB constraint ('objective' | 'subjective' & 'mcq' | 'numerical' | 'descriptive')
            const isSubj = type === 'subjective' || type === 'short_answer' || type === 'long_answer' || type === 'descriptive'
            const dbType = isSubj ? 'subjective' : 'objective'
            const dbSubType = type === 'numerical' ? 'numerical' : (isSubj ? 'descriptive' : 'mcq')

            const optionsData = Array.isArray(options) && options.length > 0 ? JSON.stringify(options) : null
            const answerObj = JSON.stringify(typeof correct_answer === 'string' ? correct_answer.trim() : (correct_answer || ''))
            const explanationObj = explanation ? { en: explanation.trim() } : null

            const rawDiff = (difficulty || 'medium').toString().toLowerCase()
            const cleanDiff = ['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium'

            const { rows: newQ } = await query(`
                INSERT INTO public.questions (
                    tenant_id,
                    set_id,
                    subject_id,
                    chapter_id,
                    type,
                    sub_type,
                    question_text,
                    options,
                    correct_answer,
                    explanation,
                    difficulty,
                    marks,
                    negative_marks,
                    source,
                    created_by,
                    created_at,
                    updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'manual', $14, NOW(), NOW())
                RETURNING *;
            `, [
                tenantId,
                set_id,
                subject_id,
                chapter_id,
                dbType,
                dbSubType,
                JSON.stringify(questionTextObj),
                optionsData,
                answerObj,
                explanationObj ? JSON.stringify(explanationObj) : null,
                cleanDiff,
                Number(marks) || 1,
                Number(negative_marks) || 0,
                userId || null
            ])

            // Touch updated_at on set
            await query(`UPDATE public.question_sets SET updated_at = NOW() WHERE id = $1;`, [set_id])

            return NextResponse.json({ success: true, question: newQ[0] })
        }

        // 4b. BATCH ADD QUESTIONS (For AI Question Generator Integration)
        if (action === 'BATCH_ADD_QUESTIONS') {
            const {
                set_id: rawSetId,
                set_name,
                title,
                board_name,
                class_name,
                subject_name,
                chapter_name,
                board_id,
                class_id,
                subject_id: customSubjectId,
                chapter_id: customChapterId,
                questions = []
            } = payload || {}

            const targetTitle = (set_name || title || '').trim()

            if (!rawSetId && !targetTitle) {
                return NextResponse.json({ error: 'Question set name or target set ID is required' }, { status: 400 })
            }
            if (!Array.isArray(questions) || questions.length === 0) {
                return NextResponse.json({ error: 'No questions provided to insert' }, { status: 400 })
            }

            let effectiveSetId = rawSetId
            let finalSubjectId = customSubjectId || null
            let finalChapterId = customChapterId || null
            let effectiveSetTitle = targetTitle

            if (effectiveSetId) {
                const setRes = await query(`SELECT id, title, subject_id, chapter_id FROM public.question_sets WHERE id = $1 AND tenant_id = $2;`, [effectiveSetId, tenantId])
                if (setRes.rows.length > 0) {
                    finalSubjectId = setRes.rows[0].subject_id || finalSubjectId
                    finalChapterId = setRes.rows[0].chapter_id || finalChapterId
                    effectiveSetTitle = setRes.rows[0].title
                } else {
                    effectiveSetId = null
                }
            }

            // If no valid set ID by raw ID, resolve by Title or create new Question Set
            if (!effectiveSetId) {
                const existingRes = await query(`SELECT id, title, subject_id, chapter_id FROM public.question_sets WHERE tenant_id = $1 AND LOWER(title) = LOWER($2);`, [tenantId, targetTitle])
                if (existingRes.rows.length > 0) {
                    effectiveSetId = existingRes.rows[0].id
                    finalSubjectId = existingRes.rows[0].subject_id || finalSubjectId
                    finalChapterId = existingRes.rows[0].chapter_id || finalChapterId
                    effectiveSetTitle = existingRes.rows[0].title
                } else {
                    const createRes = await query(`
                        INSERT INTO public.question_sets (
                            tenant_id,
                            title,
                            description,
                            board_id,
                            class_id,
                            subject_id,
                            chapter_id,
                            board_name,
                            class_name,
                            subject_name,
                            chapter_name,
                            created_by,
                            created_at,
                            updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
                        RETURNING id, title;
                    `, [
                        tenantId,
                        targetTitle,
                        'Generated & approved via AI Curriculum Assistant',
                        board_id || null,
                        class_id || null,
                        finalSubjectId,
                        finalChapterId,
                        board_name || 'Board Standard',
                        class_name || 'Class 10',
                        subject_name || 'General',
                        chapter_name || 'Curriculum Practice',
                        userId || null
                    ])
                    effectiveSetId = createRes.rows[0].id
                    effectiveSetTitle = createRes.rows[0].title
                }
            }

            let insertedCount = 0
            for (const q of questions) {
                const text_en = (q.text_en || q.question_text || q.text || '').toString().trim()
                if (!text_en) continue

                const questionTextObj: any = { en: text_en }
                if (q.text_gu?.trim()) {
                    questionTextObj.gu = q.text_gu.trim()
                }

                const isSubj = q.type === 'subjective' || q.type === 'short_answer' || q.type === 'long_answer' || q.type === 'descriptive'
                const dbType = isSubj ? 'subjective' : 'objective'
                const dbSubType = q.type === 'numerical' ? 'numerical' : (isSubj ? 'descriptive' : 'mcq')
                const rawDiff = (q.difficulty || 'medium').toString().toLowerCase()
                const cleanDiff = ['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium'

                const optionsData = Array.isArray(q.options) && q.options.length > 0 ? JSON.stringify(q.options) : null
                const answerObj = JSON.stringify(typeof q.correct_answer === 'string' ? q.correct_answer.trim() : (q.correct_answer || ''))
                const explanationObj = q.explanation ? { en: q.explanation.trim() } : null

                await query(`
                    INSERT INTO public.questions (
                        tenant_id,
                        set_id,
                        subject_id,
                        chapter_id,
                        type,
                        sub_type,
                        question_text,
                        options,
                        correct_answer,
                        explanation,
                        difficulty,
                        marks,
                        negative_marks,
                        source,
                        created_by,
                        created_at,
                        updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'ai', $14, NOW(), NOW());
                `, [
                    tenantId,
                    effectiveSetId,
                    finalSubjectId,
                    finalChapterId,
                    dbType,
                    dbSubType,
                    JSON.stringify(questionTextObj),
                    optionsData,
                    answerObj,
                    explanationObj ? JSON.stringify(explanationObj) : null,
                    cleanDiff,
                    Number(q.marks) || 1,
                    Number(q.negative_marks) || 0,
                    userId || null
                ])
                insertedCount++
            }

            await query(`UPDATE public.question_sets SET updated_at = NOW() WHERE id = $1;`, [effectiveSetId])
            return NextResponse.json({ success: true, set_id: effectiveSetId, set_title: effectiveSetTitle, count: insertedCount })
        }

        // 5. UPDATE QUESTION
        if (action === 'UPDATE_QUESTION') {
            const {
                id,
                type,
                sub_type,
                text_en,
                text_gu,
                options,
                correct_answer,
                explanation,
                marks,
                negative_marks,
                difficulty
            } = payload || {}

            if (!id) return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
            if (!text_en?.trim()) return NextResponse.json({ error: 'Question text is required' }, { status: 400 })

            const questionTextObj: any = { en: text_en.trim() }
            if (text_gu?.trim()) {
                questionTextObj.gu = text_gu.trim()
            }

            let dbType = null
            let dbSubType = null
            if (type) {
                const isSubj = type === 'subjective' || type === 'short_answer' || type === 'long_answer' || type === 'descriptive'
                dbType = isSubj ? 'subjective' : 'objective'
                dbSubType = type === 'numerical' ? 'numerical' : (isSubj ? 'descriptive' : 'mcq')
            }

            const optionsData = Array.isArray(options) && options.length > 0 ? JSON.stringify(options) : null
            const answerObj = JSON.stringify(typeof correct_answer === 'string' ? correct_answer.trim() : (correct_answer || ''))
            const explanationObj = explanation ? { en: explanation.trim() } : null

            const cleanDiff = difficulty ? (['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase()) ? String(difficulty).toLowerCase() : null) : null

            const { rows: updatedQ } = await query(`
                UPDATE public.questions SET
                    type = COALESCE($1, type),
                    sub_type = COALESCE($2, sub_type),
                    question_text = $3,
                    options = $4,
                    correct_answer = $5,
                    explanation = $6,
                    difficulty = COALESCE($7, difficulty),
                    marks = COALESCE($8, marks),
                    negative_marks = COALESCE($9, negative_marks),
                    updated_at = NOW()
                WHERE id = $10 AND tenant_id = $11
                RETURNING *;
            `, [
                dbType,
                dbSubType,
                JSON.stringify(questionTextObj),
                optionsData,
                answerObj,
                explanationObj ? JSON.stringify(explanationObj) : null,
                cleanDiff,
                marks !== undefined ? Number(marks) : null,
                negative_marks !== undefined ? Number(negative_marks) : null,
                id,
                tenantId
            ])

            if (updatedQ.length === 0) {
                return NextResponse.json({ error: 'Question not found' }, { status: 404 })
            }

            return NextResponse.json({ success: true, question: updatedQ[0] })
        }

        // 6. DELETE QUESTION
        if (action === 'DELETE_QUESTION') {
            const { id } = payload || {}
            if (!id) return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })

            const { rowCount } = await query(`
                DELETE FROM public.questions 
                WHERE id = $1 AND tenant_id = $2;
            `, [id, tenantId])

            if (rowCount === 0) {
                return NextResponse.json({ error: 'Question not found' }, { status: 404 })
            }

            return NextResponse.json({ success: true, message: 'Question deleted successfully.' })
        }

        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    } catch (err: any) {
        console.error('Error handling question bank action:', err)
        return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
    }
}
