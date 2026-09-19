import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        const tenantId = session?.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        // Retrieve fresh user profile & role to enforce exact teacher / admin boundaries
        let userRole = session?.role || 'admin'
        let userMetadata: any = session?.metadata || {}

        if (session?.user?.id) {
            const { rows: profileRows } = await query(
                `SELECT role, metadata FROM public.user_profiles WHERE id = $1`,
                [session.user.id]
            )
            if (profileRows[0]) {
                userRole = profileRows[0].role || userRole
                userMetadata = profileRows[0].metadata || userMetadata
            }
        }

        const isTeacher = userRole === 'teacher'
        let assignedClasses: string[] = Array.isArray(userMetadata?.assigned_classes) ? userMetadata.assigned_classes : []
        let assignedDivisions: string[] = Array.isArray(userMetadata?.assigned_divisions) ? userMetadata.assigned_divisions : []

        // Fallback: Check public.teacher_subjects if metadata array is empty
        if (isTeacher && assignedClasses.length === 0 && session?.user?.id) {
            const { rows: tsClasses } = await query(
                `SELECT DISTINCT c.name 
                 FROM public.teacher_subjects ts
                 JOIN public.classes c ON ts.class_id = c.id
                 WHERE ts.teacher_id = $1 AND ts.tenant_id = $2`,
                [session.user.id, tenantId]
            )
            if (tsClasses.length > 0) {
                assignedClasses = tsClasses.map((r: any) => r.name)
            }
        }

        // If teacher has no assigned classes at all, return empty isolated view
        if (isTeacher && assignedClasses.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    students: [],
                    stats: {
                        total_students: 0,
                        active_students: 0,
                        cohort_average_marks: 0,
                        top_class: 'None Assigned'
                    },
                    classes: [],
                    divisions: [],
                    teacherScope: {
                        is_scoped: true,
                        assigned_classes: [],
                        assigned_divisions: []
                    }
                }
            })
        }

        const url = new URL(request.url)
        const search = url.searchParams.get('search')?.trim() || ''
        const classNameFilter = url.searchParams.get('school_class') || 'all'
        const divisionFilter = url.searchParams.get('division') || 'all'
        const statusFilter = url.searchParams.get('status') || 'all'

        // 1. Base Where Clauses
        let whereClauses = ["up.tenant_id = $1", "up.role = 'student'"]
        const queryParams: any[] = [tenantId]

        // 2. Teacher Class & Division Isolation Filter
        if (isTeacher && assignedClasses.length > 0) {
            queryParams.push(assignedClasses)
            const classParamIdx = queryParams.length

            whereClauses.push(`(
                up.metadata->>'school_class' = ANY($${classParamIdx}::text[])
                OR up.metadata->>'class' = ANY($${classParamIdx}::text[])
                OR EXISTS (
                    SELECT 1 FROM unnest($${classParamIdx}::text[]) ac
                    WHERE 
                        up.metadata->>'school_class' ILIKE '%' || ac || '%'
                        OR ac ILIKE '%' || COALESCE(up.metadata->>'school_class', '') || '%'
                        OR (
                            regexp_replace(ac, '[^0-9]', '', 'g') != '' AND
                            regexp_replace(ac, '[^0-9]', '', 'g') = regexp_replace(COALESCE(up.metadata->>'school_class', up.metadata->>'class', ''), '[^0-9]', '', 'g')
                        )
                )
            )`)

            if (assignedDivisions.length > 0) {
                queryParams.push(assignedDivisions)
                const divParamIdx = queryParams.length
                whereClauses.push(`(
                    up.metadata->>'division' = ANY($${divParamIdx}::text[])
                    OR up.metadata->>'division' IS NULL
                    OR up.metadata->>'division' = ''
                )`)
            }
        }

        // Save base teacher/admin scoped conditions for stats calculation
        const baseScopeClauses = [...whereClauses]
        const baseScopeParams = [...queryParams]

        // 3. User Filter parameters
        if (statusFilter !== 'all') {
            queryParams.push(statusFilter === 'active')
            whereClauses.push(`up.is_active = $${queryParams.length}`)
        }

        if (classNameFilter !== 'all') {
            queryParams.push(classNameFilter)
            whereClauses.push(`(up.metadata->>'school_class' = $${queryParams.length} OR up.metadata->>'class' = $${queryParams.length})`)
        }

        if (divisionFilter !== 'all') {
            queryParams.push(divisionFilter)
            whereClauses.push(`up.metadata->>'division' = $${queryParams.length}`)
        }

        if (search) {
            queryParams.push(`%${search}%`)
            whereClauses.push(`(
                up.first_name ILIKE $${queryParams.length} OR 
                up.last_name ILIKE $${queryParams.length} OR 
                up.email ILIKE $${queryParams.length} OR 
                up.phone ILIKE $${queryParams.length} OR
                up.metadata->>'roll_no' ILIKE $${queryParams.length}
            )`)
        }

        const studentsQuery = `
            SELECT 
                up.id,
                up.first_name,
                up.last_name,
                up.email,
                up.phone,
                up.is_active,
                up.created_at,
                up.role,
                up.metadata,
                COALESCE(ROUND(AVG(asu.percentage) FILTER (WHERE asu.percentage > 0), 1), 0) AS avg_marks,
                COALESCE(MAX(asu.percentage), 0) AS top_score,
                COUNT(asu.id) AS total_exams,
                COALESCE(MAX(asu.grade_badge) FILTER (WHERE asu.grade_badge IS NOT NULL AND asu.grade_badge != 'Pending'), 'Good') AS standing_grade
            FROM public.user_profiles up
            LEFT JOIN public.answer_sheet_uploads asu ON up.id = asu.student_id
            WHERE ${whereClauses.join(' AND ')}
            GROUP BY up.id, up.first_name, up.last_name, up.email, up.phone, up.is_active, up.created_at, up.role, up.metadata
            ORDER BY up.created_at DESC;
        `
        const studentsRes = await query(studentsQuery, queryParams)
        const students = studentsRes.rows || []

        // 4. Fetch Aggregated Statistics for KPIs (Scoped to teacher if applicable)
        const statsQuery = `
            SELECT 
                COUNT(DISTINCT up.id) AS total_students,
                COUNT(DISTINCT up.id) FILTER (WHERE up.is_active = true) AS active_students,
                COALESCE(ROUND(AVG(asu.percentage) FILTER (WHERE asu.percentage > 0), 1), 0) AS cohort_average_marks,
                COALESCE(
                    (SELECT asu2.class_name 
                     FROM public.answer_sheet_uploads asu2 
                     WHERE asu2.tenant_id = $1 AND asu2.percentage > 0
                     GROUP BY asu2.class_name 
                     ORDER BY AVG(asu2.percentage) DESC 
                     LIMIT 1),
                    'Grade 10'
                ) AS top_class
            FROM public.user_profiles up
            LEFT JOIN public.answer_sheet_uploads asu ON up.id = asu.student_id
            WHERE ${baseScopeClauses.join(' AND ')};
        `
        const statsRes = await query(statsQuery, baseScopeParams)
        const stats = statsRes.rows[0] || {
            total_students: 0,
            active_students: 0,
            cohort_average_marks: 0,
            top_class: 'Grade 10'
        }

        // 5. Fetch Classes & Divisions for Dynamic Filter Dropdowns
        const classesRes = await query('SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC;', [tenantId])
        const divisionsRes = await query('SELECT id, name, class_id FROM public.divisions WHERE class_id IN (SELECT id FROM public.classes WHERE tenant_id = $1) ORDER BY name ASC;', [tenantId])

        let availableClasses = classesRes.rows || []
        let availableDivisions = divisionsRes.rows || []

        // Filter dropdowns for teachers to only include permitted classes and divisions
        if (isTeacher && assignedClasses.length > 0) {
            availableClasses = availableClasses.filter((c: any) => 
                assignedClasses.some(ac => 
                    c.name === ac || 
                    c.name.toLowerCase().includes(ac.toLowerCase()) || 
                    ac.toLowerCase().includes(c.name.toLowerCase()) ||
                    (
                        ac.replace(/[^0-9]/g, '') !== '' &&
                        ac.replace(/[^0-9]/g, '') === c.name.replace(/[^0-9]/g, '')
                    )
                )
            )
            const allowedClassIds = new Set(availableClasses.map((c: any) => c.id))
            availableDivisions = availableDivisions.filter((d: any) => allowedClassIds.has(d.class_id))
            if (assignedDivisions.length > 0) {
                availableDivisions = availableDivisions.filter((d: any) => 
                    assignedDivisions.some(ad => d.name === ad || d.name.toLowerCase().includes(ad.toLowerCase()))
                )
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                students,
                stats,
                classes: availableClasses,
                divisions: availableDivisions,
                teacherScope: isTeacher ? {
                    is_scoped: true,
                    assigned_classes: assignedClasses,
                    assigned_divisions: assignedDivisions
                } : null
            }
        })
    } catch (error: any) {
        console.error('Error fetching students directory:', error)
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        const tenantId = session?.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        // Check teacher status for write operations
        let userRole = session?.role || 'admin'
        let userMetadata: any = session?.metadata || {}
        if (session?.user?.id) {
            const { rows: profileRows } = await query(
                `SELECT role, metadata FROM public.user_profiles WHERE id = $1`,
                [session.user.id]
            )
            if (profileRows[0]) {
                userRole = profileRows[0].role || userRole
                userMetadata = profileRows[0].metadata || userMetadata
            }
        }

        const isTeacher = userRole === 'teacher'
        const assignedClasses: string[] = Array.isArray(userMetadata?.assigned_classes) ? userMetadata.assigned_classes : []

        const body = await request.json()
        const { action, payload } = body

        // 1. TOGGLE ACTIVE STATUS
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload

            if (isTeacher) {
                const { rows: targetStudent } = await query(
                    `SELECT metadata FROM public.user_profiles WHERE id = $1 AND tenant_id = $2 AND role = 'student'`,
                    [id, tenantId]
                )
                if (!targetStudent[0]) {
                    return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
                }
                const stClass = targetStudent[0].metadata?.school_class || targetStudent[0].metadata?.class || ''
                const hasAccess = assignedClasses.some(ac => 
                    stClass === ac || 
                    stClass.toLowerCase().includes(ac.toLowerCase()) || 
                    ac.toLowerCase().includes(stClass.toLowerCase()) ||
                    (
                        ac.replace(/[^0-9]/g, '') !== '' &&
                        ac.replace(/[^0-9]/g, '') === stClass.replace(/[^0-9]/g, '')
                    )
                )
                if (!hasAccess) {
                    return NextResponse.json({ error: 'Unauthorized: Student is not in your assigned classes.' }, { status: 403 })
                }
            }

            await query(
                'UPDATE public.user_profiles SET is_active = $1 WHERE id = $2 AND tenant_id = $3;',
                [is_active, id, tenantId]
            )
            return NextResponse.json({ success: true, message: `Student status updated to ${is_active ? 'Active' : 'Suspended'}.` })
        }

        // 2. ENROLL INDIVIDUAL STUDENT
        if (action === 'CREATE_STUDENT') {
            const {
                first_name,
                last_name,
                email,
                phone,
                roll_no,
                school_class,
                division,
                parent_name,
                parent_phone
            } = payload

            if (!email || !first_name) {
                return NextResponse.json({ error: 'First name and email are required.' }, { status: 400 })
            }

            if (isTeacher) {
                const chosenClass = school_class || ''
                const hasAccess = assignedClasses.some(ac => 
                    chosenClass === ac || 
                    chosenClass.toLowerCase().includes(ac.toLowerCase()) || 
                    ac.toLowerCase().includes(chosenClass.toLowerCase()) ||
                    (
                        ac.replace(/[^0-9]/g, '') !== '' &&
                        ac.replace(/[^0-9]/g, '') === chosenClass.replace(/[^0-9]/g, '')
                    )
                )
                if (!hasAccess) {
                    return NextResponse.json({ 
                        error: `Unauthorized: You can only enroll students into your assigned classes (${assignedClasses.join(', ')}).` 
                    }, { status: 403 })
                }
            }

            const rawPassword = phone ? phone.replace(/\D/g, '').slice(-8) || 'Student@123' : 'Student@123'

            // Create Auth User via Supabase Admin
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: rawPassword,
                email_confirm: true,
                user_metadata: {
                    role: 'student',
                    tenant_id: tenantId,
                    first_name,
                    last_name
                }
            })

            const studentUserId = authData?.user?.id || crypto.randomUUID()

            const metadataObj = {
                roll_no: roll_no || '',
                school_class: school_class || '',
                division: division || '',
                parent_name: parent_name || '',
                parent_phone: parent_phone || ''
            }

            // Insert / Upsert into user_profiles
            await query(`
                INSERT INTO public.user_profiles (
                    id, email, first_name, last_name, phone, role, tenant_id, is_active, is_first_login, metadata, created_at
                ) VALUES ($1, $2, $3, $4, $5, 'student', $6, true, true, $7, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    phone = EXCLUDED.phone,
                    metadata = EXCLUDED.metadata;
            `, [studentUserId, email, first_name, last_name || '', phone || '', tenantId, JSON.stringify(metadataObj)])

            // Initialize student wallet
            await query(`
                INSERT INTO public.student_wallets (student_id, tenant_id, balance, created_at, updated_at)
                VALUES ($1, $2, 50, NOW(), NOW())
                ON CONFLICT (student_id) DO NOTHING;
            `, [studentUserId, tenantId])

            return NextResponse.json({ success: true, message: 'Student successfully admitted and enrolled.', student_id: studentUserId })
        }

        // 3. BULK IMPORT STUDENTS
        if (action === 'BULK_CREATE_STUDENTS') {
            const studentsList = payload
            if (!Array.isArray(studentsList) || studentsList.length === 0) {
                return NextResponse.json({ error: 'No student records provided.' }, { status: 400 })
            }

            let successfulCount = 0
            for (const st of studentsList) {
                try {
                    const email = st.email?.trim()
                    const firstName = st.first_name?.trim()
                    if (!email || !firstName) continue

                    const targetClass = st.school_class || st.class || ''

                    // If teacher, skip any rows not in teacher's assigned classes
                    if (isTeacher) {
                        const hasAccess = assignedClasses.some(ac => 
                            targetClass === ac || 
                            targetClass.toLowerCase().includes(ac.toLowerCase()) || 
                            ac.toLowerCase().includes(targetClass.toLowerCase()) ||
                            (
                                ac.replace(/[^0-9]/g, '') !== '' &&
                                ac.replace(/[^0-9]/g, '') === targetClass.replace(/[^0-9]/g, '')
                            )
                        )
                        if (!hasAccess) continue
                    }

                    const studentUserId = crypto.randomUUID()
                    const metadataObj = {
                        roll_no: st.roll_no || st.roll_number || '',
                        school_class: targetClass,
                        division: st.division || st.section || '',
                        parent_name: st.parent_name || '',
                        parent_phone: st.parent_phone || ''
                    }

                    await query(`
                        INSERT INTO public.user_profiles (
                            id, email, first_name, last_name, phone, role, tenant_id, is_active, is_first_login, metadata, created_at
                        ) VALUES ($1, $2, $3, $4, $5, 'student', $6, true, true, $7, NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            first_name = EXCLUDED.first_name,
                            last_name = EXCLUDED.last_name,
                            metadata = EXCLUDED.metadata;
                    `, [studentUserId, email, firstName, st.last_name?.trim() || '', st.phone?.trim() || '', tenantId, JSON.stringify(metadataObj)])

                    await query(`
                        INSERT INTO public.student_wallets (student_id, tenant_id, balance, created_at, updated_at)
                        VALUES ($1, $2, 50, NOW(), NOW())
                        ON CONFLICT (student_id) DO NOTHING;
                    `, [studentUserId, tenantId])

                    successfulCount++
                } catch (e) {
                    console.error('Error importing student record in bulk:', e)
                }
            }

            return NextResponse.json({
                success: true,
                message: `Successfully imported ${successfulCount} students into your assigned class registry.`,
                imported_count: successfulCount
            })
        }

        // 4. DELETE STUDENT
        if (action === 'DELETE_STUDENT') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 })

            if (isTeacher) {
                const { rows: targetStudent } = await query(
                    `SELECT metadata FROM public.user_profiles WHERE id = $1 AND tenant_id = $2 AND role = 'student'`,
                    [id, tenantId]
                )
                if (!targetStudent[0]) {
                    return NextResponse.json({ error: 'Student not found.' }, { status: 404 })
                }
                const stClass = targetStudent[0].metadata?.school_class || targetStudent[0].metadata?.class || ''
                const hasAccess = assignedClasses.some(ac => 
                    stClass === ac || 
                    stClass.toLowerCase().includes(ac.toLowerCase()) || 
                    ac.toLowerCase().includes(stClass.toLowerCase()) ||
                    (
                        ac.replace(/[^0-9]/g, '') !== '' &&
                        ac.replace(/[^0-9]/g, '') === stClass.replace(/[^0-9]/g, '')
                    )
                )
                if (!hasAccess) {
                    return NextResponse.json({ error: 'Unauthorized: Student is not in your assigned classes.' }, { status: 403 })
                }
            }

            await query('DELETE FROM public.user_profiles WHERE id = $1 AND tenant_id = $2;', [id, tenantId])
            try {
                await supabaseAdmin.auth.admin.deleteUser(id)
            } catch (authErr) {
                // Ignore if auth user not present
            }
            return NextResponse.json({ success: true, message: 'Student profile removed.' })
        }

        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 })
    } catch (error: any) {
        console.error('Error in students POST action:', error)
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
