import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'
import { syncSyllabusToTenantAcademy } from '@/lib/syllabus-sync'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })
        }

        const tenantId = session.tenant_id
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
        }

        // 1. Fetch Tenant Multi-Board Setting & Details
        const tenantRes = await query(
            `SELECT id, name, subscription_plan, COALESCE((features->>'multi_board_enabled')::boolean, false) AS multi_board_enabled
             FROM public.tenants WHERE id = $1`,
            [tenantId]
        )
        const tenantInfo = tenantRes.rows?.[0] || {
            id: tenantId,
            name: 'Academic Institute',
            subscription_plan: 'Standard Plan',
            multi_board_enabled: false
        }
        const multiBoardEnabled = Boolean(tenantInfo.multi_board_enabled)

        // 2. Fetch Active Boards (Tenant Synced, Tenant Custom, or Owner Public Master Library)
        const activeBoardsRes = await query(
            `SELECT 
                b.id,
                b.name,
                b.type,
                b.tenant_id,
                b.is_active,
                b.order_index,
                b.created_at,
                CASE 
                    WHEN b.tenant_id IS NULL THEN 'owner_public'
                    WHEN b.description ILIKE '%excel%' OR b.name ILIKE '%excel%' OR b.name ILIKE '%import%' THEN 'excel'
                    ELSE 'manual'
                END AS source_type,
                COALESCE(ts.is_active, false) AS is_tenant_synced,
                ts.access_level
             FROM public.syllabus_nodes b
             LEFT JOIN public.tenant_syllabus ts ON ts.master_syllabus_id = b.id AND ts.tenant_id = $1
             WHERE (ts.tenant_id = $1 AND ts.is_active = true)
                OR (b.tenant_id = $1 AND b.parent_id IS NULL AND b.type = 'board' AND b.is_active = true)
             ORDER BY 
                (CASE WHEN ts.is_active = true THEN 0 WHEN b.tenant_id = $1 THEN 1 ELSE 2 END),
                b.order_index ASC, b.name ASC`,
            [tenantId]
        )
        const activeBoards = activeBoardsRes.rows || []

        // 3. If there are active boards, fetch their full cascading hierarchy (Class -> Subject -> Chapter -> Topic)
        let classes: any[] = []
        let subjects: any[] = []
        let chapters: any[] = []
        let topics: any[] = []

        if (activeBoards.length > 0) {
            const boardIds = activeBoards.map((b: any) => b.id)

            // Classes
            const classesRes = await query(
                `SELECT c.id, c.name, c.parent_id AS board_id, c.order_index
                 FROM public.syllabus_nodes c
                 WHERE c.parent_id = ANY($1) AND c.type = 'class' AND c.is_active = true
                 ORDER BY c.order_index ASC, c.name ASC`,
                [boardIds]
            )
            classes = classesRes.rows || []

            const classIds = classes.map((c: any) => c.id)

            if (classIds.length > 0) {
                // Subjects
                const subjectsRes = await query(
                    `SELECT s.id, s.name, s.parent_id AS class_node_id, s.order_index
                     FROM public.syllabus_nodes s
                     WHERE s.parent_id = ANY($1) AND s.type = 'subject' AND s.is_active = true
                     ORDER BY s.order_index ASC, s.name ASC`,
                    [classIds]
                )
                subjects = subjectsRes.rows || []

                const subjectIds = subjects.map((s: any) => s.id)

                if (subjectIds.length > 0) {
                    // Chapters
                    const chaptersRes = await query(
                        `SELECT ch.id, ch.name, ch.parent_id AS subject_node_id, ch.order_index,
                                COALESCE(ch.exam_weightage, 0) AS exam_weightage,
                                COALESCE(ch.question_count, 0) AS question_count,
                                ch.difficulty_level
                         FROM public.syllabus_nodes ch
                         WHERE ch.parent_id = ANY($1) AND ch.type = 'chapter' AND ch.is_active = true
                         ORDER BY ch.order_index ASC, ch.name ASC`,
                        [subjectIds]
                    )
                    chapters = chaptersRes.rows || []

                    const chapterIds = chapters.map((ch: any) => ch.id)

                    if (chapterIds.length > 0) {
                        // Topics
                        const topicsRes = await query(
                            `SELECT tp.id, tp.name, tp.parent_id AS chapter_node_id, tp.order_index
                             FROM public.syllabus_nodes tp
                             WHERE tp.parent_id = ANY($1) AND tp.type = 'topic' AND tp.is_active = true
                             ORDER BY tp.order_index ASC, tp.name ASC`,
                            [chapterIds]
                        )
                        topics = topicsRes.rows || []
                    }
                }
            }
        }

        // 4. Fetch Owner Public & School Custom Exam Patterns (paper_templates with sections & rules)
        const patternsQuery = `
            SELECT 
                pt.id,
                pt.name,
                pt.category,
                pt.exam_type,
                pt.duration_minutes,
                pt.total_marks,
                pt.instructions,
                pt.description,
                pt.tags,
                pt.is_global,
                pt.is_active,
                pt.created_by,
                pt.created_at,
                (pt.is_global = true AND (pt.created_by IS NULL OR pt.created_by != $1)) AS is_owner_pattern,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', ts.id,
                                'section_name', ts.section_name,
                                'section_type', ts.section_type,
                                'optional_flag', ts.optional_flag,
                                'instructions', ts.instructions,
                                'order_index', ts.order_index,
                                'rules', COALESCE(
                                    (
                                        SELECT json_agg(
                                            json_build_object(
                                                'id', sqr.id,
                                                'question_type', sqr.question_type,
                                                'num_questions', sqr.num_questions,
                                                'marks_per_question', sqr.marks_per_question,
                                                'negative_marks', sqr.negative_marks,
                                                'difficulty_easy_pct', sqr.difficulty_easy_pct,
                                                'difficulty_medium_pct', sqr.difficulty_medium_pct,
                                                'difficulty_hard_pct', sqr.difficulty_hard_pct,
                                                'internal_choice', sqr.internal_choice,
                                                'order_index', sqr.order_index
                                            ) ORDER BY sqr.order_index ASC
                                        )
                                        FROM public.section_question_rules sqr
                                        WHERE sqr.section_id = ts.id
                                    ), '[]'::json
                                )
                            ) ORDER BY ts.order_index ASC
                        )
                        FROM public.template_sections ts
                        WHERE ts.template_id = pt.id
                    ), '[]'::json
                ) AS sections
            FROM public.paper_templates pt
            WHERE pt.is_active = true AND (
                pt.is_global = true 
                OR pt.created_by = $1 
                OR pt.id IN (
                    SELECT template_id FROM public.offline_exams WHERE tenant_id = $1 AND template_id IS NOT NULL
                )
            )
            ORDER BY 
                (CASE WHEN pt.created_by = $1 THEN 0 ELSE 1 END),
                pt.category ASC, pt.name ASC;
        `
        const patternsRes = await query(patternsQuery, [tenantId])
        const examPatterns = patternsRes.rows || []

        // 5. Fetch Available Owner Public Syllabuses (for fast 1-click adoption)
        const ownerCatalogQuery = `
            SELECT 
                b.id,
                b.name,
                b.order_index,
                (SELECT COUNT(*) FROM public.syllabus_nodes c WHERE c.parent_id = b.id AND c.type = 'class' AND c.is_active = true) AS classes_count,
                (SELECT COUNT(*) FROM public.syllabus_nodes s WHERE s.type = 'subject' AND s.is_active = true AND s.parent_id IN (
                    SELECT c.id FROM public.syllabus_nodes c WHERE c.parent_id = b.id
                )) AS subjects_count,
                EXISTS (
                    SELECT 1 FROM public.tenant_syllabus ts 
                    WHERE ts.tenant_id = $1 AND ts.master_syllabus_id = b.id AND ts.is_active = true
                ) AS is_active_for_tenant
            FROM public.syllabus_nodes b
            WHERE b.type = 'board' AND b.tenant_id IS NULL AND b.is_active = true
            ORDER BY b.order_index ASC, b.name ASC;
        `
        const ownerCatalogRes = await query(ownerCatalogQuery, [tenantId])
        const ownerCatalog = ownerCatalogRes.rows || []

        // 6. Fetch OMR Bubble Layouts (if available for tenant)
        const omrTemplatesRes = await query(
            `SELECT id, name, total_questions, options_per_question, layout_config, is_active
             FROM public.omr_templates
             WHERE (tenant_id = $1 OR tenant_id IS NULL) AND is_active = true
             ORDER BY total_questions ASC`,
            [tenantId]
        )
        const omrLayoutTemplates = omrTemplatesRes.rows || []

        // 7. Academic Synchronized Classes & Subjects (from public.classes and public.subjects)
        const [instClassesRes, instSubjectsRes] = await Promise.all([
            query(`SELECT id, name, code FROM public.classes WHERE tenant_id = $1 AND is_active = true ORDER BY sort_order ASC, name ASC`, [tenantId]),
            query(`SELECT id, name, code FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId])
        ])

        return NextResponse.json({
            success: true,
            tenant: {
                id: tenantId,
                name: tenantInfo.name,
                multiBoardEnabled
            },
            activeBoards,
            syllabusTree: {
                classes,
                subjects,
                chapters,
                topics
            },
            examPatterns,
            ownerCatalog,
            omrLayoutTemplates,
            academic: {
                classes: instClassesRes.rows || [],
                subjects: instSubjectsRes.rows || []
            }
        })
    } catch (e: any) {
        console.error('[blueprint-context GET Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })
        }

        const tenantId = session.tenant_id
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 })
        }

        const body = await request.json()
        const { action, payload } = body

        // Check multi-board feature
        const { rows: tRows } = await query(
            `SELECT COALESCE((features->>'multi_board_enabled')::boolean, false) AS multi_board_enabled FROM public.tenants WHERE id = $1`,
            [tenantId]
        )
        const multiBoardEnabled = Boolean(tRows?.[0]?.multi_board_enabled)

        // ── 1. IMPORT OWNER PUBLIC SYLLABUS ──────────────────────────────
        if (action === 'IMPORT_OWNER_SYLLABUS') {
            const { board_id } = payload
            if (!board_id) {
                return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })
            }

            const { rows: bRows } = await query(
                `SELECT id, name FROM public.syllabus_nodes WHERE id = $1 AND type = 'board' AND tenant_id IS NULL`,
                [board_id]
            )
            if (bRows.length === 0) {
                return NextResponse.json({ error: 'Selected board not found in owner catalog' }, { status: 404 })
            }
            const boardName = bRows[0].name

            if (!multiBoardEnabled) {
                await query(`UPDATE public.tenant_syllabus SET is_active = false, updated_at = NOW() WHERE tenant_id = $1`, [tenantId])
                await query(`UPDATE public.syllabus_nodes SET is_active = false, updated_at = NOW() WHERE tenant_id = $1 AND parent_id IS NULL AND type = 'board'`, [tenantId])
            }

            const { rows: existingRows } = await query(
                `SELECT id FROM public.tenant_syllabus WHERE tenant_id = $1 AND master_syllabus_id = $2`,
                [tenantId, board_id]
            )

            if (existingRows.length > 0) {
                await query(`UPDATE public.tenant_syllabus SET is_active = true, updated_at = NOW() WHERE id = $1`, [existingRows[0].id])
            } else {
                await query(
                    `INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level)
                     VALUES ($1, $2, true, 1, 'full')`,
                    [tenantId, board_id]
                )
            }

            // Sync to academy
            let syncStats = { syncedClasses: 0, syncedSubjects: 0 }
            try {
                const resSync = await syncSyllabusToTenantAcademy(tenantId, board_id)
                syncStats = { syncedClasses: resSync.syncedClasses, syncedSubjects: resSync.syncedSubjects }
            } catch (syncErr) {
                console.error('[Blueprint Context Auto-Sync Warning]:', syncErr)
            }

            return NextResponse.json({
                success: true,
                message: `Successfully imported "${boardName}" as active curriculum.`,
                boardName,
                syncStats
            })
        }

        // ── 2. BULK UPLOAD EXCEL SYLLABUS ROWS ───────────────────────────
        if (action === 'UPLOAD_EXCEL_SYLLABUS') {
            const { rows, board_name = 'Custom Spreadsheet Curriculum' } = payload
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                return NextResponse.json({ error: 'No valid rows provided for Excel syllabus import' }, { status: 400 })
            }

            if (!multiBoardEnabled) {
                await query(`UPDATE public.tenant_syllabus SET is_active = false, updated_at = NOW() WHERE tenant_id = $1`, [tenantId])
                await query(`UPDATE public.syllabus_nodes SET is_active = false, updated_at = NOW() WHERE tenant_id = $1 AND parent_id IS NULL AND type = 'board'`, [tenantId])
            }

            // Create new board node representing this Excel import
            const cleanBoardName = (board_name || 'Custom Spreadsheet Curriculum').trim()
            const { rows: newB } = await query(
                `INSERT INTO public.syllabus_nodes (name, type, tenant_id, is_active, order_index, description)
                 VALUES ($1, 'board', $2, true, 0, 'Imported from Excel spreadsheet')
                 RETURNING id`,
                [cleanBoardName, tenantId]
            )
            const boardId = newB[0].id as string

            await query(
                `INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level)
                 VALUES ($1, $2, true, 1, 'full')`,
                [tenantId, boardId]
            )

            const classCache = new Map<string, string>()
            const subjectCache = new Map<string, string>()
            const chapterCache = new Map<string, string>()

            for (const r of rows) {
                const className = (r.class_name || r.Class || r.Grade || r.grade || '').toString().trim()
                const subjectName = (r.subject_name || r.Subject || r.subject || '').toString().trim()
                const chapterName = (r.chapter_name || r.Chapter || r.Unit || r.chapter || '').toString().trim()
                const topicName = (r.topic_name || r.Topic || r.topic || '').toString().trim()

                if (!className || !subjectName) continue

                // 1. Class
                let classId: string | undefined = classCache.get(className)
                if (!classId) {
                    const { rows: existingClasses } = await query(
                        `SELECT id FROM public.syllabus_nodes WHERE parent_id = $1 AND name ILIKE $2 LIMIT 1`,
                        [boardId, className]
                    )
                    if (existingClasses.length > 0) {
                        classId = existingClasses[0].id as string
                    } else {
                        const { rows: newClass } = await query(
                            `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active)
                             VALUES ($1, $2, 'class', $3, true) RETURNING id`,
                            [boardId, className, tenantId]
                        )
                        classId = newClass[0].id as string
                    }
                    if (classId) classCache.set(className, classId)
                }

                if (!classId) continue

                // 2. Subject
                const subjectKey = `${classId}_${subjectName.toLowerCase()}`
                let subjectId: string | undefined = subjectCache.get(subjectKey)
                if (!subjectId) {
                    const { rows: existingSubjects } = await query(
                        `SELECT id FROM public.syllabus_nodes WHERE parent_id = $1 AND name ILIKE $2 LIMIT 1`,
                        [classId, subjectName]
                    )
                    if (existingSubjects.length > 0) {
                        subjectId = existingSubjects[0].id as string
                    } else {
                        const { rows: newSub } = await query(
                            `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active)
                             VALUES ($1, $2, 'subject', $3, true) RETURNING id`,
                            [classId, subjectName, tenantId]
                        )
                        subjectId = newSub[0].id as string
                    }
                    if (subjectId) subjectCache.set(subjectKey, subjectId)
                }

                if (!subjectId) continue

                // 3. Chapter
                if (chapterName) {
                    const chapterKey = `${subjectId}_${chapterName.toLowerCase()}`
                    let chapterId: string | undefined = chapterCache.get(chapterKey)
                    if (!chapterId) {
                        const { rows: existingChapters } = await query(
                            `SELECT id FROM public.syllabus_nodes WHERE parent_id = $1 AND name ILIKE $2 LIMIT 1`,
                            [subjectId, chapterName]
                        )
                        if (existingChapters.length > 0) {
                            chapterId = existingChapters[0].id as string
                        } else {
                            const { rows: newChap } = await query(
                                `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active)
                                 VALUES ($1, $2, 'chapter', $3, true) RETURNING id`,
                                [subjectId, chapterName, tenantId]
                            )
                            chapterId = newChap[0].id as string
                        }
                        if (chapterId) chapterCache.set(chapterKey, chapterId)
                    }

                    // 4. Topic
                    if (chapterId && topicName) {
                        const { rows: existingTopics } = await query(
                            `SELECT id FROM public.syllabus_nodes WHERE parent_id = $1 AND name ILIKE $2 LIMIT 1`,
                            [chapterId, topicName]
                        )
                        if (existingTopics.length === 0) {
                            await query(
                                `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active)
                                 VALUES ($1, $2, 'topic', $3, true)`,
                                [chapterId, topicName, tenantId]
                            )
                        }
                    }
                }
            }

            // Sync to academy classes & subjects
            try {
                await syncSyllabusToTenantAcademy(tenantId, boardId)
            } catch (syncErr) {
                console.error('[Excel Upload Auto-Sync Warning]:', syncErr)
            }

            return NextResponse.json({
                success: true,
                message: `Spreadsheet curriculum "${cleanBoardName}" successfully imported and synchronized.`,
                boardId
            })
        }

        // ── 3. CREATE NEW PAPER PATTERN (TENANT CUSTOM) ──────────────────
        if (action === 'CREATE_PAPER_PATTERN') {
            const { name, category = 'School', exam_type = 'Mixed', duration_minutes = 180, total_marks = 80, instructions = [], description = '', sections = [] } = payload || {}
            if (!name?.trim()) {
                return NextResponse.json({ error: 'Paper pattern name is required' }, { status: 400 })
            }

            const cleanName = name.trim()
            const { rows: newPattern } = await query(
                `INSERT INTO public.paper_templates (
                    name, category, exam_type, duration_minutes, total_marks, instructions, description, is_global, is_active, created_by, version
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, $8, 1) RETURNING id`,
                [
                    cleanName,
                    category,
                    exam_type,
                    Number(duration_minutes) || 180,
                    Number(total_marks) || 80,
                    JSON.stringify(Array.isArray(instructions) ? instructions : [instructions].filter(Boolean)),
                    description || null,
                    tenantId
                ]
            )
            const templateId = newPattern[0].id

            // Insert sections & question rules if provided
            if (Array.isArray(sections) && sections.length > 0) {
                for (let si = 0; si < sections.length; si++) {
                    const sec = sections[si]
                    const { rows: newSec } = await query(
                        `INSERT INTO public.template_sections (
                            template_id, section_name, section_type, optional_flag, instructions, order_index
                         ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                        [
                            templateId,
                            sec.section_name || `Section ${String.fromCharCode(65 + si)}`,
                            sec.section_type || 'Mixed',
                            Boolean(sec.optional_flag),
                            sec.instructions || '',
                            si
                        ]
                    )
                    const secId = newSec[0].id
                    if (Array.isArray(sec.rules) && sec.rules.length > 0) {
                        for (let ri = 0; ri < sec.rules.length; ri++) {
                            const r = sec.rules[ri]
                            await query(
                                `INSERT INTO public.section_question_rules (
                                    section_id, question_type, num_questions, marks_per_question, negative_marks,
                                    difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, internal_choice, order_index
                                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                                [
                                    secId,
                                    r.question_type || 'MCQ',
                                    Number(r.num_questions) || 1,
                                    Number(r.marks_per_question) || 1,
                                    Number(r.negative_marks) || 0,
                                    Number(r.difficulty_easy_pct) || 30,
                                    Number(r.difficulty_medium_pct) || 50,
                                    Number(r.difficulty_hard_pct) || 20,
                                    Boolean(r.internal_choice),
                                    ri
                                ]
                            )
                        }
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: `Paper pattern "${cleanName}" created successfully.`,
                templateId
            })
        }

        // ── 4. UPDATE PAPER PATTERN ──────────────────────────────────────
        if (action === 'UPDATE_PAPER_PATTERN') {
            const { id, name, category, exam_type, duration_minutes, total_marks, instructions, description, sections } = payload || {}
            if (!id) return NextResponse.json({ error: 'Pattern ID is required' }, { status: 400 })
            if (!name?.trim()) return NextResponse.json({ error: 'Pattern name is required' }, { status: 400 })

            const cleanName = name.trim()
            const { rows: updated } = await query(
                `UPDATE public.paper_templates
                 SET name = $1, category = $2, exam_type = $3, duration_minutes = $4, total_marks = $5,
                     instructions = $6, description = $7, version = COALESCE(version, 1) + 1, updated_at = NOW()
                 WHERE id = $8 AND (created_by = $9 OR is_global = false)
                 RETURNING id`,
                [
                    cleanName,
                    category || 'School',
                    exam_type || 'Mixed',
                    Number(duration_minutes) || 180,
                    Number(total_marks) || 80,
                    JSON.stringify(Array.isArray(instructions) ? instructions : [instructions].filter(Boolean)),
                    description || null,
                    id,
                    tenantId
                ]
            )

            if (updated.length === 0) {
                return NextResponse.json({ error: 'Pattern not found or cannot be modified directly.' }, { status: 404 })
            }

            // Replace sections & rules
            if (Array.isArray(sections)) {
                await query(`DELETE FROM public.template_sections WHERE template_id = $1`, [id])
                for (let si = 0; si < sections.length; si++) {
                    const sec = sections[si]
                    const { rows: newSec } = await query(
                        `INSERT INTO public.template_sections (
                            template_id, section_name, section_type, optional_flag, instructions, order_index
                         ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                        [
                            id,
                            sec.section_name || `Section ${String.fromCharCode(65 + si)}`,
                            sec.section_type || 'Mixed',
                            Boolean(sec.optional_flag),
                            sec.instructions || '',
                            si
                        ]
                    )
                    const secId = newSec[0].id
                    if (Array.isArray(sec.rules)) {
                        for (let ri = 0; ri < sec.rules.length; ri++) {
                            const r = sec.rules[ri]
                            await query(
                                `INSERT INTO public.section_question_rules (
                                    section_id, question_type, num_questions, marks_per_question, negative_marks,
                                    difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, internal_choice, order_index
                                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                                [
                                    secId,
                                    r.question_type || 'MCQ',
                                    Number(r.num_questions) || 1,
                                    Number(r.marks_per_question) || 1,
                                    Number(r.negative_marks) || 0,
                                    Number(r.difficulty_easy_pct) || 30,
                                    Number(r.difficulty_medium_pct) || 50,
                                    Number(r.difficulty_hard_pct) || 20,
                                    Boolean(r.internal_choice),
                                    ri
                                ]
                            )
                        }
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: `Paper pattern "${cleanName}" updated successfully.`
            })
        }

        // ── 5. CLONE & CUSTOMIZE OWNER PATTERN FOR TENANT ─────────────────
        if (action === 'CLONE_AND_CUSTOMIZE_PATTERN') {
            const { pattern_id, custom_name } = payload || {}
            if (!pattern_id) return NextResponse.json({ error: 'Source pattern ID is required' }, { status: 400 })

            const { rows: srcRows } = await query(`SELECT * FROM public.paper_templates WHERE id = $1`, [pattern_id])
            if (srcRows.length === 0) return NextResponse.json({ error: 'Source pattern not found' }, { status: 404 })
            const src = srcRows[0]

            const cloneName = (custom_name || `${src.name} (Customized)`).trim()
            const { rows: cloneRows } = await query(
                `INSERT INTO public.paper_templates (
                    name, category, exam_type, duration_minutes, total_marks, instructions, description,
                    is_global, is_active, created_by, version, cloned_from
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, true, $8, 1, $9) RETURNING id`,
                [
                    cloneName,
                    src.category,
                    src.exam_type,
                    src.duration_minutes,
                    src.total_marks,
                    JSON.stringify(src.instructions || []),
                    src.description,
                    tenantId,
                    src.id
                ]
            )
            const cloneId = cloneRows[0].id

            // Copy sections & rules from source
            const { rows: srcSections } = await query(
                `SELECT * FROM public.template_sections WHERE template_id = $1 ORDER BY order_index ASC`,
                [src.id]
            )
            for (const sec of srcSections) {
                const { rows: newSec } = await query(
                    `INSERT INTO public.template_sections (
                        template_id, section_name, section_type, optional_flag, instructions, order_index
                     ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                    [cloneId, sec.section_name, sec.section_type, sec.optional_flag, sec.instructions, sec.order_index]
                )
                const newSecId = newSec[0].id
                const { rows: srcRules } = await query(
                    `SELECT * FROM public.section_question_rules WHERE section_id = $1 ORDER BY order_index ASC`,
                    [sec.id]
                )
                for (const r of srcRules) {
                    await query(
                        `INSERT INTO public.section_question_rules (
                            section_id, question_type, num_questions, marks_per_question, negative_marks,
                            difficulty_easy_pct, difficulty_medium_pct, difficulty_hard_pct, internal_choice, order_index
                         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [
                            newSecId, r.question_type, r.num_questions, r.marks_per_question, r.negative_marks,
                            r.difficulty_easy_pct, r.difficulty_medium_pct, r.difficulty_hard_pct, r.internal_choice, r.order_index
                        ]
                    )
                }
            }

            return NextResponse.json({
                success: true,
                message: `Pattern customized as "${cloneName}".`,
                clonedId: cloneId
            })
        }

        // ── 6. DELETE PAPER PATTERN (TENANT CUSTOM) ──────────────────────
        if (action === 'DELETE_PAPER_PATTERN') {
            const { id } = payload || {}
            if (!id) return NextResponse.json({ error: 'Pattern ID is required' }, { status: 400 })

            await query(
                `UPDATE public.paper_templates
                 SET is_active = false, updated_at = NOW()
                 WHERE id = $1 AND (created_by = $2 OR is_global = false)`,
                [id, tenantId]
            )

            return NextResponse.json({
                success: true,
                message: 'Paper pattern deleted successfully.'
            })
        }

        return NextResponse.json({ error: 'Unsupported Action' }, { status: 400 })
    } catch (e: any) {
        console.error('[blueprint-context POST Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
