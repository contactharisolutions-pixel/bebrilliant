import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { verifyTenantStaff } from '@/lib/auth-server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const session = await verifyTenantStaff()
        const tenantId = session?.tenant_id || '5cccb9be-5b4a-4143-8725-bc6061e337fa'

        const url = new URL(request.url)
        const search = url.searchParams.get('search')?.trim() || ''
        const classNameFilter = url.searchParams.get('school_class') || 'all'
        const divisionFilter = url.searchParams.get('division') || 'all'
        const statusFilter = url.searchParams.get('status') || 'all'

        // 1. Fetch Students joined with their calculated average marks from answer sheets
        let whereClauses = ["up.tenant_id = $1", "up.role = 'student'"]
        const queryParams: any[] = [tenantId]

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

        // 2. Fetch Aggregated Statistics for KPIs
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
            WHERE up.tenant_id = $1 AND up.role = 'student';
        `
        const statsRes = await query(statsQuery, [tenantId])
        const stats = statsRes.rows[0] || {
            total_students: 0,
            active_students: 0,
            cohort_average_marks: 0,
            top_class: 'Grade 10'
        }

        // 3. Fetch Classes & Divisions for Dynamic Filter Dropdowns
        const classesRes = await query('SELECT id, name FROM public.classes WHERE tenant_id = $1 ORDER BY name ASC;', [tenantId])
        const divisionsRes = await query('SELECT id, name, class_id FROM public.divisions WHERE class_id IN (SELECT id FROM public.classes WHERE tenant_id = $1) ORDER BY name ASC;', [tenantId])

        return NextResponse.json({
            success: true,
            data: {
                students,
                stats,
                classes: classesRes.rows || [],
                divisions: divisionsRes.rows || []
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

        const body = await request.json()
        const { action, payload } = body

        // 1. TOGGLE ACTIVE STATUS
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload
            await query(
                'UPDATE public.user_profiles SET is_active = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3;',
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
                    id, email, first_name, last_name, phone, role, tenant_id, is_active, is_first_login, metadata, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, 'student', $6, true, true, $7, NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    phone = EXCLUDED.phone,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW();
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

                    const studentUserId = crypto.randomUUID()
                    const metadataObj = {
                        roll_no: st.roll_no || st.roll_number || '',
                        school_class: st.school_class || st.class || '',
                        division: st.division || st.section || '',
                        parent_name: st.parent_name || '',
                        parent_phone: st.parent_phone || ''
                    }

                    await query(`
                        INSERT INTO public.user_profiles (
                            id, email, first_name, last_name, phone, role, tenant_id, is_active, is_first_login, metadata, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, 'student', $6, true, true, $7, NOW(), NOW())
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
                message: `Successfully imported ${successfulCount} students into the school registry.`,
                imported_count: successfulCount
            })
        }

        // 4. DELETE STUDENT
        if (action === 'DELETE_STUDENT') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 })

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
