import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/rbac/permissions — Full permission matrix with role assignments */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [permsRes, rolesRes, rolePermsRes, customPermsRes] = await Promise.all([
        supabaseAdmin.from('permissions').select('*').order('module').order('action'),
        supabaseAdmin.from('roles').select('id, name, description').order('name'),
        supabaseAdmin.from('role_permissions').select('role_id, permission_id, roles!role_permissions_role_id_fkey(name), permissions!role_permissions_permission_id_fkey(key)'),
        supabaseAdmin.from('role_custom_permissions').select('*'),
    ])

    const permissions = permsRes.data ?? []
    const roles = rolesRes.data ?? []
    const rolePerms = rolePermsRes.data ?? []
    const customPerms = customPermsRes.data ?? []

    // Build module groups
    const modules = [...new Set(permissions.map(p => p.module))]
    const matrix = modules.map(mod => ({
        module: mod,
        permissions: permissions.filter(p => p.module === mod).map(perm => ({
            ...perm,
            assignedRoles: rolePerms
                .filter(rp => (rp.permissions as any)?.key === perm.key)
                .map(rp => (rp.roles as any)?.name)
                .filter(Boolean),
            customOverrides: customPerms.filter(cp => cp.permission_key === perm.key),
        }))
    }))

    return NextResponse.json({ permissions, roles, matrix, customPerms })
}

/** PATCH /api/owner/rbac/permissions — Grant or revoke a permission for a role */
export async function PATCH(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { role_id, permission_id, grant } = body

        if (!role_id || !permission_id || typeof grant !== 'boolean') {
            return NextResponse.json({ error: 'role_id, permission_id, and grant (bool) are required' }, { status: 400 })
        }

        if (grant) {
            await supabaseAdmin
                .from('role_permissions')
                .upsert({ role_id, permission_id }, { onConflict: 'role_id,permission_id' })
        } else {
            await supabaseAdmin
                .from('role_permissions')
                .delete()
                .eq('role_id', role_id)
                .eq('permission_id', permission_id)
        }

        await supabaseAdmin.from('audit_logs').insert({
            action: grant ? 'permission_granted' : 'permission_revoked',
            module: 'settings',
            user_id: user.id,
            details: { role_id, permission_id, grant },
            severity: 'warning',
        })

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('PATCH /rbac/permissions error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
