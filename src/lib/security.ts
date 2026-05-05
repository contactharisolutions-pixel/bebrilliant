import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Validates if the user's institution/tenant has an active subscription layout.
 * Enforces Phase 2 Access rules blocking un-subscribed tenants unless accessing billing.
 */
export async function checkTenantSubscription(tenantId: string): Promise<{ allowed: boolean, reason?: string }> {
    if (!tenantId) return { allowed: false, reason: 'No tenant context' }

    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('is_active, subscription_plan, subscription_expires_at')
        .eq('id', tenantId)
        .single()

    if (!tenant) return { allowed: false, reason: 'Tenant not found' }

    if (!tenant.is_active) {
        return { allowed: false, reason: 'Tenant account is suspended or inactive.' }
    }

    // Advanced Phase 2 Subscription Check
    if (tenant.subscription_expires_at) {
        const expiry = new Date(tenant.subscription_expires_at)
        if (expiry < new Date()) {
            return { allowed: false, reason: 'Subscription expired. Please complete billing to restore access.' }
        }
    }

    return { allowed: true }
}

/**
 * Checks if the precise user ID is authorized to perform the given action (permissionKey).
 * Looks up their role (both primary and assigned user_roles) and cross-references the role_permissions map.
 */
export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
    const supabase = await createClient()

    // 1. Get the requested permission's UUID
    const { data: perm } = await supabaseAdmin
        .from('permissions')
        .select('id')
        .eq('key', permissionKey)
        .single()

    if (!perm) return false // Invalid permission key requested

    // 2. Fetch User's explicit user_roles bridging tables
    const { data: explicitRoles } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', userId)

    let roleIds = explicitRoles ? explicitRoles.map(r => r.role_id) : []

    // 3. Fallback to their primary text-based role from user_profiles if bridging table is skipped
    if (roleIds.length === 0) {
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', userId)
            .single()

        if (profile?.role) {
            // Owner overrides all permissions system checking immediately
            if (profile.role === 'owner') return true

            const { data: roleDef } = await supabaseAdmin
                .from('roles')
                .select('id')
                .eq('name', profile.role)
                .single()
            if (roleDef) roleIds.push(roleDef.id)
        }
    }

    if (roleIds.length === 0) return false

    // 4. Verify if ANY of the user's role_ids are matched with the permission_id
    const { data: validPerm } = await supabaseAdmin
        .from('role_permissions')
        .select('id')
        .eq('permission_id', perm.id)
        .in('role_id', roleIds)
        .limit(1)

    return !!(validPerm && (validPerm as any[]).length > 0)
}

/**
 * Audit Logging Helper Function
 */
export async function logAuditAction(userId: string, tenantId: string, module: string, action: string, details: Record<string, any> = {}) {
    await supabaseAdmin.from('audit_logs').insert({
        user_id: userId,
        tenant_id: tenantId,
        module,
        action,
        details
    })
}
