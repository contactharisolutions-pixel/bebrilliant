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
    const { data, error } = await supabaseAdmin.rpc('check_user_permission', {
        p_user_id: userId,
        p_key: permissionKey
    })
    
    if (error) {
        console.error('hasPermission RPC error:', error)
        return false
    }
    
    return !!data
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
