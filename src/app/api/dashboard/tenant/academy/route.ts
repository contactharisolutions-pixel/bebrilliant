import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, role, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    // Check tenant type if tenant_id exists
    let tenant_type = 'institute'
    if (profile.tenant_id) {
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('tenant_type')
            .eq('id', profile.tenant_id)
            .single()
        if (tenant?.tenant_type) {
            tenant_type = tenant.tenant_type
        }
    }

    // Platform owner fallback
    if (profile.role === 'owner' && !profile.tenant_id) {
        const { data: tenants } = await supabaseAdmin.from('tenants').select('id').limit(1)
        if (tenants?.[0]) return { user, tenant_id: tenants[0].id, is_owner: true, tenant_type }
        return null
    }

    if (profile.tenant_id && ['tenant_admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: profile.role === 'owner', tenant_type }
    }

    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Administrator' }, { status: 403 })

    const { tenant_id } = session

    try {
        // 1. Fetch Classes
        const { data: rawClasses, error: classError } = await supabaseAdmin
            .from('classes')
            .select('id, name, code, sort_order, is_active, academic_year_id, created_at, updated_at')
            .eq('tenant_id', tenant_id)
            .order('sort_order', { ascending: true })

        if (classError) throw classError

        // 2. Fetch Divisions (Sections)
        const { data: rawDivisions, error: divError } = await supabaseAdmin
            .from('divisions')
            .select('id, class_id, name, capacity, created_at, updated_at')
            .eq('tenant_id', tenant_id)
            .order('name', { ascending: true })

        if (divError) throw divError

        // 3. Fetch Subjects
        let { data: subjects, error: subError } = await supabaseAdmin
            .from('subjects')
            .select('id, name, code, is_optional, created_at, updated_at')
            .eq('tenant_id', tenant_id)
            .order('name', { ascending: true })

        if (subError) throw subError

        // Fallback to syllabus_nodes if subjects empty
        if (!subjects || subjects.length === 0) {
            const { data: globalNodes } = await supabaseAdmin
                .from('syllabus_nodes')
                .select('id, name')
                .eq('type', 'subject')
                .or(`tenant_id.is.null,tenant_id.eq.${tenant_id}`)
                .order('name', { ascending: true })

            if (globalNodes && globalNodes.length > 0) {
                subjects = globalNodes.map(g => ({
                    id: g.id,
                    name: g.name,
                    code: g.name.substring(0, 4).toUpperCase(),
                    is_optional: false,
                    is_system_fallback: true
                }))
            }
        }

        // 4. Fetch Class-Subject Mappings
        const { data: classSubjects, error: csError } = await supabaseAdmin
            .from('class_subjects')
            .select('id, class_id, subject_id, is_mandatory, created_at')
            .eq('tenant_id', tenant_id)

        if (csError) throw csError

        // 5. Fetch Teachers
        const { data: teachers, error: teacherError } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, email, phone, role, is_active, metadata')
            .eq('tenant_id', tenant_id)
            .eq('role', 'teacher')
            .order('first_name', { ascending: true })

        if (teacherError) throw teacherError

        // 6. Fetch Teacher-Subject Mappings
        const { data: rawTeacherSubjects, error: tsError } = await supabaseAdmin
            .from('teacher_subjects')
            .select('id, teacher_id, class_id, division_id, subject_id, created_at')
            .eq('tenant_id', tenant_id)

        if (tsError) throw tsError

        // ── ENRICHMENT IN MEMORY ────────────────────────────────────
        const classMap = new Map((rawClasses || []).map(c => [c.id, c]))
        const divisionMap = new Map((rawDivisions || []).map(d => [d.id, d]))
        const subjectMap = new Map((subjects || []).map(s => [s.id, s]))
        const teacherMap = new Map((teachers || []).map(t => [t.id, t]))

        // Group divisions & mapped subjects by class
        const enrichedClasses = (rawClasses || []).map(cls => {
            const classDivs = (rawDivisions || []).filter(d => d.class_id === cls.id)
            const classSubIds = (classSubjects || []).filter(cs => cs.class_id === cls.id).map(cs => cs.subject_id)
            const mappedSubs = classSubIds.map(sid => subjectMap.get(sid)).filter(Boolean)
            const totalCapacity = classDivs.reduce((sum, d) => sum + (d.capacity || 0), 0)

            return {
                ...cls,
                divisions: classDivs,
                mapped_subjects: mappedSubs,
                total_capacity: totalCapacity
            }
        })

        // Enrich teacher assignments
        const enrichedMappings = (rawTeacherSubjects || []).map(ts => {
            const teacher = teacherMap.get(ts.teacher_id)
            const cls = classMap.get(ts.class_id)
            const div = divisionMap.get(ts.division_id)
            const sub = subjectMap.get(ts.subject_id)

            return {
                ...ts,
                teacher: teacher ? {
                    id: teacher.id,
                    first_name: teacher.first_name,
                    last_name: teacher.last_name,
                    email: teacher.email,
                    designation: teacher.metadata?.designation || 'Teacher'
                } : null,
                class: cls ? { id: cls.id, name: cls.name, code: cls.code } : null,
                division: div ? { id: div.id, name: div.name, capacity: div.capacity } : null,
                subject: sub ? { id: sub.id, name: sub.name, code: sub.code, is_optional: sub.is_optional } : null
            }
        })

        // Enrich subjects with classes count
        const subjectClassCount = new Map<string, number>()
        ;(classSubjects || []).forEach(cs => {
            subjectClassCount.set(cs.subject_id, (subjectClassCount.get(cs.subject_id) || 0) + 1)
        })

        const enrichedSubjects = (subjects || []).map(s => ({
            ...s,
            mapped_classes_count: subjectClassCount.get(s.id) || 0
        }))

        // Compute Executive Metrics
        const total_classes = enrichedClasses.length
        const total_sections = (rawDivisions || []).length
        const total_capacity = (rawDivisions || []).reduce((sum, d) => sum + (d.capacity || 0), 0)
        const total_subjects = enrichedSubjects.length
        const core_subjects = enrichedSubjects.filter(s => !s.is_optional).length
        const elective_subjects = enrichedSubjects.filter(s => s.is_optional).length
        const total_mappings = enrichedMappings.length
        const classesWithTeachers = new Set(enrichedMappings.map(m => m.class_id).filter(Boolean))
        const faculty_coverage_pct = total_classes > 0 ? Math.round((classesWithTeachers.size / total_classes) * 100) : 0

        const stats = {
            total_classes,
            total_sections,
            total_capacity,
            total_subjects,
            core_subjects,
            elective_subjects,
            total_mappings,
            faculty_coverage_pct
        }

        return NextResponse.json({
            classes: enrichedClasses,
            divisions: rawDivisions || [],
            subjects: enrichedSubjects,
            teachers: teachers || [],
            mappings: enrichedMappings,
            class_subjects: classSubjects || [],
            stats
        })
    } catch (error: any) {
        console.error('[ACADEMY_API_GET_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        // ── 1. CREATE CLASS ─────────────────────────────────────────
        if (action === 'CREATE_CLASS') {
            const { name, code, initial_sections = ['A'], default_capacity = 40 } = payload
            if (!name?.trim()) return NextResponse.json({ error: 'Class name is required' }, { status: 400 })

            const cleanName = name.trim()
            const cleanCode = (code || 'CLS-' + cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4)).toUpperCase()

            const { data: newClass, error: classError } = await supabaseAdmin
                .from('classes')
                .insert({
                    tenant_id,
                    name: cleanName,
                    code: cleanCode,
                    sort_order: 0,
                    is_active: true
                })
                .select()
                .single()

            if (classError) throw classError

            // Auto-create initial sections if requested
            if (Array.isArray(initial_sections) && initial_sections.length > 0) {
                const sectionInserts = initial_sections.map((secName: string) => ({
                    tenant_id,
                    class_id: newClass.id,
                    name: String(secName).trim(),
                    capacity: default_capacity || 40
                }))

                await supabaseAdmin.from('divisions').insert(sectionInserts)
            }

            return NextResponse.json({ success: true, class: newClass })
        }

        // ── 2. UPDATE CLASS ─────────────────────────────────────────
        if (action === 'UPDATE_CLASS') {
            const { id, name, code, is_active } = payload
            if (!id || !name?.trim()) return NextResponse.json({ error: 'Class ID and Name required' }, { status: 400 })

            const updateData: any = {
                name: name.trim(),
                updated_at: new Date().toISOString()
            }
            if (code) updateData.code = code.trim().toUpperCase()
            if (is_active !== undefined) updateData.is_active = !!is_active

            const { data: updatedClass, error: updateError } = await supabaseAdmin
                .from('classes')
                .update(updateData)
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (updateError) throw updateError
            return NextResponse.json({ success: true, class: updatedClass })
        }

        // ── 3. DELETE CLASS ─────────────────────────────────────────
        if (action === 'DELETE_CLASS') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Class ID required' }, { status: 400 })

            // Clean up related rows
            await supabaseAdmin.from('teacher_subjects').delete().eq('class_id', id).eq('tenant_id', tenant_id)
            await supabaseAdmin.from('class_subjects').delete().eq('class_id', id).eq('tenant_id', tenant_id)
            await supabaseAdmin.from('divisions').delete().eq('class_id', id).eq('tenant_id', tenant_id)

            const { error: delError } = await supabaseAdmin
                .from('classes')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (delError) throw delError
            return NextResponse.json({ success: true })
        }

        // ── 4. CREATE DIVISION (SECTION) ────────────────────────────
        if (action === 'CREATE_DIVISION') {
            const { class_id, name, capacity = 40 } = payload
            if (!class_id || !name?.trim()) return NextResponse.json({ error: 'Class ID and Section name required' }, { status: 400 })

            const { data: newDiv, error: divError } = await supabaseAdmin
                .from('divisions')
                .insert({
                    tenant_id,
                    class_id,
                    name: name.trim().toUpperCase(),
                    capacity: Number(capacity) || 40
                })
                .select()
                .single()

            if (divError) throw divError
            return NextResponse.json({ success: true, division: newDiv })
        }

        // ── 5. UPDATE DIVISION ──────────────────────────────────────
        if (action === 'UPDATE_DIVISION') {
            const { id, name, capacity } = payload
            if (!id || !name?.trim()) return NextResponse.json({ error: 'Section ID and name required' }, { status: 400 })

            const { data: updatedDiv, error: divError } = await supabaseAdmin
                .from('divisions')
                .update({
                    name: name.trim().toUpperCase(),
                    capacity: Number(capacity) || 40,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (divError) throw divError
            return NextResponse.json({ success: true, division: updatedDiv })
        }

        // ── 6. DELETE DIVISION ──────────────────────────────────────
        if (action === 'DELETE_DIVISION') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Section ID required' }, { status: 400 })

            await supabaseAdmin.from('teacher_subjects').delete().eq('division_id', id).eq('tenant_id', tenant_id)
            const { error: delError } = await supabaseAdmin
                .from('divisions')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (delError) throw delError
            return NextResponse.json({ success: true })
        }

        // ── 7. CREATE SUBJECT ───────────────────────────────────────
        if (action === 'CREATE_SUBJECT') {
            const { name, code, is_optional = false } = payload
            if (!name?.trim()) return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })

            const cleanName = name.trim()
            const cleanCode = (code || cleanName.substring(0, 4)).toUpperCase()

            const { data: newSub, error: subError } = await supabaseAdmin
                .from('subjects')
                .insert({
                    tenant_id,
                    name: cleanName,
                    code: cleanCode,
                    is_optional: !!is_optional
                })
                .select()
                .single()

            if (subError) throw subError
            return NextResponse.json({ success: true, subject: newSub })
        }

        // ── 8. UPDATE SUBJECT ───────────────────────────────────────
        if (action === 'UPDATE_SUBJECT') {
            const { id, name, code, is_optional } = payload
            if (!id || !name?.trim()) return NextResponse.json({ error: 'Subject ID and Name required' }, { status: 400 })

            const { data: updatedSub, error: updateError } = await supabaseAdmin
                .from('subjects')
                .update({
                    name: name.trim(),
                    code: (code || name.substring(0, 4)).toUpperCase(),
                    is_optional: is_optional !== undefined ? !!is_optional : false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (updateError) throw updateError
            return NextResponse.json({ success: true, subject: updatedSub })
        }

        // ── 9. DELETE SUBJECT ───────────────────────────────────────
        if (action === 'DELETE_SUBJECT') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })

            // Clean up related mappings
            await supabaseAdmin.from('teacher_subjects').delete().eq('subject_id', id).eq('tenant_id', tenant_id)
            await supabaseAdmin.from('class_subjects').delete().eq('subject_id', id).eq('tenant_id', tenant_id)

            const { error: delError } = await supabaseAdmin
                .from('subjects')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (delError) throw delError
            return NextResponse.json({ success: true })
        }

        // ── 10. SYNC CLASS SUBJECTS ─────────────────────────────────
        if (action === 'SYNC_CLASS_SUBJECTS') {
            const { class_id, subject_ids } = payload
            if (!class_id || !Array.isArray(subject_ids)) {
                return NextResponse.json({ error: 'Class ID and subject IDs array required' }, { status: 400 })
            }

            // Remove existing mappings for this class
            await supabaseAdmin
                .from('class_subjects')
                .delete()
                .eq('class_id', class_id)
                .eq('tenant_id', tenant_id)

            if (subject_ids.length > 0) {
                const inserts = subject_ids.map((sid: string) => ({
                    tenant_id,
                    class_id,
                    subject_id: sid,
                    is_mandatory: true
                }))

                const { error: insertError } = await supabaseAdmin
                    .from('class_subjects')
                    .insert(inserts)

                if (insertError) throw insertError
            }

            return NextResponse.json({ success: true })
        }

        // ── 11. ASSIGN TEACHER ──────────────────────────────────────
        if (action === 'ASSIGN_TEACHER') {
            const { teacher_id, class_id, division_id, subject_id } = payload
            if (!teacher_id || !class_id || !division_id || !subject_id) {
                return NextResponse.json({ error: 'Teacher, Class, Section, and Subject are all required' }, { status: 400 })
            }

            const { data: mapping, error: mapError } = await supabaseAdmin
                .from('teacher_subjects')
                .upsert({
                    tenant_id,
                    teacher_id,
                    class_id,
                    division_id,
                    subject_id
                }, { onConflict: 'teacher_id,class_id,division_id,subject_id' })
                .select()
                .single()

            if (mapError) throw mapError
            return NextResponse.json({ success: true, mapping })
        }

        // ── 12. REVOKE TEACHER ASSIGNMENT ───────────────────────────
        if (action === 'REVOKE_TEACHER_ASSIGNMENT') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })

            const { error: delError } = await supabaseAdmin
                .from('teacher_subjects')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (delError) throw delError
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Unrecognized action payload' }, { status: 400 })
    } catch (error: any) {
        console.error('[ACADEMY_API_POST_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
