import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        const tenantId = session?.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        const url = new URL(request.url)
        const type = url.searchParams.get('type') || 'all'
        const classNameFilter = url.searchParams.get('class_name') || 'all'
        const subjectFilter = url.searchParams.get('subject') || 'all'
        const search = url.searchParams.get('search')?.trim() || ''

        // 1. Build dynamic where clauses
        const whereClauses: string[] = ['sm.tenant_id = $1']
        const queryParams: any[] = [tenantId]

        if (type !== 'all') {
            queryParams.push(type)
            whereClauses.push(`sm.type = $${queryParams.length}`)
        }

        if (classNameFilter !== 'all') {
            queryParams.push(classNameFilter)
            whereClauses.push(`sm.class_name = $${queryParams.length}`)
        }

        if (subjectFilter !== 'all') {
            queryParams.push(subjectFilter)
            whereClauses.push(`sm.subject = $${queryParams.length}`)
        }

        if (search) {
            queryParams.push(`%${search}%`)
            whereClauses.push(`(
                sm.title ILIKE $${queryParams.length} OR 
                sm.topic ILIKE $${queryParams.length} OR 
                sm.subject ILIKE $${queryParams.length} OR 
                sm.description ILIKE $${queryParams.length}
            )`)
        }

        const materialsQuery = `
            SELECT 
                sm.id,
                sm.tenant_id,
                sm.title,
                sm.type,
                sm.subject,
                sm.class_name,
                sm.topic,
                sm.description,
                sm.due_date,
                sm.external_url,
                sm.file_url,
                sm.file_size,
                COALESCE(sm.download_count, 0) AS download_count,
                sm.created_at,
                up.first_name || ' ' || up.last_name AS author_name
            FROM public.study_materials sm
            LEFT JOIN public.user_profiles up ON sm.created_by = up.id
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY sm.created_at DESC;
        `
        const materialsRes = await query(materialsQuery, queryParams)
        const materials = materialsRes.rows || []

        // 2. Fetch Aggregated Statistics for KPIs
        const statsQuery = `
            SELECT 
                COUNT(*) AS total_materials,
                COUNT(*) FILTER (WHERE type = 'assignment') AS active_homework,
                COUNT(*) FILTER (WHERE type = 'video') AS video_lessons,
                COUNT(*) FILTER (WHERE type IN ('notes', 'pdf')) AS notes_and_guides,
                COUNT(DISTINCT class_name) AS classes_covered
            FROM public.study_materials
            WHERE tenant_id = $1;
        `
        const statsRes = await query(statsQuery, [tenantId])
        const stats = statsRes.rows[0] || {
            total_materials: 0,
            active_homework: 0,
            video_lessons: 0,
            notes_and_guides: 0,
            classes_covered: 0
        }

        // 3. Fetch Classes & Subjects for Dynamic Dropdowns
        const classesRes = await query('SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC;', [tenantId])
        const subjectsRes = await query('SELECT id, name FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC;', [tenantId])

        return NextResponse.json({
            success: true,
            data: {
                materials,
                stats,
                classes: classesRes.rows || [],
                subjects: subjectsRes.rows || []
            }
        })
    } catch (error: any) {
        console.error('Error in /api/dashboard/material GET:', error)
        return NextResponse.json({ success: false, error: error.message || 'Failed to fetch study materials' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        const tenantId = session?.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'
        const userId = session?.user?.id || null

        const body = await request.json()
        const { action, payload } = body

        // 1. CREATE MATERIAL OR HOMEWORK
        if (action === 'CREATE_ASSET' || action === 'CREATE_MATERIAL') {
            const {
                title,
                type,
                subject,
                class_name,
                topic,
                description,
                due_date,
                external_url,
                file_url,
                file_size
            } = payload

            if (!title || !type) {
                return NextResponse.json({ success: false, error: 'Title and type are required' }, { status: 400 })
            }

            const insertQuery = `
                INSERT INTO public.study_materials (
                    tenant_id, title, type, subject, class_name, 
                    topic, description, due_date, external_url, 
                    file_url, file_size, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *;
            `
            const insertRes = await query(insertQuery, [
                tenantId,
                title.trim(),
                type,
                subject || 'General',
                class_name || 'All Classes',
                topic ? topic.trim() : null,
                description ? description.trim() : null,
                due_date || null,
                external_url || null,
                file_url || 'curriculum_document.pdf',
                file_size || '1.5 MB',
                userId
            ])

            return NextResponse.json({
                success: true,
                message: `${type === 'assignment' ? 'Homework assignment' : 'Study material'} published successfully.`,
                material: insertRes.rows[0]
            })
        }

        // 2. DELETE MATERIAL
        if (action === 'DELETE_ASSET' || action === 'DELETE_MATERIAL') {
            const { id } = payload
            if (!id) {
                return NextResponse.json({ success: false, error: 'Material ID is required' }, { status: 400 })
            }

            await query('DELETE FROM public.study_materials WHERE id = $1 AND tenant_id = $2;', [id, tenantId])
            return NextResponse.json({ success: true, message: 'Resource removed successfully.' })
        }

        // 3. INCREMENT DOWNLOAD COUNT
        if (action === 'INCREMENT_DOWNLOAD') {
            const { id } = payload
            if (id) {
                await query('UPDATE public.study_materials SET download_count = COALESCE(download_count, 0) + 1 WHERE id = $1 AND tenant_id = $2;', [id, tenantId])
            }
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 })
    } catch (error: any) {
        console.error('Error in /api/dashboard/material POST:', error)
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
