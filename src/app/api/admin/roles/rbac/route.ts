import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logAuditAction } from '@/lib/security'

/**
 * GET /api/admin/roles/rbac
 * Fetches all roles, permissions, and their active mappings (role_permissions)
 * tailored to the current authenticated user's tenant context.
 */
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch user's profile to get context
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile || !['owner', 'tenant_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch Roles (excluding owner so they can't lock themselves out)
        const { data: roles } = await supabaseAdmin
            .from('roles')
            .select('id, name')
            .neq('name', 'owner')
            .order('name')

        // Fetch Permissions
        const { data: permissions } = await supabaseAdmin
            .from('permissions')
            .select('id, module, action, key')
            .order('module')

        // Fetch Role Permissions Mappings
        // If owner, fetch global (tenant_id IS NULL). If tenant_admin, fetch global + their tenant overrides
        let query = supabaseAdmin.from('role_permissions').select('role_id, permission_id, tenant_id')

        if (profile.role === 'tenant_admin') {
            query = query.or(`tenant_id.is.null,tenant_id.eq.${profile.tenant_id}`)
        } else {
            query = query.is('tenant_id', null)
        }

        const { data: rolePerms } = await query

        return NextResponse.json({
            roles,
            permissions,
            rolePerms
        })
    } catch (error) {
        console.error('RBAC GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/admin/roles/rbac
 * Toggles a specific permission for a role.
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch profile
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile || !['owner', 'tenant_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { roleId, permissionId, isGranted } = body

        if (!roleId || !permissionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Determine context
        const targetTenantId = profile.role === 'owner' ? null : profile.tenant_id

        if (isGranted) {
            // Grant permission
            const { error: insertError } = await supabaseAdmin
                .from('role_permissions')
                .insert({
                    role_id: roleId,
                    permission_id: permissionId,
                    tenant_id: targetTenantId
                })

            if (insertError) {
                // If it already exists (Unique constraint), just ignore
                if (!insertError.message.includes('duplicate key')) {
                    throw insertError
                }
            }
        } else {
            // Revoke permission
            let deleteQuery = supabaseAdmin
                .from('role_permissions')
                .delete()
                .eq('role_id', roleId)
                .eq('permission_id', permissionId)

            if (targetTenantId === null) {
                deleteQuery = deleteQuery.is('tenant_id', null)
            } else {
                deleteQuery = deleteQuery.eq('tenant_id', targetTenantId)
            }

            const { error: deleteError } = await deleteQuery
            if (deleteError) throw deleteError
        }

        // Action recorded in Audit logs asynchronously!
        logAuditAction(user.id, profile.tenant_id || '', 'rbac', isGranted ? 'grant_permission' : 'revoke_permission', {
            role_id: roleId,
            permission_id: permissionId,
            is_global: targetTenantId === null
        }).catch(err => console.error('Failed to log audit action:', err))

        return NextResponse.json({ message: 'Permission updated successfully' })
    } catch (error) {
        console.error('RBAC POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
