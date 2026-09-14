import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        // 1. Recursive query to fetch the entire active syllabus hierarchy for this tenant
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
                ) OR (sn.tenant_id = $1 AND sn.parent_id IS NULL)

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

        // 2. Fetch available standard boards for the curriculum selector
        const standardBoardsQuery = `
            SELECT id, name, type, is_active, created_at
            FROM public.syllabus_nodes
            WHERE type = 'board' AND (tenant_id IS NULL OR tenant_id = $1)
            ORDER BY name ASC;
        `

        // 3. Fetch school textbooks and bookstore materials
        const booksQuery = `
            SELECT * 
            FROM public.syllabus_books 
            WHERE tenant_id = $1 
            ORDER BY is_prescribed DESC, class_name ASC, subject_name ASC, created_at DESC;
        `

        const [treeRes, boardsRes, booksRes] = await Promise.all([
            query(treeQuery, [tenantId]),
            query(standardBoardsQuery, [tenantId]),
            query(booksQuery, [tenantId])
        ])

        const nodes = treeRes.rows || []
        const standardBoards = boardsRes.rows || []
        const textbooks = booksRes.rows || []

        // Extract active board
        const activeBoardNode = nodes.find((n: any) => n.depth === 0 || n.type === 'board')
        const activeBoardName = activeBoardNode ? activeBoardNode.name : 'Gujarat Board (English Medium)'

        // Compute live metrics
        const totalClasses = nodes.filter((n: any) => n.type === 'class').length
        const totalSubjects = nodes.filter((n: any) => n.type === 'subject').length
        const totalChapters = nodes.filter((n: any) => n.type === 'chapter').length
        const totalTopics = nodes.filter((n: any) => n.type === 'topic').length
        const prescribedBooksCount = textbooks.filter((b: any) => b.is_prescribed).length

        const metrics = {
            activeBoard: activeBoardName,
            totalClasses,
            totalSubjects,
            totalChapters,
            totalTopics,
            totalBooks: prescribedBooksCount,
            totalItems: nodes.length
        }

        return NextResponse.json({
            nodes,
            standardBoards,
            textbooks,
            metrics
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

        // ── 1. SELECT / SWITCH STANDARD BOARD ─────────────────────────────
        if (action === 'SELECT_BOARD') {
            const { board_id } = payload
            if (!board_id) return NextResponse.json({ error: 'Board ID is required' }, { status: 400 })

            // Deactivate existing active boards for this tenant
            await query(
                `UPDATE public.tenant_syllabus SET is_active = false, updated_at = NOW() WHERE tenant_id = $1`,
                [tenantId]
            )

            // Link / Activate selected board
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

            return NextResponse.json({ success: true, message: 'Active school board updated successfully' })
        }

        // ── 2. CREATE NEW CUSTOM BOARD ──────────────────────────────────
        if (action === 'CREATE_BOARD') {
            const { name } = payload
            if (!name || !name.trim()) return NextResponse.json({ error: 'Board name is required' }, { status: 400 })

            // Create root board node
            const { rows: boardRows } = await query(
                `INSERT INTO public.syllabus_nodes (name, type, tenant_id, is_active, order_index)
                 VALUES ($1, 'board', $2, true, 0)
                 RETURNING *`,
                [name.trim(), tenantId]
            )
            const newBoard = boardRows[0]

            // Deactivate previous active boards
            await query(`UPDATE public.tenant_syllabus SET is_active = false WHERE tenant_id = $1`, [tenantId])

            // Link in tenant_syllabus
            await query(
                `INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level)
                 VALUES ($1, $2, true, 1, 'full')`,
                [tenantId, newBoard.id]
            )

            return NextResponse.json({ success: true, board: newBoard })
        }

        // ── 3. CREATE NODE (CLASS, SUBJECT, CHAPTER, TOPIC) ──────────────
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

        // ── 4. UPDATE NODE ──────────────────────────────────────────────
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

        // ── 5. TOGGLE NODE VISIBILITY ────────────────────────────────────
        if (action === 'TOGGLE_NODE') {
            const { id, is_active } = payload
            if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })

            await query(
                `UPDATE public.syllabus_nodes SET is_active = $1, updated_at = NOW() WHERE id = $2`,
                [Boolean(is_active), id]
            )

            return NextResponse.json({ success: true })
        }

        // ── 6. DELETE NODE (CASCADE RECURSIVE) ──────────────────────────
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

            // Also remove from tenant_syllabus if it was a root
            await query(`DELETE FROM public.tenant_syllabus WHERE master_syllabus_id = $1 AND tenant_id = $2`, [id, tenantId])

            return NextResponse.json({ success: true })
        }

        // ── 7. ADD PRESCRIBED TEXTBOOK ──────────────────────────────────
        if (action === 'ADD_TEXTBOOK') {
            const {
                board_name = 'Gujarat Board',
                class_name,
                subject_name,
                title,
                author,
                publisher,
                edition = 'Latest Edition',
                isbn,
                chapters_count = 14,
                pdf_url,
                price = 0,
                buy_url,
                is_prescribed = true
            } = payload

            if (!title || !title.trim()) return NextResponse.json({ error: 'Book title is required' }, { status: 400 })
            if (!class_name) return NextResponse.json({ error: 'Class/Grade is required' }, { status: 400 })
            if (!subject_name) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })

            const { rows: bookRows } = await query(
                `INSERT INTO public.syllabus_books 
                    (tenant_id, board_name, class_name, subject_name, title, author, publisher, edition, isbn, chapters_count, pdf_url, price, buy_url, is_prescribed, is_active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
                 RETURNING *`,
                [
                    tenantId,
                    board_name,
                    class_name,
                    subject_name,
                    title.trim(),
                    author || '',
                    publisher || 'State Academic Board',
                    edition,
                    isbn || '',
                    Number(chapters_count) || 12,
                    pdf_url || '',
                    Number(price) || 0,
                    buy_url || '',
                    Boolean(is_prescribed)
                ]
            )

            return NextResponse.json({ success: true, textbook: bookRows[0] })
        }

        // ── 8. UPDATE TEXTBOOK ──────────────────────────────────────────
        if (action === 'UPDATE_TEXTBOOK') {
            const { id, title, author, publisher, edition, isbn, chapters_count, pdf_url, price, buy_url, is_prescribed } = payload
            if (!id) return NextResponse.json({ error: 'Textbook ID is required' }, { status: 400 })

            const { rows: updatedRows } = await query(
                `UPDATE public.syllabus_books
                 SET title = COALESCE($1, title),
                     author = COALESCE($2, author),
                     publisher = COALESCE($3, publisher),
                     edition = COALESCE($4, edition),
                     isbn = COALESCE($5, isbn),
                     chapters_count = COALESCE($6, chapters_count),
                     pdf_url = COALESCE($7, pdf_url),
                     price = COALESCE($8, price),
                     buy_url = COALESCE($9, buy_url),
                     is_prescribed = COALESCE($10, is_prescribed),
                     updated_at = NOW()
                 WHERE id = $11 AND tenant_id = $12
                 RETURNING *`,
                [
                    title ? title.trim() : null,
                    author,
                    publisher,
                    edition,
                    isbn,
                    chapters_count !== undefined ? Number(chapters_count) : null,
                    pdf_url,
                    price !== undefined ? Number(price) : null,
                    buy_url,
                    is_prescribed !== undefined ? Boolean(is_prescribed) : null,
                    id,
                    tenantId
                ]
            )

            return NextResponse.json({ success: true, textbook: updatedRows[0] })
        }

        // ── 9. DELETE TEXTBOOK ──────────────────────────────────────────
        if (action === 'DELETE_TEXTBOOK') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Textbook ID is required' }, { status: 400 })

            await query(`DELETE FROM public.syllabus_books WHERE id = $1 AND tenant_id = $2`, [id, tenantId])
            return NextResponse.json({ success: true })
        }

        // ── 10. BULK UPLOAD EXCEL / CSV SYLLABUS ────────────────────────
        if (action === 'BULK_UPLOAD_SYLLABUS') {
            const { rows } = payload
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                return NextResponse.json({ error: 'No valid rows found to import' }, { status: 400 })
            }

            // Find current active root board
            const { rows: activeRoots } = await query(
                `SELECT master_syllabus_id FROM public.tenant_syllabus WHERE tenant_id = $1 AND is_active = true LIMIT 1`,
                [tenantId]
            )

            let boardId = activeRoots?.[0]?.master_syllabus_id
            if (!boardId) {
                // Create a default board if none exists
                const { rows: newB } = await query(
                    `INSERT INTO public.syllabus_nodes (name, type, tenant_id, is_active) VALUES ('School Curriculum', 'board', $1, true) RETURNING id`,
                    [tenantId]
                )
                boardId = newB[0].id
                await query(
                    `INSERT INTO public.tenant_syllabus (tenant_id, master_syllabus_id, is_active, version, access_level) VALUES ($1, $2, true, 1, 'full')`,
                    [tenantId, boardId]
                )
            }

            let insertedCount = 0
            const classCache = new Map<string, string>()
            const subjectCache = new Map<string, string>()
            const chapterCache = new Map<string, string>()

            for (const r of rows) {
                const className = (r.class_name || r.Class || r.grade || '').trim()
                const subjectName = (r.subject_name || r.Subject || '').trim()
                const chapterName = (r.chapter_name || r.Chapter || r.Unit || '').trim()
                const topicName = (r.topic_name || r.Topic || '').trim()

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
                            `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active) VALUES ($1, $2, 'class', $3, true) RETURNING id`,
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
                            `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active) VALUES ($1, $2, 'subject', $3, true) RETURNING id`,
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
                                `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active) VALUES ($1, $2, 'chapter', $3, true) RETURNING id`,
                                [subjectId, chapterName, tenantId]
                            )
                            chapterId = newChap[0].id as string
                        }
                        if (chapterId) chapterCache.set(chapterKey, chapterId)
                    }

                    // 4. Resolve or Insert Topic
                    if (topicName && chapterId) {
                        await query(
                            `INSERT INTO public.syllabus_nodes (parent_id, name, type, tenant_id, is_active) VALUES ($1, $2, 'topic', $3, true)`,
                            [chapterId, topicName, tenantId]
                        )
                    }
                }

                insertedCount++
            }

            return NextResponse.json({ success: true, count: insertedCount, message: `Successfully processed ${insertedCount} curriculum items.` })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (e: any) {
        console.error('[Syllabus API POST Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
