import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { hasPermission } from '@/lib/security'

/**
 * Verifies if the logged-in user is authorized for platform owner/staff tasks.
 * If requiredPermission is provided, verifies granular access for platform_staff.
 * Returns the authenticated user object if authorized, or null if forbidden.
 */
export async function verifyPlatformAccess(requiredPermission?: string) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return null

        // Fetch user profile role
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role, is_active')
            .eq('id', user.id)
            .single()

        if (!profile || !profile.is_active) return null

        // Platform Owner bypasses all checks (full access)
        if (profile.role === 'owner') {
            return user
        }

        // Platform Staff requires the specific permission key
        const STAFF_ROLES = ['platform_staff', 'sales_exec', 'demo_exec', 'onboarding_spec']
        if (STAFF_ROLES.includes(profile.role)) {
            if (!requiredPermission) {
                // If no specific permission is requested, platform staff gets read access
                return user
            }
            const authorized = await hasPermission(user.id, requiredPermission)
            if (authorized) {
                return user
            }
        }

        return null
    } catch (err) {
        console.error('Error in verifyPlatformAccess:', err)
        return null
    }
}
