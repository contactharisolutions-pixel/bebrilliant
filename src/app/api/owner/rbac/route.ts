import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/rbac - Full RBAC data: roles, permissions, owner staff users, audit logs */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 25
    const offset = (page - 1) * limit

    // Owner platform staff roles only — no tenants, teachers, parents, students
    const OWNER_STAFF_ROLES = ['owner', 'platform_staff', 'sales_exec', 'demo_exec', 'onboarding_spec', 'support', 'admin']

    // Parallel fetch all RBAC data
    const [rolesRes, permissionsRes, rolePermsRes, auditRes] = await Promise.all([
        supabaseAdmin.from('roles').select('id, name, description').order('name'),
        supabaseAdmin.from('permissions').select('id, module, action, key, description').order('module').order('action'),
        supabaseAdmin.from('role_permissions').select('id, role_id, permission_id, tenant_id, roles!role_permissions_role_id_fkey(name), permissions!role_permissions_permission_id_fkey(key, module, action)'),
        supabaseAdmin.from('audit_logs').select('id, action, module, details, created_at, tenant_id, user_id').order('created_at', { ascending: false }).limit(100),
    ])

    // Users: ONLY owner platform staff (tenant_id IS NULL + owner staff roles)
    let usersQ = supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, email, role, tenant_id, is_active, created_at')
        .is('tenant_id', null)
        .in('role', OWNER_STAFF_ROLES)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (roleFilter !== 'all' && OWNER_STAFF_ROLES.includes(roleFilter)) {
        usersQ = usersQ.eq('role', roleFilter)
    }
    if (search) usersQ = usersQ.or('email.ilike.%' + search + '%,first_name.ilike.%' + search + '%,last_name.ilike.%' + search + '%')

    const { data: users, count: usersCount } = await usersQ

    // Stats: scoped to owner platform staff only
    const { data: allStaff } = await supabaseAdmin
        .from('user_profiles')
        .select('role, is_active')
        .is('tenant_id', null)
        .in('role', OWNER_STAFF_ROLES)

    const allUsers = allStaff ?? []

    const roleDistribution = OWNER_STAFF_ROLES.map(r => ({
        role: r,
        label: r === 'owner' ? 'Owner' : r === 'platform_staff' ? 'Platform Staff' : r === 'sales_exec' ? 'Sales Executive' : r === 'demo_exec' ? 'Demo Executive' : r === 'onboarding_spec' ? 'Onboarding Specialist' : r === 'support' ? 'Support' : 'Admin',
        count: allUsers.filter((u: any) => u.role === r).length,
        active: allUsers.filter((u: any) => u.role === r && u.is_active).length,
    })).filter(r => r.count > 0)

    // Permission matrix: group by module
    const permissions = permissionsRes.data ?? []
    const modules = [...new Set(permissions.map(p => p.module))]
    const roles = rolesRes.data ?? []
    const rolePerms = rolePermsRes.data ?? []

    const permMatrix = modules.map(mod => ({
        module: mod,
        permissions: permissions.filter(p => p.module === mod).map(perm => ({
            ...perm,
            assignedRoles: rolePerms.filter(rp => (rp.permissions as any)?.key === perm.key).map(rp => (rp.roles as any)?.name).filter(Boolean),
        }))
    }))

    return NextResponse.json({
        users: users ?? [],
        usersTotal: usersCount ?? (users ?? []).length,
        roles,
        permissions: permissionsRes.data ?? [],
        permMatrix,
        rolePerms: rolePermsRes.data ?? [],
        roleDistribution,
        auditLogs: auditRes.data ?? [],
        tenants: [],
        ownerStaffRoles: OWNER_STAFF_ROLES,
        stats: {
            totalUsers: allUsers.length,
            activeUsers: allUsers.filter((u: any) => u.is_active).length,
            totalRoles: (rolesRes.data ?? []).length,
            totalPermissions: (permissionsRes.data ?? []).length,
        }
    })
}

/** POST /api/owner/rbac - Create a new platform staff user */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { first_name, last_name, email, password, role } = body

        if (!first_name || !last_name || !email || !password || !role) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
        }

        const STAFF_ROLES = ['owner', 'platform_staff', 'sales_exec', 'demo_exec', 'onboarding_spec', 'support', 'admin']
        if (!STAFF_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid platform staff role. Please select a valid role.' }, { status: 400 })
        }

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role, first_name, last_name }
        })

        if (authError || !authData?.user) {
            return NextResponse.json({ error: authError?.message || 'Failed to create auth user.' }, { status: 400 })
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                email,
                first_name,
                last_name,
                role,
                tenant_id: null,
                is_active: true
            })

        if (profileError) {
            // Cleanup auth user
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            return NextResponse.json({ error: 'Failed to create user profile.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, id: authData.user.id }, { status: 201 })
    } catch (err: any) {
        console.error("POST rbac API crashed:", err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
