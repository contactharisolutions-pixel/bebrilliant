import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized to access exams' }, { status: 403 })

    const { tenant_id, role, metadata } = session

    try {
        let studentClass = '';
        let studentDivision = '';
        if (role === 'student' && metadata) {
            studentClass = (metadata as any).school_class || (metadata as any).class || '';
            studentDivision = (metadata as any).division || (metadata as any).section || '';
        }

        let queryExams = supabaseAdmin
            .from('exams')
            .select('*, exam_config(total_questions, randomization_mode)')
            .order('created_at', { ascending: false })

        // If the identity has a tenant_id, always filter by it.
        // If an owner has NO tenant_id, show everything (global admin view)
        if (tenant_id) {
            queryExams = queryExams.eq('tenant_id', tenant_id)
        } else if (role !== 'owner' && role !== 'student') {
             // Non-owner with no TID. Block them.
             return NextResponse.json({ error: 'Tenant isolation violation. Node unassigned.' }, { status: 403 })
        }

        // Student Privacy: Only show active exams
        if (role === 'student') {
            queryExams = queryExams.eq('is_active', true)
        }

        const { data: rawExams, error } = await queryExams

        if (error) {
            console.log('Exam table warning:', error.message)
            return NextResponse.json({ exams: [], subjects: [] })
        }

        // Student-specific context: Enrollments & Cart
        let enrollments: any[] = []
        let cartItems: any[] = []
        if (role === 'student' && session.user?.id) {
            const [enrRes, cartRes] = await Promise.all([
                supabaseAdmin.from('exam_enrollments').select('*').eq('student_id', session.user.id),
                supabaseAdmin.from('cart_items').select('*').eq('student_id', session.user.id).eq('item_type', 'exam')
            ])
            enrollments = enrRes.data || []
            cartItems = cartRes.data || []
        }

        // Hydrate exams with metadata and dynamic state
        const exams = (rawExams || []).map(ex => {
            let meta: any = {}
            try { meta = JSON.parse(ex.description || '{}') } catch (e) {}
            
            const enrollment = enrollments.find(e => e.exam_id === ex.id)
            const isInCart = cartItems.some(c => c.item_id === ex.id)
            
            let combinedStartTime = ex.start_time || null;
            if (meta.liveDate && meta.liveTime) {
                 combinedStartTime = `${meta.liveDate}T${meta.liveTime}:00+05:30`;
            } else if (!combinedStartTime && meta.liveDate) {
                 combinedStartTime = `${meta.liveDate}T00:00:00+05:30`;
            }

            return {
                ...ex,
                // Fallback to meta if columns are missing
                start_time: combinedStartTime || (meta.schedule && meta.schedule !== 'anytime' ? meta.schedule : null),
                end_time: ex.end_time || meta.regEnd || null,
                reg_start: ex.reg_start || meta.regStart || null,
                reg_end: ex.reg_end || meta.regEnd || null,
                allow_anytime: ex.allow_anytime || (!ex.start_time && !ex.end_time && meta.schedule === 'anytime'),
                
                // State flags
                is_enrolled: !!enrollment,
                enrollment_status: enrollment?.status || null,
                is_in_cart: isInCart,
                
                // Advanced Meta
                syllabus_id: meta.syllabus_id,
                total_marks: meta.marks || 100,
                duration: meta.duration || 60,
                mode: meta.mode || 'online',
                targetClasses: meta.targetClasses || [],
                targetSections: meta.targetSections || meta.targetDivisions || []
            }
        }).filter(ex => {
            if (role === 'student') {
                if (ex.mode === 'offline') return false;
                
                // Cohort Enforcers
                if (ex.targetClasses?.length > 0 && !ex.targetClasses.includes(studentClass)) return false;
                if (ex.targetSections?.length > 0 && !ex.targetSections.includes(studentDivision)) return false;
            }
            return true;
        })

        // Fetch subjects
        let querySubjects = supabaseAdmin.from('syllabus_nodes').select('id, name').eq('type', 'subject')

        // If teacher, only return their assigned subjects
        if (role === 'teacher') {
            const assigned = (metadata as any)?.assigned_subjects || []
            if (assigned.length === 0) {
                // Return empty subjects early if they have none
                return NextResponse.json({ exams: exams || [], subjects: [] })
            }
            querySubjects = querySubjects.in('id', assigned)
        }

        const { data: subjects } = await querySubjects

        if (request.nextUrl.searchParams.get('action') === 'GET_TEMPLATES') {
            const { data: templates, error: tErr } = await supabaseAdmin
                .from('paper_templates')
                .select(`
                    *,
                    sections:template_sections(
                        *,
                        rules:section_question_rules(*)
                    )
                `)
                .eq('is_global', true)
            if (tErr) throw tErr
            return NextResponse.json(templates)
        }

        return NextResponse.json({ exams: exams || [], subjects: subjects || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, user, role } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload
            const { data, error } = await supabaseAdmin
                .from('exams')
                .update({ is_active })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, exam: data })
        }

        if (action === 'DELETE_EXAM') {
            const { id } = payload
            const { error } = await supabaseAdmin
                .from('exams')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'CREATE_EXAM' || action === 'UPDATE_EXAM') {
            const { id, title, subject, type, price, count, randomize, ai_rotation, status, marks, duration, schedule, liveDate, liveTime, regStart, regEnd, mode, questions, subjectsConfig, targetClasses, targetSections } = payload

            // 1. Validation for Teachers
            if (role === 'teacher') {
                const assigned = (session.metadata as any)?.assigned_subjects || []
                if (!assigned.includes(subject)) {
                    return NextResponse.json({ error: 'Subject not assigned to you.' }, { status: 403 })
                }
                if (type === 'paid') {
                    return NextResponse.json({ error: 'Teachers can only deploy Free exams.' }, { status: 403 })
                }
            }

            const descriptionMeta = JSON.stringify({ syllabus_id: subject, marks, duration, schedule, liveDate, liveTime, regStart, regEnd, mode, questions, subjectsConfig, targetClasses, targetSections })

            const dbStartTime = liveDate ? `${liveDate}T${liveTime || '00:00'}:00+05:30` : null;
            const dbRegStart = regStart ? `${regStart}T00:00:00+05:30` : null;
            const dbRegEnd = regEnd ? `${regEnd}T23:59:59+05:30` : null;

            if (action === 'UPDATE_EXAM' && id) {
                const { data: exam, error: eErr } = await supabaseAdmin
                    .from('exams')
                    .update({
                        name: title,
                        description: descriptionMeta,
                        is_paid: type === 'paid',
                        is_active: status === 'publish',
                        price: type === 'paid' ? Number(price) : 0,
                        reg_start: dbRegStart,
                        reg_end: dbRegEnd,
                        start_time: dbStartTime,
                        allow_anytime: schedule === 'anytime'
                    })
                    .eq('id', id)
                    .eq('tenant_id', tenant_id)
                    .select()
                    .single()

                if (eErr) throw eErr

                // Update configuration
                const { error: cErr } = await supabaseAdmin
                    .from('exam_config')
                    .update({
                        total_questions: Number(count),
                        randomization_mode: randomize ? 'shuffled' : 'none',
                    })
                    .eq('exam_id', exam.id)

                if (cErr && cErr.code !== 'PGRST116') {
                     // ignore if config row doesn't exist, though it should
                }

                return NextResponse.json({ success: true, exam })
            } else {
                // 2. Insert Base Exam
                const { data: exam, error: eErr } = await supabaseAdmin
                    .from('exams')
                    .insert([{
                        tenant_id,
                        name: title,
                        description: descriptionMeta,
                        is_paid: type === 'paid',
                        is_active: status === 'publish',
                        price: type === 'paid' ? Number(price) : 0,
                        created_by: user.id,
                        reg_start: dbRegStart,
                        reg_end: dbRegEnd,
                        start_time: dbStartTime,
                        allow_anytime: schedule === 'anytime'
                    }])
                    .select()
                    .single()

                if (eErr) throw eErr

                // 3. Insert Exam Configuration (AI Settings)
                const { error: cErr } = await supabaseAdmin
                    .from('exam_config')
                    .insert([{
                        exam_id: exam.id,
                        total_questions: Number(count),
                        randomization_mode: randomize ? 'shuffled' : 'none',
                    }])

                if (cErr) throw cErr

                return NextResponse.json({ success: true, exam })
            }
        }

        return NextResponse.json({ error: 'Invalid action payload logic' }, { status: 400 })
    } catch (error: any) {
        console.error('Exam API Error:', error)
        return NextResponse.json({ 
            error: error.message || 'Internal Server Error',
            code: error.code,
            hint: error.hint
        }, { status: 500 })
    }
}
