import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'
        const examId = request.nextUrl.searchParams.get('examId')

        // If specific exam details requested
        if (examId) {
            const { data: exam, error: examErr } = await supabaseAdmin
                .from('offline_exams')
                .select(`
                    *,
                    classes:class_id(id, name),
                    subjects:subject_id(id, name, code),
                    omr_templates:omr_template_id(id, name, total_questions, layout_config)
                `)
                .eq('id', examId)
                .single()

            if (examErr || !exam) {
                return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
            }

            const { data: sheets } = await supabaseAdmin
                .from('omr_sheets')
                .select(`
                    *,
                    student:student_id(id, first_name, last_name, email)
                `)
                .eq('exam_id', examId)
                .order('created_at', { ascending: false })

            const { data: responses } = await supabaseAdmin
                .from('omr_responses')
                .select('*')
                .eq('exam_id', examId)
                .order('question_no', { ascending: true })

            return NextResponse.json({ exam, sheets: sheets || [], responses: responses || [] })
        }

        // Default: Hub Overview & All Master Data
        const [examsRes, templatesRes, uploadsRes, classesRes, subjectsRes, sheetsRes, paperTemplatesRes] = await Promise.all([
            supabaseAdmin
                .from('offline_exams')
                .select(`
                    id,
                    tenant_id,
                    academic_year_id,
                    title,
                    class_id,
                    subject_id,
                    total_questions,
                    omr_template_id,
                    template_id,
                    duration,
                    created_by,
                    status,
                    created_at,
                    classes:class_id(id, name),
                    subjects:subject_id(id, name, code),
                    omr_templates:omr_template_id(id, name, total_questions, layout_config)
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false }),

            supabaseAdmin
                .from('omr_templates')
                .select('*')
                .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
                .eq('is_active', true)
                .order('created_at', { ascending: false }),

            supabaseAdmin
                .from('omr_uploads')
                .select(`
                    *,
                    offline_exams:exam_id(title)
                `)
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false }),

            supabaseAdmin
                .from('classes')
                .select('id, name')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true }),

            supabaseAdmin
                .from('subjects')
                .select('id, name, code')
                .eq('tenant_id', tenantId)
                .order('name', { ascending: true }),

            supabaseAdmin
                .from('omr_sheets')
                .select('id, exam_id')
                .eq('tenant_id', tenantId),

            supabaseAdmin
                .from('paper_templates')
                .select('id, name, category, exam_type, total_marks, duration_minutes, is_active')
                .eq('is_active', true)
                .order('name', { ascending: true })
        ])

        const classes = classesRes.data || []
        const subjects = subjectsRes.data || []
        const templates = templatesRes.data || []
        const exams = (examsRes.data || []).map((e: any) => ({
            ...e,
            classes: e.classes || classes.find((c: any) => c.id === e.class_id) || null,
            subjects: e.subjects || subjects.find((s: any) => s.id === e.subject_id) || null,
            omr_templates: e.omr_templates || templates.find((t: any) => t.id === e.omr_template_id) || null
        }))
        const recentUploads = uploadsRes.data || []
        const sheetsCount = sheetsRes.data?.length || 0
        const paperTemplates = paperTemplatesRes.data || []

        const totalScanned = recentUploads.reduce((sum: number, u: any) => sum + (u.processed_sheets || 0), 0) + sheetsCount
        const failedScanned = recentUploads.reduce((sum: number, u: any) => sum + (u.failed_sheets || 0), 0)
        const totalSheetsAttempted = totalScanned + failedScanned
        const successRate = totalSheetsAttempted > 0 
            ? ((totalScanned / totalSheetsAttempted) * 100).toFixed(1)
            : '100.0'

        const metrics = {
            totalTemplates: templates.length,
            totalExams: exams.length,
            totalScanned: totalScanned,
            successRate: `${successRate}%`,
            totalEvaluated: totalScanned
        }

        return NextResponse.json({
            metrics,
            exams,
            templates,
            paperTemplates,
            recentUploads,
            classes,
            subjects
        })
    } catch (error: any) {
        console.error('[OMR API GET Error]:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const tenantId = session.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'
        const userId = session.user?.id || 'f848f0e5-45f2-43a9-a90e-5f2ef4a4e33e'
        const body = await request.json()
        const { action, payload } = body

        if (action === 'CREATE_EXAM') {
            const { title, class_id, subject_id, total_questions, omr_template_id, template_id, duration } = payload
            if (!title || !class_id || !subject_id) {
                return NextResponse.json({ error: 'Title, Class, and Subject are required' }, { status: 400 })
            }

            const { data, error } = await supabaseAdmin
                .from('offline_exams')
                .insert([{
                    tenant_id: tenantId,
                    title,
                    class_id,
                    subject_id,
                    total_questions: Number(total_questions) || 50,
                    omr_template_id: omr_template_id || null,
                    template_id: template_id || null,
                    duration: Number(duration) || 60,
                    created_by: userId,
                    status: 'published'
                }])
                .select()
                .single()

            if (error) {
                console.error('[Create Exam Error]:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            return NextResponse.json({ success: true, exam: data })
        }

        if (action === 'CREATE_TEMPLATE') {
            const { name, total_questions, options_per_question, layout_config } = payload
            if (!name) {
                return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
            }

            const { data, error } = await supabaseAdmin
                .from('omr_templates')
                .insert([{
                    tenant_id: tenantId,
                    name,
                    total_questions: Number(total_questions) || 50,
                    options_per_question: Number(options_per_question) || 4,
                    layout_config: layout_config || { columns: 2, roll_digits: 8, barcode_enabled: true },
                    is_active: true
                }])
                .select()
                .single()

            if (error) {
                console.error('[Create Template Error]:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            return NextResponse.json({ success: true, template: data })
        }

        if (action === 'PROCESS_BATCH') {
            const { exam_id, template_id, sheet_count, source } = payload
            if (!exam_id) {
                return NextResponse.json({ error: 'Exam ID is required for batch scan' }, { status: 400 })
            }

            const processed = Number(sheet_count) || 25
            const { data, error } = await supabaseAdmin
                .from('omr_uploads')
                .insert([{
                    tenant_id: tenantId,
                    exam_id,
                    uploaded_by: userId,
                    file_url: `https://bebrilliant.in/storage/omr_batches/batch_${Date.now()}.pdf`,
                    status: 'completed',
                    processed_sheets: processed,
                    failed_sheets: 0,
                    error_log: [],
                    source: source === 'mobile' ? 'mobile' : 'bulk',
                    template_id: template_id || null
                }])
                .select()
                .single()

            if (error) {
                console.error('[Process Batch Error]:', error)
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            return NextResponse.json({ success: true, upload: data })
        }

        if (action === 'DELETE_EXAM') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })

            const { error } = await supabaseAdmin
                .from('offline_exams')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenantId)

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 })
            }
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })
    } catch (error: any) {
        console.error('[OMR API POST Error]:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
