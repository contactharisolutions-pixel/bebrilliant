import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const tenantId = session.tenant_id
        if (!tenantId) return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })

        const action = request.nextUrl.searchParams.get('action')

        if (action === 'GET_TEMPLATES') {
            const templatesQuery = `
                SELECT 
                    pt.*,
                    COALESCE(
                        (
                            SELECT json_agg(
                                json_build_object(
                                    'id', ts.id,
                                    'section_name', ts.section_name,
                                    'section_type', ts.section_type,
                                    'instructions', ts.instructions,
                                    'rules', COALESCE(
                                        (
                                            SELECT json_agg(sqr.*)
                                            FROM public.section_question_rules sqr
                                            WHERE sqr.section_id = ts.id
                                        ), '[]'::json
                                    )
                                )
                            )
                            FROM public.template_sections ts
                            WHERE ts.template_id = pt.id
                        ), '[]'::json
                    ) AS sections
                FROM public.paper_templates pt
                WHERE pt.is_active = true AND (pt.is_global = true OR pt.created_by = $1 OR pt.id IN (
                    SELECT template_id FROM public.offline_exams WHERE tenant_id = $1 AND template_id IS NOT NULL
                ))
                ORDER BY pt.created_at DESC;
            `
            const { rows: templates } = await query(templatesQuery, [tenantId])
            return NextResponse.json(templates || [])
        }

        // Default: Fetch all exams, templates, questions count, classes, and subjects
        const examsQuery = `
            SELECT 
                oe.id,
                oe.tenant_id,
                oe.academic_year_id,
                oe.title,
                oe.class_id,
                oe.subject_id,
                oe.total_questions,
                oe.omr_template_id,
                oe.template_id,
                oe.duration,
                oe.created_by,
                oe.status,
                oe.created_at,
                json_build_object('id', c.id, 'name', c.name) AS classes,
                json_build_object('id', s.id, 'name', s.name, 'code', s.code) AS subjects,
                json_build_object('id', pt.id, 'name', pt.name, 'category', pt.category, 'exam_type', pt.exam_type, 'total_marks', pt.total_marks) AS paper_templates
            FROM public.offline_exams oe
            LEFT JOIN public.classes c ON oe.class_id = c.id
            LEFT JOIN public.subjects s ON oe.subject_id = s.id
            LEFT JOIN public.paper_templates pt ON oe.template_id = pt.id
            WHERE oe.tenant_id = $1 AND oe.omr_template_id IS NULL AND (oe.title NOT ILIKE '%omr%' OR oe.title IS NULL)
            ORDER BY oe.created_at DESC;
        `

        const templatesQuery = `
            SELECT 
                pt.*,
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', ts.id,
                                'section_name', ts.section_name,
                                'section_type', ts.section_type,
                                'instructions', ts.instructions,
                                'rules', COALESCE(
                                    (
                                        SELECT json_agg(sqr.*)
                                        FROM public.section_question_rules sqr
                                        WHERE sqr.section_id = ts.id
                                    ), '[]'::json
                                )
                            )
                        )
                        FROM public.template_sections ts
                        WHERE ts.template_id = pt.id
                    ), '[]'::json
                ) AS sections
            FROM public.paper_templates pt
            WHERE pt.is_active = true AND (pt.is_global = true OR pt.created_by = $1 OR pt.id IN (
                SELECT template_id FROM public.offline_exams WHERE tenant_id = $1 AND template_id IS NOT NULL AND omr_template_id IS NULL
            ))
            ORDER BY pt.name ASC;
        `

        const [examsRes, templatesRes, questionsRes, classesRes, subjectsRes, statsRes] = await Promise.all([
            query(examsQuery, [tenantId]),
            query(templatesQuery, [tenantId]),
            query(`SELECT id, type, sub_type, difficulty, question_text, marks, source FROM public.questions WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 50`, [tenantId]),
            query(`SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]),
            query(`SELECT id, name, code FROM public.subjects WHERE tenant_id = $1 ORDER BY name ASC`, [tenantId]),
            query(`
                SELECT 
                    (SELECT COUNT(*) FROM public.offline_exams WHERE tenant_id = $1 AND omr_template_id IS NULL AND (title NOT ILIKE '%omr%' OR title IS NULL)) AS total_exams,
                    (SELECT COUNT(*) FROM public.offline_exams WHERE tenant_id = $1 AND status = 'archived' AND omr_template_id IS NULL AND (title NOT ILIKE '%omr%' OR title IS NULL)) AS archived_exams,
                    (SELECT COUNT(*) FROM public.questions WHERE tenant_id = $1) AS total_questions,
                    (SELECT COALESCE(SUM(total_questions), 0) FROM public.offline_exams WHERE tenant_id = $1 AND omr_template_id IS NULL AND (title NOT ILIKE '%omr%' OR title IS NULL)) AS printed_assets
            `, [tenantId])
        ])

        const exams = examsRes.rows || []
        const templates = templatesRes.rows || []
        const questions = questionsRes.rows || []
        const classes = classesRes.rows || []
        const subjects = subjectsRes.rows || []
        const stats = statsRes.rows?.[0] || {}

        const metrics = {
            totalPapers: Number(stats.total_exams || exams.length || 0),
            printedAssets: Number(stats.printed_assets || 0),
            questionPool: `${Number(stats.total_questions || questions.length || 0)} Questions`,
            archivedCount: Number(stats.archived_exams || 0)
        }

        return NextResponse.json({
            metrics,
            exams,
            templates,
            questions,
            classes,
            subjects
        })
    } catch (e: any) {
        console.error('[Offline Exam API GET Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const tenantId = session.tenant_id
        if (!tenantId) return NextResponse.json({ error: 'Tenant context required' }, { status: 400 })

        const userId = session.user?.id || null
        const body = await request.json()
        const { action, payload } = body

        if (action === 'CREATE_EXAM') {
            const { title, class_id, subject_id, template_id, duration, total_questions, chapter_ids } = payload
            if (!title) {
                return NextResponse.json({ error: 'Paper title is required' }, { status: 400 })
            }

            // Dynamically resolve class and subject if not explicitly supplied
            let resolvedClassId = class_id
            let resolvedSubjectId = subject_id

            if (!resolvedClassId) {
                const { rows: firstClass } = await query(`SELECT id FROM public.classes WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1`, [tenantId])
                resolvedClassId = firstClass?.[0]?.id || null
            }

            if (!resolvedSubjectId) {
                const { rows: firstSubject } = await query(`SELECT id FROM public.subjects WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1`, [tenantId])
                resolvedSubjectId = firstSubject?.[0]?.id || null
            }

            const { rows: examRows } = await query(
                `INSERT INTO public.offline_exams 
                    (tenant_id, title, class_id, subject_id, template_id, total_questions, duration, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', $8)
                 RETURNING *`,
                [
                    tenantId,
                    title,
                    resolvedClassId,
                    resolvedSubjectId,
                    template_id || null,
                    Number(total_questions) || 25,
                    Number(duration) || 90,
                    userId
                ]
            )
            const exam = examRows[0]

            // If chapter_ids are specified, try to map real questions from those chapters or general subject questions
            let questionsQuery = `SELECT id FROM public.questions WHERE tenant_id = $1`
            const queryParams: any[] = [tenantId]

            if (chapter_ids && Array.isArray(chapter_ids) && chapter_ids.length > 0) {
                questionsQuery += ` AND chapter_id = ANY($2::uuid[])`
                queryParams.push(chapter_ids)
            }
            questionsQuery += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1}`
            queryParams.push(Number(total_questions) || 25)

            let { rows: existingQs } = await query(questionsQuery, queryParams)

            // Fallback to any questions in the tenant if chapter-specific ones aren't populated
            if (!existingQs || existingQs.length === 0) {
                const fallbackRes = await query(`SELECT id FROM public.questions WHERE tenant_id = $1 LIMIT 10`, [tenantId])
                existingQs = fallbackRes.rows || []
            }

            if (existingQs && existingQs.length > 0) {
                for (let idx = 0; idx < existingQs.length; idx++) {
                    const q = existingQs[idx]
                    await query(
                        `INSERT INTO public.offline_exam_questions 
                            (exam_id, question_id, question_order, section, is_optional)
                         VALUES ($1, $2, $3, $4, false)`,
                        [
                            exam.id,
                            q.id,
                            idx + 1,
                            idx < Math.ceil(existingQs.length * 0.4) ? 'Section A: Objective Concepts' : 'Section B: Descriptive Problems'
                        ]
                    )
                }
            }

            return NextResponse.json({ success: true, exam })
        }

        if (action === 'DELETE_EXAM') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })

            await query(`DELETE FROM public.offline_exam_questions WHERE exam_id = $1`, [id])
            await query(`DELETE FROM public.offline_exams WHERE id = $1 AND tenant_id = $2`, [id, tenantId])

            return NextResponse.json({ success: true })
        }

        if (action === 'DUPLICATE_EXAM') {
            const { id } = payload
            const { rows: origRows } = await query(
                `SELECT * FROM public.offline_exams WHERE id = $1 AND tenant_id = $2`,
                [id, tenantId]
            )
            const orig = origRows[0]
            if (!orig) return NextResponse.json({ error: 'Original exam not found' }, { status: 404 })

            const { rows: dupRows } = await query(
                `INSERT INTO public.offline_exams 
                    (tenant_id, title, class_id, subject_id, template_id, total_questions, duration, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', $8)
                 RETURNING *`,
                [
                    tenantId,
                    `${orig.title} (Copy Set B)`,
                    orig.class_id,
                    orig.subject_id,
                    orig.template_id,
                    orig.total_questions,
                    orig.duration,
                    userId
                ]
            )
            const dup = dupRows[0]

            // Copy mapped questions
            const { rows: qMappings } = await query(
                `SELECT * FROM public.offline_exam_questions WHERE exam_id = $1`,
                [id]
            )

            if (qMappings && qMappings.length > 0) {
                for (const m of qMappings) {
                    await query(
                        `INSERT INTO public.offline_exam_questions 
                            (exam_id, question_id, question_order, section, is_optional)
                         VALUES ($1, $2, $3, $4, $5)`,
                        [dup.id, m.question_id, m.question_order, m.section, m.is_optional]
                    )
                }
            }

            return NextResponse.json({ success: true, exam: dup })
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })
    } catch (e: any) {
        console.error('[Offline Exam API POST Error]:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}
