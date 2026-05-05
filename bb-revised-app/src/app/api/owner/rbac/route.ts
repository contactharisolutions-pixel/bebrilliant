import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return p?.role === 'owner' ? user : null
}

/** GET /api/owner/rbac - Full RBAC data: roles, permissions, users, audit logs */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role') || 'all'
    const tenantFilter = searchParams.get('tenant') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 25
    const offset = (page - 1) * limit

    // Parallel fetch all RBAC data
    const [rolesRes, permissionsRes, rolePermsRes, auditRes, tenantsRes] = await Promise.all([
        supabaseAdmin.from('roles').select('id, name, description').order('name'),
        supabaseAdmin.from('permissions').select('id, module, action, key, description').order('module').order('action'),
        supabaseAdmin.from('role_permissions').select('id, role_id, permission_id, tenant_id, roles!role_permissions_role_id_fkey(name), permissions!role_permissions_permission_id_fkey(key, module, action)'),
        supabaseAdmin.from('audit_logs').select('id, action, module, details, created_at, tenant_id, user_id').order('created_at', { ascending: false }).limit(100),
        supabaseAdmin.from('tenants').select('id, name, type').order('name'),
    ])

    // Users with role filter and search
    let usersQ = supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, email, role, tenant_id, is_active, created_at, tenants!user_profiles_tenant_id_fkey(name, type)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (roleFilter !== 'all') usersQ = usersQ.eq('role', roleFilter)
    if (tenantFilter !== 'all') usersQ = usersQ.eq('tenant_id', tenantFilter)
    if (search) usersQ = usersQ.or('email.ilike.%' + search + '%,first_name.ilike.%' + search + '%,last_name.ilike.%' + search + '%')

    const { data: users, count: usersCount } = await usersQ

    // Role distribution
    const allUsers = (await supabaseAdmin.from('user_profiles').select('role, is_active')).data ?? []
    const roleDistribution = ['owner', 'tenant_admin', 'teacher', 'teacher_pending', 'student', 'parent'].map(r => ({
        role: r,
        count: allUsers.filter(u => u.role === r).length,
        active: allUsers.filter(u => u.role === r && u.is_active).length,
    }))

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
        usersTotal: usersCount ?? 0,
        roles,
        permissions: permissionsRes.data ?? [],
        permMatrix,
        rolePerms: rolePermsRes.data ?? [],
        roleDistribution,
        auditLogs: auditRes.data ?? [],
        tenants: tenantsRes.data ?? [],
        stats: {
            totalUsers: allUsers.length,
            activeUsers: allUsers.filter(u => u.is_active).length,
            totalRoles: (rolesRes.data ?? []).length,
            totalPermissions: (permissionsRes.data ?? []).length,
        }
    })
}
