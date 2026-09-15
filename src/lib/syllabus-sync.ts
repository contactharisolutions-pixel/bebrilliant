import { query } from '@/lib/db'

/**
 * Resolves or auto-creates the active academic year for a tenant.
 */
export async function getOrCreateActiveAcademicYear(tenantId: string): Promise<string> {
    const existingActive = await query(
        `SELECT id FROM public.academic_years 
         WHERE tenant_id = $1 AND is_active = true 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId]
    )
    if (existingActive.rows?.length > 0) {
        return existingActive.rows[0].id
    }

    const anyYear = await query(
        `SELECT id FROM public.academic_years 
         WHERE tenant_id = $1 
         ORDER BY created_at DESC LIMIT 1`,
        [tenantId]
    )
    if (anyYear.rows?.length > 0) {
        return anyYear.rows[0].id
    }

    // Auto-create standard current academic session
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1
    const createdYear = await query(
        `INSERT INTO public.academic_years (tenant_id, name, start_date, end_date, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [
            tenantId,
            `Academic Session ${currentYear}-${nextYear.toString().slice(-2)}`,
            `${currentYear}-04-01`,
            `${nextYear}-03-31`
        ]
    )
    return createdYear.rows[0].id
}

/**
 * Automatically synchronizes classes and subjects from active or specified syllabus boards
 * into public.classes, public.divisions (default section 'A'), public.subjects, and public.class_subjects.
 */
export async function syncSyllabusToTenantAcademy(tenantId: string, specificBoardId?: string | null) {
    try {
        const academicYearId = await getOrCreateActiveAcademicYear(tenantId)

        // 1. Identify which syllabus boards to sync from
        let boardIds: string[] = []
        if (specificBoardId) {
            boardIds = [specificBoardId]
        } else {
            const activeBoardsRes = await query(
                `SELECT master_syllabus_id AS board_id 
                 FROM public.tenant_syllabus 
                 WHERE tenant_id = $1 AND is_active = true
                 UNION
                 SELECT id AS board_id 
                 FROM public.syllabus_nodes 
                 WHERE tenant_id = $1 AND parent_id IS NULL AND type = 'board' AND is_active = true`,
                [tenantId]
            )
            boardIds = (activeBoardsRes.rows || []).map((r: any) => r.board_id).filter(Boolean)
        }

        if (boardIds.length === 0) {
            return { success: true, syncedClasses: 0, syncedSubjects: 0, mappedPairs: 0 }
        }

        // 2. Fetch all 'class' nodes under these syllabus boards
        const classesRes = await query(
            `SELECT id, name, order_index 
             FROM public.syllabus_nodes 
             WHERE parent_id = ANY($1) AND type = 'class' AND is_active = true
             ORDER BY order_index ASC, name ASC`,
            [boardIds]
        )
        const classNodes = classesRes.rows || []
        if (classNodes.length === 0) {
            return { success: true, syncedClasses: 0, syncedSubjects: 0, mappedPairs: 0 }
        }

        // Map: syllabus_node_id -> real public.classes.id
        const nodeToClassIdMap = new Map<string, string>()
        let syncedClassesCount = 0

        for (const cNode of classNodes) {
            const cName = (cNode.name || '').trim()
            if (!cName) continue

            const cCode = ('CLS-' + cName.replace(/[^a-zA-Z0-9]/g, '').slice(-4)).toUpperCase()
            const sortOrder = Number(cNode.order_index) || 0

            // Upsert into public.classes
            const insClassRes = await query(
                `INSERT INTO public.classes (tenant_id, academic_year_id, name, code, sort_order, is_active)
                 VALUES ($1, $2, $3, $4, $5, true)
                 ON CONFLICT (tenant_id, academic_year_id, name)
                 DO UPDATE SET is_active = true, updated_at = NOW()
                 RETURNING id`,
                [tenantId, academicYearId, cName, cCode, sortOrder]
            )
            const classId = insClassRes.rows?.[0]?.id
            if (classId) {
                nodeToClassIdMap.set(cNode.id, classId)
                syncedClassesCount++

                // Ensure default division 'A' exists for this class
                await query(
                    `INSERT INTO public.divisions (tenant_id, class_id, name, capacity)
                     VALUES ($1, $2, 'A', 40)
                     ON CONFLICT (class_id, name) DO NOTHING`,
                    [tenantId, classId]
                )
            }
        }

        // 3. Fetch all 'subject' nodes under these class nodes
        const classNodeIds = Array.from(nodeToClassIdMap.keys())
        if (classNodeIds.length === 0) {
            return { success: true, syncedClasses: syncedClassesCount, syncedSubjects: 0, mappedPairs: 0 }
        }

        const subjectsRes = await query(
            `SELECT id, name, parent_id AS class_node_id 
             FROM public.syllabus_nodes 
             WHERE parent_id = ANY($1) AND type = 'subject' AND is_active = true
             ORDER BY name ASC`,
            [classNodeIds]
        )
        const subjectNodes = subjectsRes.rows || []

        let syncedSubjectsCount = 0
        let mappedPairsCount = 0
        const subjectNameToIdMap = new Map<string, string>()

        for (const sNode of subjectNodes) {
            const sName = (sNode.name || '').trim()
            if (!sName) continue

            const sCode = sName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
            const cacheKey = sName.toLowerCase()

            let subjectId = subjectNameToIdMap.get(cacheKey)
            if (!subjectId) {
                const insSubRes = await query(
                    `INSERT INTO public.subjects (tenant_id, name, code, is_optional)
                     VALUES ($1, $2, $3, false)
                     ON CONFLICT (tenant_id, name)
                     DO UPDATE SET updated_at = NOW()
                     RETURNING id`,
                    [tenantId, sName, sCode]
                )
                subjectId = insSubRes.rows?.[0]?.id
                if (subjectId) {
                    subjectNameToIdMap.set(cacheKey, subjectId)
                    syncedSubjectsCount++
                }
            }

            // Map class to subject in public.class_subjects
            const classId = nodeToClassIdMap.get(sNode.class_node_id)
            if (classId && subjectId) {
                await query(
                    `INSERT INTO public.class_subjects (tenant_id, class_id, subject_id, is_mandatory)
                     VALUES ($1, $2, $3, true)
                     ON CONFLICT (class_id, subject_id) DO NOTHING`,
                    [tenantId, classId, subjectId]
                )
                mappedPairsCount++
            }
        }

        return {
            success: true,
            syncedClasses: syncedClassesCount,
            syncedSubjects: syncedSubjectsCount,
            mappedPairs: mappedPairsCount
        }
    } catch (err: any) {
        console.error('[syncSyllabusToTenantAcademy Error]:', err)
        throw err
    }
}
