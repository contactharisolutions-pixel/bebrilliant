import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function verifyTenantStaff() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles')
        .select(`
            role, 
            tenant_id, 
            metadata,
            tenants:tenant_id(tenant_type)
        `)
        .eq('id', user.id).single()
    if (!profile) return null

    const rawTenant = (profile as any).tenants
    const tenantData = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant
    const tenant_type = tenantData?.tenant_type || 'institute'

    // Fallback for platform owners operating without a strict tenant binding
    if (profile.role === 'owner' && !profile.tenant_id) {
        const { data: tenants } = await supabaseAdmin.from('tenants').select('id').limit(1)
        if (tenants?.[0]) return { user, tenant_id: tenants[0].id, role: profile.role, metadata: profile.metadata, tenant_type: 'institute' }
        return { user, tenant_id: null, role: profile.role, metadata: profile.metadata, tenant_type: 'institute' }
    }

    // Allow staff and students (limited by query filters in route handlers)
    if (['owner', 'tenant_admin', 'teacher', 'student'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, role: profile.role, metadata: profile.metadata, tenant_type }
    }
    return null
}

/**
 * RESTRICTION: Only Institute tenants can operate affiliate module.
 * School and Independent Teachers are blocked.
 */
export async function verifyAffiliateAccess() {
    const session = await verifyTenantStaff()
    if (!session) return null
    if (['school', 'independent_teacher'].includes(session.tenant_type)) return null
    return session
}
