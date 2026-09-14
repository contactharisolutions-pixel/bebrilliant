import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        // 1. Fetch Tenant Subscription & Multi-Board Licensing Details
        const tenantQuery = `
            SELECT 
                id, 
                name, 
                subscription_plan, 
                COALESCE((features->>'multi_board_enabled')::boolean, false) AS multi_board_enabled
            FROM public.tenants 
            WHERE id = $1;
        `
        const tenantRes = await query(tenantQuery, [tenantId])
        const tenantInfo = tenantRes.rows?.[0] || {
            id: tenantId,
            name: 'School Academy',
            subscription_plan: 'Standard Academic Plan',
            multi_board_enabled: false
        }

        // 2. Recursive query to fetch the entire active syllabus hierarchy for this tenant
        const treeQuery = `
            WITH RECURSIVE syllabus_tree AS (
                -- Roots: Master boards active for this tenant or tenant-owned root boards
                SELECT 
                    sn.id,
                    sn.name,
                    sn.type,
                    sn.parent_id,
                    sn.tenant_id,
                    sn.is_active,
                    sn.order_index,
                    sn.created_at,
                    0 AS depth
                FROM public.syllabus_nodes sn
                WHERE sn.id IN (
                    SELECT master_syllabus_id 
                    FROM public.tenant_syllabus 
                    WHERE tenant_id = $1 AND is_active = true
                ) OR (sn.tenant_id = $1 AND sn.parent_id IS NULL AND sn.type = 'board' AND sn.is_active = true)

                UNION ALL

                -- Children nodes (Classes, Subjects, Chapters, Topics)
                SELECT 
                    child.id,
                    child.name,
                    child.type,
                    child.parent_id,
                    child.tenant_id,
                    child.is_active,
                    child.order_index,
                    child.created_at,
                    st.depth + 1 AS depth
                FROM public.syllabus_nodes child
                JOIN syllabus_tree st ON child.parent_id = st.id
            )
            SELECT * FROM syllabus_tree 
            ORDER BY depth ASC, order_index ASC, name ASC;
        `

        // 3. Fetch Owner-Published Master Syllabuses with statistics (Classes, Subjects, Chapters)
        const ownerPublishedQuery = `
            SELECT 
                b.id,
                b.name,
                b.type,
                b.order_index,
                b.created_at,
                (SELECT COUNT(*) FROM public.syllabus_nodes c WHERE c.parent_id = b.id AND c.type = 'class') AS classes_count,
                (
                    SELECT COUNT(*) FROM public.syllabus_nodes s 
                    WHERE s.type = 'subject' AND s.parent_id IN (
                        SELECT c.id FROM public.syllabus_nodes c WHERE c.parent_id = b.id
                    )
                ) AS subjects_count,
                (
                    SELECT COUNT(*) FROM public.syllabus_nodes ch 
                    WHERE ch.type = 'chapter' AND ch.parent_id IN (
                        SELECT s.id FROM public.syllabus_nodes s WHERE s.parent_id IN (
                            SELECT c.id FROM public.syllabus_nodes c WHERE c.parent_id = b.id
                        )
                    )
                ) AS chapters_count,
                (
                    SELECT COUNT(*) FROM public.syllabus_nodes tp 
                    WHERE tp.type = 'topic' AND tp.parent_id IN (
                        SELECT ch.id FROM public.syllabus_nodes ch WHERE ch.parent_id IN (
                            SELECT s.id FROM public.syllabus_nodes s WHERE s.parent_id IN (
                                SELECT c.id FROM public.syllabus_nodes c WHERE c.parent_id = b.id
                            )
                        )
                    )
                ) AS topics_count,
                EXISTS (
                    SELECT 1 FROM public.tenant_syllabus ts 
                    WHERE ts.tenant_id = $1 AND ts.master_syllabus_id = b.id AND ts.is_active = true
                ) AS is_active_for_tenant
            FROM public.syllabus_nodes b
            WHERE b.type = 'board' AND b.tenant_id IS NULL
            ORDER BY b.order_index ASC, b.name ASC;
        `

        const [treeRes, ownerPublishedRes] = await Promise.all([
            query(treeQuery, [tenantId]),
            query(ownerPublishedQuery, [tenantId])
        ])

        const nodes = treeRes.rows || []
        const ownerPublishedSyllabuses = ownerPublishedRes.rows || []

        // Extract active board node
        const activeBoardNode = nodes.find((n: any) => n.depth === 0 || n.type === 'board')
        const activeBoardName = activeBoardNode ? activeBoardNode.name : 'Gujarat Board (English Medium)'
        const activeBoardId = activeBoardNode ? activeBoardNode.id : null

        // Compute live metrics for the active curriculum
        const totalClasses = nodes.filter((n: any) => n.type === 'class').length
        const totalSubjects = nodes.filter((n: any) => n.type === 'subject').length
        const totalChapters = nodes.filter((n: any) => n.type === 'chapter').length
        const totalTopics = nodes.filter((n: any) => n.type === 'topic').length

        const metrics = {
            activeBoard: activeBoardName,
            activeBoardId,
            totalClasses,
            totalSubjects,
            totalChapters,
            totalTopics,
            totalItems: nodes.length,
            multiBoardEnabled: Boolean(tenantInfo.multi_board_enabled),
            subscriptionPlan: tenantInfo.subscription_plan || 'Standard School License'
        }

        return NextResponse.json({
            nodes,
            ownerPublishedSyllabuses,
            metrics,
            tenant: {
                id: tenantId,
                name: tenantInfo.name,
                multiBoardEnabled: Boolean(tenantInfo.multi_board_enabled),
                subscriptionPlan: tenantInfo.subscription_plan
            }
        })
    } catch (e: any) {
        console.error('[Syllabus API GET Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'
        const body = await request.json()
        const { action, payload } = body

        // Check multi-board licensing status
        const { rows: tRows } = await query(
            `SELECT COALESCE((features->>'multi_board_enabled')::boolean, false) AS multi_board_enabled FROM public.tenants WHERE id = $1`,
            [tenantId]
        )
        const multiBoardEnabled = Boolean(tRows?.[0]?.multi_board_enabled)

        // ── 1. ONE-CLICK IMPORT OWNER PUBLISHED SYLLABUS ──────────────────
        if (action === 'IMPORT_OWNER_SYLLABUS') {
            const { board_id } = payload
            if (!board_id) return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })

            // Verify board exists and is an owner published board
            const { rows: bRows } = await query(
                `SELECT id, name FROM public.syllabus_nodes WHERE id = $1 AND type = 'board' AND tenant_id IS NULL`,
                [board_id]
            )
            if (bRows.length === 0) {
                return NextResponse.json({ error: 'Selected syllabus board was not found in owner catalog' }, { status: 404 })
            }
            const boardName = bRows[0].name

            // Single Board Architecture enforcement:
            // If tenant does NOT have multi-board add-on, deactivate all existing active boards
            if (!multiBoardEnabled) {
                await query(
                    `UPDATE public.tenant_syllabus SET is_active = false, updated_at = NOW() WHERE tenant_id = $1`,
                    [tenantId]
                )
                await query(
                    `UPDATE public.syllabus_nodes SET is_active = false, updated_at = NOW() WHERE tenant_id = $1 AND parent_id IS NULL AND type = 'board'`,
                    [tenantId]
                )
            }

            // Check if record already exists in tenant_syllabus
            const { rows: existingRows } = await query(
                `SELECT id FROM public.tenant_syllabus WHERE tenant_id = $1 AND master_syllabus_id = $2`,
                [tenantId, board_id]
            )

            if (existingRows.length > 0) {
                await query(
                    `UPDATE public.tenant_syllabus SET is_active = true, updated_at = NOW() WHERE id = $1`,
                    [existingRows[0].id]
                )
            } else {
                await query(
                    `INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level)
                     VALUES ($1, $2, true, 1, 'full')`,
                    [tenantId, board_id]
                )
            }

            const message = multiBoardEnabled
                ? `"${boardName}" imported into your active multi-board curriculum.`
                : `"${boardName}" successfully set as your active school curriculum.`

            return NextResponse.json({ success: true, message, boardName })
        }

        // ── 2. DOWNLOAD BOARD SYLLABUS AS DATA ROWS (FOR EXCEL/CSV) ───────
        if (action === 'DOWNLOAD_BOARD_SYLLABUS') {
            const { board_id } = payload
            if (!board_id) return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })

            // Query full recursive tree for this board
            const downloadQuery = `
                WITH RECURSIVE b_tree AS (
                    SELECT 
                        id, name, type, parent_id, order_index, 0 as depth,
                        name as board_name,
                        NULL::text as class_name,
                        NULL::text as subject_name,
                        NULL::text as chapter_name,
                        NULL::text as topic_name
                    FROM public.syllabus_nodes
                    WHERE id = $1
                    
                    UNION ALL
                    
                    SELECT 
                        c.id, c.name, c.type, c.parent_id, c.order_index, bt.depth + 1,
                        bt.board_name,
                        CASE WHEN c.type = 'class' THEN c.name ELSE bt.class_name END,
                        CASE WHEN c.type = 'subject' THEN c.name ELSE bt.subject_name END,
                        CASE WHEN c.type = 'chapter' THEN c.name ELSE bt.chapter_name END,
                        CASE WHEN c.type = 'topic' THEN c.name ELSE bt.topic_name END
                    FROM public.syllabus_nodes c
                    JOIN b_tree bt ON c.parent_id = bt.id
                )
                SELECT 
                    board_name AS "Board",
                    COALESCE(class_name, '') AS "Class",
                    COALESCE(subject_name, '') AS "Subject",
                    COALESCE(chapter_name, '') AS "Chapter",
                    COALESCE(topic_name, '') AS "Topic",
                    order_index AS "OrderIndex"
                FROM b_tree
                WHERE type = 'topic' OR (type = 'chapter' AND topic_name IS NULL)
                ORDER BY class_name ASC, subject_name ASC, order_index ASC;
            `
            const { rows: exportRows } = await query(downloadQuery, [board_id])

            // If board had no topics (only classes/subjects/chapters), fallback query
            if (exportRows.length === 0) {
                const fallbackQuery = `
                    WITH RECURSIVE b_tree AS (
                        SELECT id, name, type, parent_id, order_index, 0 as depth
                        FROM public.syllabus_nodes WHERE id = $1
                        UNION ALL
                        SELECT c.id, c.name, c.type, c.parent_id, c.order_index, bt.depth + 1
                        FROM public.syllabus_nodes c JOIN b_tree bt ON c.parent_id = bt.id
                    )
                    SELECT * FROM b_tree ORDER BY depth ASC, order_index ASC;
                `
                const { rows: rawTree } = await query(fallbackQuery, [board_id])
                return NextResponse.json({ success: true, rows: rawTree })
            }

            return NextResponse.json({ success: true, rows: exportRows })
        }

        // ── 3. MANUAL BULK UPLOAD EXCEL / CSV SYLLABUS ────────────────────
        if (action === 'BULK_UPLOAD_SYLLABUS') {
            const { rows, mode = 'APPEND', board_name = 'Custom School Board' } = payload
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                return NextResponse.json({ error: 'No valid rows found to import' }, { status: 400 })
            }

            let boardId: string | null = null

            if (mode === 'REPLACE') {
                // If Single-Board architecture, deactivate prior boards
                if (!multiBoardEnabled) {
                    await query(`UPDATE public.tenant_syllabus SET is_active = false WHERE tenant_id = $1`, [tenantId])
                    await query(`UPDATE public.syllabus_nodes SET is_active = false WHERE tenant_id = $1 AND parent_id IS NULL`, [tenantId])
                }

                // Create clean custom board for tenant
                const { rows: newB } = await query(
                    `INSERT INTO public.syllabus_nodes (name, type, tenant_id, is_active, order_index)
                     VALUES ($1, 'board', $2, true, 0)
                     RETURNING id`,
                    [board_name.trim() || 'Custom School Board', tenantId]
                )
                boardId = newB[0].id as string

                await query(
                    `INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level)
                     VALUES ($1, $2, true, 1, 'full')`,
                    [tenantId, boardId]
                )
            } else {
                // APPEND to active board
                const { rows: activeRoots } = await query(
                    `SELECT master_syllabus_id FROM public.tenant_syllabus WHERE tenant_id = $1 AND is_active = true LIMIT 1`,
                    [tenantId]
                )
                boardId = activeRoots?.[0]?.master_syllabus_id as string | undefined || null

                if (!boardId) {
                    const { rows: tenantRoots } = await query(
                        `SELECT id FROM public.syllabus_nodes WHERE tenant_id = $1 AND parent_id IS NULL AND is_active = true LIMIT 1`,
                        [tenantId]
                    )
                    boardId = tenantRoots?.[0]?.id as string | undefined || null
                }

                if (!boardId) {
                    const { rows: newB } = await query(
                        `INSERT INTO public.syllabus_nodes (name, type, tenant_id, is_active, order_index)
                         VALUES ($1, 'board', $2, true, 0)
                         RETURNING id`,
                        [board_name.trim() || 'Custom School Board', tenantId]
                    )
                    boardId = newB[0].id as string
                    await query(
                        `INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level)
                         VALUES ($1, $2, true, 1, 'full')`,
                        [tenantId, boardId]
                    )
                }
            }

            let insertedCount = 0
            const classCache = new Map<string, string>()
            const subjectCache = new Map<string, string>()
            const chapterCache = new Map<string, string>()

            for (const r of rows) {
                const className = (r.class_name || r.Class || r.Grade || r.grade || '').toString().trim()
                const subjectName = (r.subject_name || r.Subject || r.subject || '').toString().trim()
                const chapterName = (r.chapter_name || r.Chapter || r.Unit || r.chapter || '').toString().trim()
                const topicName = (r.topic_name || r.Topic || r.topic || '').toString().trim()

                if (!className || !subjectName) continue

                // 1. Resolve or Insert Class
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

                // 2. Resolve or Insert Subject
                const subjectKey = `${classId}_${subjectName}`
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

                // 3. Resolve or Insert Chapter
                if (chapterName) {
                    const chapterKey = `${subjectId}_${chapterName}`
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

                    // 4. Resolve or Insert Topic
                    if (topicName && chapterId) {
                        await query(
                            `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active)
                             VALUES ($1, $2, 'topic', $3, true)`,
                            [chapterId, topicName, tenantId]
                        )
                    }
                }

                insertedCount++
            }

            return NextResponse.json({
                success: true,
                count: insertedCount,
                message: `Successfully processed ${insertedCount} curriculum items.`
            })
        }

        // ── 4. CREATE NODE (CLASS, SUBJECT, CHAPTER, TOPIC) ──────────────
        if (action === 'CREATE_NODE') {
            const { parent_id, name, type, order_index = 0 } = payload
            if (!name || !name.trim()) return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
            if (!type) return NextResponse.json({ error: 'Item type is required' }, { status: 400 })

            const { rows: nodeRows } = await query(
                `INSERT INTO public.syllabus_nodes (parent_id, name, type, order_index, tenant_id, is_active)
                 VALUES ($1, $2, $3, $4, $5, true)
                 RETURNING *`,
                [parent_id || null, name.trim(), type, Number(order_index) || 0, tenantId]
            )

            return NextResponse.json({ success: true, node: nodeRows[0] })
        }

        // ── 5. UPDATE NODE ──────────────────────────────────────────────
        if (action === 'UPDATE_NODE') {
            const { id, name, order_index } = payload
            if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })

            const { rows: updatedRows } = await query(
                `UPDATE public.syllabus_nodes 
                 SET name = COALESCE($1, name),
                     order_index = COALESCE($2, order_index),
                     updated_at = NOW()
                 WHERE id = $3
                 RETURNING *`,
                [name ? name.trim() : null, order_index !== undefined ? Number(order_index) : null, id]
            )

            return NextResponse.json({ success: true, node: updatedRows[0] })
        }

        // ── 6. TOGGLE NODE VISIBILITY ────────────────────────────────────
        if (action === 'TOGGLE_NODE') {
            const { id, is_active } = payload
            if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })

            await query(
                `UPDATE public.syllabus_nodes SET is_active = $1, updated_at = NOW() WHERE id = $2`,
                [Boolean(is_active), id]
            )

            return NextResponse.json({ success: true })
        }

        // ── 7. DELETE NODE (CASCADE RECURSIVE) ──────────────────────────
        if (action === 'DELETE_NODE') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })

            // Recursive delete query to clean up node and all descendent children
            await query(`
                WITH RECURSIVE descendants AS (
                    SELECT id FROM public.syllabus_nodes WHERE id = $1
                    UNION ALL
                    SELECT child.id FROM public.syllabus_nodes child
                    JOIN descendants d ON child.parent_id = d.id
                )
                DELETE FROM public.syllabus_nodes WHERE id IN (SELECT id FROM descendants);
            `, [id])

            await query(`DELETE FROM public.tenant_syllabus WHERE master_syllabus_id = $1 AND tenant_id = $2`, [id, tenantId])

            return NextResponse.json({ success: true })
        }

        // ── 8. REQUEST MULTI-BOARD ARCHITECTURE UPGRADE ──────────────────
        if (action === 'REQUEST_MULTI_BOARD') {
            const { notes = '' } = payload
            // Record inquiry in tenant settings or metadata
            await query(
                `UPDATE public.tenants 
                 SET settings = jsonb_set(
                     COALESCE(settings, '{}'::jsonb), 
                     '{multi_board_upgrade_requested}', 
                     to_jsonb(NOW())
                 ),
                 updated_at = NOW()
                 WHERE id = $1`,
                [tenantId]
            )

            return NextResponse.json({
                success: true,
                message: 'Your multi-board architecture upgrade inquiry has been forwarded to the platform owner.'
            })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (e: any) {
        console.error('[Syllabus API POST Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
