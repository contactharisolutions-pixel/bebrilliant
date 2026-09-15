import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

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

    // Check tenant type
    let tenant_type = 'school'
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
        if (tenants?.[0]) return { user, tenant_id: tenants[0].id, tenant_type: 'school' }
        return null
    }

    if (profile.tenant_id && ['tenant_admin', 'owner', 'admin', 'teacher'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, tenant_type }
    }

    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Administrator' }, { status: 403 })

    const { tenant_id, tenant_type } = session
    const isSolo = tenant_type === 'personal_teacher' || tenant_type === 'independent_teacher'

    try {
        // 1. Fetch Teachers
        const { data: teachers, error: teacherError } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, phone, is_active, created_at, metadata')
            .eq('tenant_id', tenant_id)
            .eq('role', 'teacher')
            .order('created_at', { ascending: false })

        if (teacherError) throw teacherError

        // 2. Fetch Tenant Classes
        const { data: rawClasses, error: classError } = await supabaseAdmin
            .from('classes')
            .select('id, name, code, sort_order, is_active')
            .eq('tenant_id', tenant_id)
            .order('sort_order', { ascending: true })

        // 3. Fetch Tenant Divisions
        const { data: rawDivisions } = await supabaseAdmin
            .from('divisions')
            .select('id, class_id, name, capacity')
            .eq('tenant_id', tenant_id)

        // Combine classes with their divisions
        const classesWithDivisions = (rawClasses || []).map(cls => ({
            ...cls,
            divisions: (rawDivisions || []).filter(d => d.class_id === cls.id)
        }))

        // 4. Fetch Tenant Subjects (from public.subjects)
        const { data: rawSubjects, error: subjectError } = await supabaseAdmin
            .from('subjects')
            .select('id, name, code, is_optional')
            .eq('tenant_id', tenant_id)
            .order('name', { ascending: true })

        if (subjectError) {
            console.error('[TEACHERS_SUBJECTS_ERROR]', subjectError)
        }
        const subjects = rawSubjects || []

        // 5. Fetch Relational Teacher Subjects
        const { data: rawTeacherSubjects } = await supabaseAdmin
            .from('teacher_subjects')
            .select('id, teacher_id, class_id, division_id, subject_id')
            .eq('tenant_id', tenant_id)

        // Enrich teacher subjects with names in memory
        const classMap = new Map((rawClasses || []).map(c => [c.id, c]))
        const divisionMap = new Map((rawDivisions || []).map(d => [d.id, d]))
        const subjectMap = new Map((subjects || []).map(s => [s.id, s]))

        const teacherSubjects = (rawTeacherSubjects || []).map(ts => ({
            ...ts,
            classes: classMap.has(ts.class_id) ? { name: classMap.get(ts.class_id)?.name, code: classMap.get(ts.class_id)?.code } : null,
            divisions: divisionMap.has(ts.division_id) ? { name: divisionMap.get(ts.division_id)?.name } : null,
            subjects: subjectMap.has(ts.subject_id) ? { name: subjectMap.get(ts.subject_id)?.name } : null
        }))

        // 6. Compute Executive Metrics
        const teacherList = teachers || []
        const total_teachers = teacherList.length
        const active_teachers = teacherList.filter(t => t.is_active).length
        const pending_teachers = total_teachers - active_teachers

        // Collect all distinct subject assignments
        const assignedSubjectSet = new Set<string>()
        const assignedClassSet = new Set<string>()

        teacherList.forEach(t => {
            const subs = t.metadata?.assigned_subjects || []
            subs.forEach((s: string) => assignedSubjectSet.add(s))
            const cls = t.metadata?.assigned_classes || []
            cls.forEach((c: string) => assignedClassSet.add(c))
        })

        if (teacherSubjects) {
            teacherSubjects.forEach(ts => {
                if (ts.subject_id) assignedSubjectSet.add(ts.subject_id)
                if (ts.class_id) assignedClassSet.add(ts.class_id)
            })
        }

        // Fetch max teachers allowed for this tenant
        let maxAllowedTeachers = 1
        if (!isSolo) {
            try {
                const [tenantDataRes, subDataRes] = await Promise.all([
                    supabaseAdmin.from('tenants').select('max_teachers, current_plan_id').eq('id', tenant_id).single(),
                    supabaseAdmin.from('tenant_subscriptions').select('limit_overrides, plan_id').eq('tenant_id', tenant_id).eq('status', 'active').maybeSingle()
                ])
                const overrides = subDataRes.data?.limit_overrides || {}
                if (overrides.max_teachers) {
                    maxAllowedTeachers = overrides.max_teachers
                } else if (tenantDataRes.data?.max_teachers) {
                    maxAllowedTeachers = tenantDataRes.data.max_teachers
                } else {
                    const planId = subDataRes.data?.plan_id || tenantDataRes.data?.current_plan_id
                    if (planId) {
                        const { data: pRec } = await supabaseAdmin.from('plans').select('max_teachers').eq('id', planId).single()
                        if (pRec?.max_teachers) maxAllowedTeachers = pRec.max_teachers
                    } else {
                        maxAllowedTeachers = 60
                    }
                }
            } catch {
                maxAllowedTeachers = 60
            }
        }

        const canAddMore = isSolo ? total_teachers < 1 : total_teachers < maxAllowedTeachers

        const stats = {
            total_teachers,
            active_teachers,
            pending_teachers,
            max_teachers: maxAllowedTeachers,
            allow_multiple_teachers: !isSolo,
            is_solo: isSolo,
            can_add_more: canAddMore,
            tenant_type: isSolo ? 'solo' : (tenant_type === 'institute' ? 'institute' : 'school'),
            tenant_type_display: isSolo ? 'Solo / Independent Teacher' : (tenant_type === 'institute' ? 'Institute Tenant' : 'School Tenant'),
            total_subjects_assigned: assignedSubjectSet.size,
            total_classes_covered: assignedClassSet.size,
            total_tenant_subjects: (subjects || []).length,
            total_tenant_classes: (rawClasses || []).length
        }

        return NextResponse.json({
            teachers: teacherList,
            classes: classesWithDivisions,
            subjects: subjects || [],
            teacher_subjects: teacherSubjects,
            tenant_type: isSolo ? 'solo' : (tenant_type === 'institute' ? 'institute' : 'school'),
            allow_multiple_teachers: !isSolo,
            max_teachers: maxAllowedTeachers,
            can_add_more: canAddMore,
            stats
        })
    } catch (error: any) {
        console.error('[TEACHERS_API_GET_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, tenant_type } = session
    const isSolo = tenant_type === 'personal_teacher' || tenant_type === 'independent_teacher'
    const body = await request.json()
    const { action, payload } = body

    try {
        // ── TOGGLE ACTIVE STATUS ────────────────────────────────────
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload
            const { data, error } = await supabaseAdmin
                .from('user_profiles')
                .update({ is_active })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, user: data })
        }

        // ── CREATE TEACHER ──────────────────────────────────────────
        if (action === 'CREATE_TEACHER') {
            const {
                first_name,
                last_name,
                email,
                phone,
                designation = 'Teacher',
                qualification = '',
                employee_id = '',
                is_active = true,
                subjects = [],
                classes = [],
                divisions = []
            } = payload

            if (!email || !first_name) {
                return NextResponse.json({ error: 'First name and email are required.' }, { status: 400 })
            }

            // ── QUOTA & TENANT TYPE RESTRICTIONS ─────────────────────
            const { count: teacherCount } = await supabaseAdmin
                .from('user_profiles')
                .select('id', { count: 'exact', head: true })
                .eq('tenant_id', tenant_id)
                .eq('role', 'teacher')

            const currentTeachers = teacherCount || 0

            if (isSolo) {
                if (currentTeachers >= 1) {
                    return NextResponse.json({
                        error: 'Solo / Independent Teacher accounts are limited to 1 teacher only. Multiple teachers are not allowed on this account type. Please upgrade to an Institute or School subscription plan to add additional faculty.'
                    }, { status: 400 })
                }
            } else {
                // School or Institute: check max_teachers from subscription or tenant settings
                let maxAllowed = 50
                try {
                    const [tenantDataRes, subDataRes] = await Promise.all([
                        supabaseAdmin.from('tenants').select('max_teachers, current_plan_id').eq('id', tenant_id).single(),
                        supabaseAdmin.from('tenant_subscriptions').select('limit_overrides, plan_id').eq('tenant_id', tenant_id).eq('status', 'active').maybeSingle()
                    ])
                    const overrides = subDataRes.data?.limit_overrides || {}
                    if (overrides.max_teachers) {
                        maxAllowed = overrides.max_teachers
                    } else if (tenantDataRes.data?.max_teachers) {
                        maxAllowed = tenantDataRes.data.max_teachers
                    } else {
                        const planId = subDataRes.data?.plan_id || tenantDataRes.data?.current_plan_id
                        if (planId) {
                            const { data: pRec } = await supabaseAdmin.from('plans').select('max_teachers').eq('id', planId).single()
                            if (pRec?.max_teachers) maxAllowed = pRec.max_teachers
                        }
                    }
                } catch {
                    maxAllowed = 50
                }

                if (currentTeachers >= maxAllowed) {
                    return NextResponse.json({
                        error: `Faculty limit reached (${currentTeachers}/${maxAllowed} teachers). Please upgrade your subscription plan to add more faculty members.`
                    }, { status: 400 })
                }
            }

            const cleanEmail = email.trim().toLowerCase()
            const rawPassword = payload.password || phone || 'Teacher@' + Math.floor(1000 + Math.random() * 9000)

            // 1. Create or get Auth User
            let authUserId: string
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password: rawPassword,
                email_confirm: true,
                user_metadata: { role: 'teacher', tenant_id, first_name, last_name }
            })

            if (authError) {
                // If user already exists in auth, check if already in user_profiles
                if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
                    const { data: existingUser } = await supabaseAdmin
                        .from('user_profiles')
                        .select('id, tenant_id')
                        .eq('email', cleanEmail)
                        .single()

                    if (existingUser && existingUser.tenant_id === tenant_id) {
                        return NextResponse.json({ error: 'A faculty member with this email address already exists in your institute.' }, { status: 409 })
                    } else if (existingUser) {
                        return NextResponse.json({ error: 'This email is already associated with another institute profile.' }, { status: 409 })
                    } else {
                        // User exists in auth but missing profile: fetch auth user
                        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers()
                        const matched = listUsers.users.find(u => u.email?.toLowerCase() === cleanEmail)
                        if (!matched) throw new Error('Email exists in authentication system.')
                        authUserId = matched.id
                    }
                } else {
                    return NextResponse.json({ error: 'Authentication setup failed: ' + authError.message }, { status: 500 })
                }
            } else {
                authUserId = authData.user.id
            }

            // 2. Upsert user_profiles
            const metadata = {
                designation,
                qualification,
                employee_id: employee_id || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
                assigned_subjects: subjects,
                assigned_classes: classes,
                assigned_divisions: divisions,
                joining_date: new Date().toISOString()
            }

            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .upsert({
                    id: authUserId,
                    email: cleanEmail,
                    role: 'teacher',
                    first_name: first_name.trim(),
                    last_name: (last_name || '').trim(),
                    phone: phone || '',
                    is_active: !!is_active,
                    tenant_id,
                    metadata
                })

            if (profileError) {
                return NextResponse.json({ error: 'Profile creation failed: ' + profileError.message }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                id: authUserId,
                temporary_password: rawPassword
            })
        }

        // ── UPDATE TEACHER PROFILE ──────────────────────────────────
        if (action === 'UPDATE_TEACHER') {
            const { id, first_name, last_name, phone, designation, qualification, employee_id } = payload

            if (!id || !first_name) {
                return NextResponse.json({ error: 'Teacher ID and first name are required.' }, { status: 400 })
            }

            // Fetch existing metadata to merge
            const { data: existingProfile } = await supabaseAdmin
                .from('user_profiles')
                .select('metadata')
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .single()

            const currentMeta = existingProfile?.metadata || {}
            const updatedMeta = {
                ...currentMeta,
                designation: designation !== undefined ? designation : currentMeta.designation,
                qualification: qualification !== undefined ? qualification : currentMeta.qualification,
                employee_id: employee_id !== undefined ? employee_id : currentMeta.employee_id
            }

            const { error: updateError } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    first_name: first_name.trim(),
                    last_name: (last_name || '').trim(),
                    phone: phone || '',
                    metadata: updatedMeta
                })
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (updateError) throw updateError
            return NextResponse.json({ success: true })
        }

        // ── ASSIGN SCOPE (CLASSES, DIVISIONS & SUBJECTS) ────────────
        if (action === 'ASSIGN_SCOPE') {
            const { id, subjects = [], classes = [], divisions = [], mappings = [] } = payload

            if (!id) return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })

            // 1. Update user_profiles.metadata
            const { data: profile } = await supabaseAdmin
                .from('user_profiles')
                .select('metadata')
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .single()

            const meta = profile?.metadata || {}
            const { error: metaError } = await supabaseAdmin
                .from('user_profiles')
                .update({
                    metadata: {
                        ...meta,
                        assigned_subjects: subjects,
                        assigned_classes: classes,
                        assigned_divisions: divisions
                    }
                })
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (metaError) throw metaError

            // 2. Synchronize teacher_subjects relational table if mappings provided
            if (Array.isArray(mappings) && mappings.length > 0) {
                // Remove old assignments for this teacher
                await supabaseAdmin
                    .from('teacher_subjects')
                    .delete()
                    .eq('teacher_id', id)
                    .eq('tenant_id', tenant_id)

                // Insert new assignments
                const rowsToInsert = mappings.map((m: any) => ({
                    tenant_id,
                    teacher_id: id,
                    class_id: m.class_id,
                    division_id: m.division_id,
                    subject_id: m.subject_id
                }))

                await supabaseAdmin
                    .from('teacher_subjects')
                    .insert(rowsToInsert)
            }

            return NextResponse.json({ success: true })
        }

        // ── RESET PASSWORD / CREDENTIALS ────────────────────────────
        if (action === 'RESET_PASSWORD') {
            const { id, new_password } = payload
            if (!id) return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })

            const generatedPassword = new_password || 'Faculty#' + Math.floor(100000 + Math.random() * 900000)

            const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(id, {
                password: generatedPassword
            })

            if (resetError) throw resetError
            return NextResponse.json({ success: true, temporary_password: generatedPassword })
        }

        // ── DELETE TEACHER ──────────────────────────────────────────
        if (action === 'DELETE_TEACHER') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Teacher ID required' }, { status: 400 })

            // Clean up teacher_subjects mappings
            await supabaseAdmin
                .from('teacher_subjects')
                .delete()
                .eq('teacher_id', id)
                .eq('tenant_id', tenant_id)

            // Delete user_profile
            const { error: delProfileError } = await supabaseAdmin
                .from('user_profiles')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (delProfileError) throw delProfileError

            // Delete Supabase Auth account
            await supabaseAdmin.auth.admin.deleteUser(id)

            return NextResponse.json({ success: true })
        }

        // ── BULK STATUS UPDATE ──────────────────────────────────────
        if (action === 'BULK_STATUS') {
            const { ids, is_active } = payload
            if (!Array.isArray(ids) || ids.length === 0) {
                return NextResponse.json({ error: 'No teachers selected' }, { status: 400 })
            }

            const { error: bulkError } = await supabaseAdmin
                .from('user_profiles')
                .update({ is_active })
                .in('id', ids)
                .eq('tenant_id', tenant_id)

            if (bulkError) throw bulkError
            return NextResponse.json({ success: true, updated_count: ids.length })
        }

        // ── CREATE NEW SUBJECT ──────────────────────────────────────
        if (action === 'CREATE_SUBJECT') {
            const { name, code } = payload
            if (!name || name.trim().length < 2) {
                return NextResponse.json({ error: 'Subject name must be at least 2 characters.' }, { status: 400 })
            }

            const cleanName = name.trim()
            const cleanCode = (code || cleanName.substring(0, 4)).toUpperCase()

            const { data: newSub, error: subError } = await supabaseAdmin
                .from('subjects')
                .insert([{
                    tenant_id,
                    name: cleanName,
                    code: cleanCode,
                    is_optional: false
                }])
                .select()
                .single()

            if (subError) throw subError
            return NextResponse.json({ success: true, subject: newSub })
        }

        return NextResponse.json({ error: 'Unrecognized action payload' }, { status: 400 })
    } catch (error: any) {
        console.error('[TEACHERS_API_POST_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
