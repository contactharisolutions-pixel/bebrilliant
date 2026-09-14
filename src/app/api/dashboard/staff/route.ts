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

    if (tenant_type === 'independent_teacher') return null

    // Platform owner fallback
    if (profile.role === 'owner' && !profile.tenant_id) {
        const { data: tenants } = await supabaseAdmin.from('tenants').select('id').limit(1)
        if (tenants?.[0]) return { user, tenant_id: tenants[0].id, is_owner: true }
        return null
    }

    if (profile.tenant_id && ['tenant_admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: profile.role === 'owner' }
    }

    return null
}

const DEFAULT_DEPARTMENTS = [
    'Administration',
    'Finance & Accounts',
    'Student Admissions',
    'Library & Resources',
    'IT & Technical Support',
    'Academic Operations',
    'Laboratory & Science',
    'Campus Management'
]

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Administrator' }, { status: 403 })

    const { tenant_id, user } = session

    try {
        // Fetch staff profiles: role IN ('platform_staff', 'tenant_admin')
        const { data: staffProfiles, error: staffError } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, phone, role, is_active, created_at, metadata')
            .eq('tenant_id', tenant_id)
            .in('role', ['platform_staff', 'tenant_admin'])
            .order('created_at', { ascending: false })

        if (staffError) throw staffError

        const staffList = (staffProfiles || []).map(s => {
            const meta = s.metadata || {}
            return {
                id: s.id,
                first_name: s.first_name || '',
                last_name: s.last_name || '',
                email: s.email || '',
                phone: s.phone || '',
                role: s.role || 'platform_staff',
                is_active: !!s.is_active,
                created_at: s.created_at,
                updated_at: meta.updated_at || s.created_at,
                is_self: s.id === user.id,
                metadata: {
                    designation: meta.designation || (s.role === 'tenant_admin' ? 'Administrator' : 'Staff Officer'),
                    department: meta.department || 'Administration',
                    employee_id: meta.employee_id || '',
                    permissions: meta.permissions || ['view_records'],
                    joining_date: meta.joining_date || s.created_at
                }
            }
        })

        // Collect distinct departments
        const deptSet = new Set<string>(DEFAULT_DEPARTMENTS)
        staffList.forEach(s => {
            if (s.metadata?.department) deptSet.add(s.metadata.department)
        })

        const total_staff = staffList.length
        const active_staff = staffList.filter(s => s.is_active).length
        const suspended_staff = total_staff - active_staff
        const admin_count = staffList.filter(s => s.role === 'tenant_admin' || s.metadata?.permissions?.includes('admin_access')).length

        const stats = {
            total_staff,
            active_staff,
            suspended_staff,
            departments_count: deptSet.size,
            admin_count
        }

        return NextResponse.json({
            staff: staffList,
            departments: Array.from(deptSet),
            stats
        })
    } catch (error: any) {
        console.error('[STAFF_API_GET_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, user } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        // ── TOGGLE STATUS ───────────────────────────────────────────
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active } = payload
            if (id === user.id && !is_active) {
                return NextResponse.json({ error: 'Cannot suspend your own administrator account.' }, { status: 400 })
            }

            const { data, error } = await supabaseAdmin
                .from('user_profiles')
                .update({ is_active })
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, staff: data })
        }

        // ── CREATE STAFF MEMBER ─────────────────────────────────────
        if (action === 'CREATE_STAFF') {
            const {
                first_name,
                last_name = '',
                email,
                phone = '',
                designation = 'Administrative Officer',
                department = 'Administration',
                employee_id = '',
                role = 'platform_staff', // 'platform_staff' or 'tenant_admin'
                permissions = ['view_records'],
                is_active = true
            } = payload

            if (!first_name?.trim() || !email?.trim()) {
                return NextResponse.json({ error: 'First name and email address are required.' }, { status: 400 })
            }

            const cleanEmail = email.trim().toLowerCase()
            const rawPassword = payload.password || phone || 'Staff#' + Math.floor(1000 + Math.random() * 9000)

            // 1. Create or link Supabase Auth user
            let authUserId: string
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password: rawPassword,
                email_confirm: true,
                user_metadata: { role, tenant_id, first_name, last_name }
            })

            if (authError) {
                if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
                    const { data: existingUser } = await supabaseAdmin
                        .from('user_profiles')
                        .select('id, tenant_id')
                        .eq('email', cleanEmail)
                        .single()

                    if (existingUser && existingUser.tenant_id === tenant_id) {
                        return NextResponse.json({ error: 'A staff member with this email already exists in your institute.' }, { status: 409 })
                    } else if (existingUser) {
                        return NextResponse.json({ error: 'This email is already associated with another institute profile.' }, { status: 409 })
                    } else {
                        const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers()
                        const matched = listUsers.users.find(u => u.email?.toLowerCase() === cleanEmail)
                        if (!matched) throw new Error('Email exists in authentication system.')
                        authUserId = matched.id
                    }
                } else {
                    return NextResponse.json({ error: 'Auth creation failed: ' + authError.message }, { status: 500 })
                }
            } else {
                authUserId = authData.user.id
            }

            // 2. Upsert user_profiles
            const metadata = {
                designation,
                department,
                employee_id: employee_id || `STF-${Math.floor(1000 + Math.random() * 9000)}`,
                permissions: Array.isArray(permissions) ? permissions : ['view_records'],
                is_staff: true,
                joining_date: new Date().toISOString()
            }

            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .upsert({
                    id: authUserId,
                    email: cleanEmail,
                    role: ['tenant_admin', 'platform_staff'].includes(role) ? role : 'platform_staff',
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

        // ── UPDATE STAFF PROFILE ────────────────────────────────────
        if (action === 'UPDATE_STAFF') {
            const { id, first_name, last_name, phone, designation, department, employee_id, permissions, role } = payload

            if (!id || !first_name) {
                return NextResponse.json({ error: 'Staff ID and first name are required.' }, { status: 400 })
            }

            const { data: existingProfile } = await supabaseAdmin
                .from('user_profiles')
                .select('metadata, role')
                .eq('id', id)
                .eq('tenant_id', tenant_id)
                .single()

            const currentMeta = existingProfile?.metadata || {}
            const updatedMeta = {
                ...currentMeta,
                designation: designation !== undefined ? designation : currentMeta.designation,
                department: department !== undefined ? department : currentMeta.department,
                employee_id: employee_id !== undefined ? employee_id : currentMeta.employee_id,
                permissions: permissions !== undefined ? permissions : currentMeta.permissions
            }

            const updateData: any = {
                first_name: first_name.trim(),
                last_name: (last_name || '').trim(),
                phone: phone || '',
                metadata: updatedMeta
            }

            // Only allow role change if valid
            if (role && ['tenant_admin', 'platform_staff'].includes(role)) {
                updateData.role = role
            }

            const { error: updateError } = await supabaseAdmin
                .from('user_profiles')
                .update(updateData)
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (updateError) throw updateError
            return NextResponse.json({ success: true })
        }

        // ── RESET PASSWORD ──────────────────────────────────────────
        if (action === 'RESET_PASSWORD') {
            const { id, new_password } = payload
            if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })

            const generatedPassword = new_password || 'Staff#' + Math.floor(100000 + Math.random() * 900000)

            const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(id, {
                password: generatedPassword
            })

            if (resetError) throw resetError
            return NextResponse.json({ success: true, temporary_password: generatedPassword })
        }

        // ── DELETE STAFF ────────────────────────────────────────────
        if (action === 'DELETE_STAFF') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })

            if (id === user.id) {
                return NextResponse.json({ error: 'You cannot delete your own logged-in administrator account.' }, { status: 400 })
            }

            // Delete user_profiles
            const { error: delProfileError } = await supabaseAdmin
                .from('user_profiles')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)

            if (delProfileError) throw delProfileError

            // Delete auth user
            await supabaseAdmin.auth.admin.deleteUser(id)

            return NextResponse.json({ success: true })
        }

        // ── BULK STATUS UPDATE ──────────────────────────────────────
        if (action === 'BULK_STATUS') {
            const { ids, is_active } = payload
            if (!Array.isArray(ids) || ids.length === 0) {
                return NextResponse.json({ error: 'No staff members selected' }, { status: 400 })
            }

            // Exclude self if suspending
            const safeIds = ids.filter(i => is_active || i !== user.id)

            const { error: bulkError } = await supabaseAdmin
                .from('user_profiles')
                .update({ is_active, updated_at: new Date().toISOString() })
                .in('id', safeIds)
                .eq('tenant_id', tenant_id)

            if (bulkError) throw bulkError
            return NextResponse.json({ success: true, updated_count: safeIds.length })
        }

        return NextResponse.json({ error: 'Unrecognized action' }, { status: 400 })
    } catch (error: any) {
        console.error('[STAFF_API_POST_ERROR]', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
