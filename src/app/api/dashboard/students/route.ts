import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { tenant_id, role, metadata } = session
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const school_class = url.searchParams.get('school_class') || ''
    const division = url.searchParams.get('division') || ''

    try {
        console.log('GET Students Debug:', { role, tenant_id })

        let query = supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, phone, is_active, created_at, role, metadata')
            .order('created_at', { ascending: false })

        // If the teacher has a tenant_id, always filter by it.
        // If an owner has NO tenant_id, show everything (global admin view)
        if (tenant_id) {
            query = query.eq('tenant_id', tenant_id)
        } else if (role !== 'owner') {
             // Non-owner with no TID. Block them.
             return NextResponse.json({ error: 'Tenant isolation violation. Node unassigned.' }, { status: 403 })
        }

        query = query.eq('role', 'student')

        if (role === 'teacher') {
            const assignedClasses: string[] = (metadata as any)?.assigned_classes || []
            const assignedDivisions: string[] = (metadata as any)?.assigned_divisions || []

            if (assignedClasses.length === 0 && assignedDivisions.length === 0) {
                return NextResponse.json([])
            }

            // If a specific class or division is requested, verify it's within the teacher's scope
            if (school_class && assignedClasses.includes(school_class)) {
                query = query.eq('metadata->>school_class', school_class)
            } else if (assignedClasses.length > 0) {
                query = query.in('metadata->>school_class', assignedClasses)
            }

            if (division && assignedDivisions.includes(division)) {
                query = query.eq('metadata->>division', division)
            } else if (assignedDivisions.length > 0) {
                query = query.in('metadata->>division', assignedDivisions)
            }
        } else {
            // Admin/Owner can filter freely
            if (school_class) query = query.eq('metadata->>school_class', school_class)
            if (division) query = query.eq('metadata->>division', division)
        }

        if (search) {
            query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
        }

        const { data: students, error: sError } = await query
        if (sError) {
            console.log('GET /api/dashboard/students: Supabase Error', sError.message)
            throw sError
        }

        return NextResponse.json(students || [])
    } catch (error: any) {
        console.log('GET /api/dashboard/students: System Error', error.message)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) {
        return NextResponse.json({ error: 'Identity Verification Failed in POST' }, { status: 403 })
    }

    const { tenant_id, role } = session
    const body = await request.json()
    const { action, payload } = body

    // Teachers are typically not allowed to create raw system elements unless explicitly allowed.
    // We'll let them add students for now or restrict it to admin
    if (role === 'teacher' && action !== 'FETCH_PERFORMANCE') {
        return NextResponse.json({ error: 'Teachers cannot globally mutate student rosters. Contact your admin.' }, { status: 403 })
    }

    try {
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload
            const { data, error } = await supabaseAdmin
                .from('user_profiles')
                .update({ is_active })
                .eq('id', id)
                .eq('tenant_id', tenant_id) // Safety check
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, user: data })
        }

        if (action === 'CREATE_STUDENT') {
            const { first_name, last_name, email, phone } = payload
            // Auto Credential: Phone = Password, Email = User ID (or autogen password)
            const rawPassword = phone || 'BrightBoard#123'

            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password: rawPassword,
                email_confirm: true,
                user_metadata: {
                    role: 'student',
                    tenant_id,
                    first_name,
                    last_name
                }
            })
            if (authError) throw authError

            // Typically an auth hook creates the user_profile. Verify and Force Update it:
            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .upsert({
                    id: authData.user.id,
                    email,
                    role: 'student',
                    first_name,
                    last_name,
                    phone,
                    is_active: true,
                    is_first_login: true,
                    tenant_id,
                    metadata: {
                        school_class: payload.school_class || '',
                        division: payload.division || ''
                    }
                })

            if (profileError) throw profileError

            // Initialize Student Wallet with welcome credits
            await supabaseAdmin.from('student_wallets').insert({
                student_id: authData.user.id,
                tenant_id,
                balance: 50
            })

            return NextResponse.json({ success: true, id: authData.user.id })
        }

        if (action === 'BULK_CREATE_STUDENTS') {
            const students = payload // Array of exact schema objects
            const results = []
            for (const student of students) {
                try {
                    const rawPassword = student.phone || 'BrightBoard#123'
                    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
                        email: student.email,
                        password: rawPassword,
                        email_confirm: true,
                        user_metadata: { role: 'student', tenant_id, first_name: student.first_name, last_name: student.last_name }
                    })
                    if (!authErr && authData?.user) {
                        await supabaseAdmin.from('user_profiles').upsert({
                            id: authData.user.id,
                            email: student.email,
                            role: 'student',
                            first_name: student.first_name,
                            last_name: student.last_name || '',
                            phone: student.phone,
                            is_active: true,
                            is_first_login: true,
                            tenant_id,
                            metadata: {
                                school_class: student.school_class || student.class || '',
                                division: student.division || ''
                            }
                        })

                        // Initialize Student Wallet with welcome credits
                        await supabaseAdmin.from('student_wallets').insert({
                            student_id: authData.user.id,
                            tenant_id,
                            balance: 50
                        })

                        results.push({ email: student.email, status: 'Success' })
                    } else {
                        results.push({ email: student.email, status: 'Failed: ' + authErr?.message })
                    }
                } catch (err: any) {
                    results.push({ email: student.email, status: 'Error: ' + err.message })
                }
            }
            return NextResponse.json({ success: true, results })
        }

        return NextResponse.json({ error: 'Invalid action payload logic' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
