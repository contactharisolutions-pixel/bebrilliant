import { cookies, headers } from 'next/headers'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function verifyTenantStaff() {
    try {
        const cookieStore = await cookies()
        const headerStore = await headers()
        const token = cookieStore.get('bb_token')?.value || headerStore.get('authorization')?.split(' ')[1]
        
        if (!token) return null

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
        if (!decoded || !decoded.id) return null

        const { rows } = await query(
            `SELECT up.role, up.tenant_id, up.metadata, t.tenant_type, up.is_active
             FROM public.user_profiles up
             LEFT JOIN public.tenants t ON up.tenant_id = t.id
             WHERE up.id = $1`,
            [decoded.id]
        )

        const profile = rows[0]
        if (!profile || !profile.is_active) return null

        const user = {
            id: decoded.id,
            email: decoded.email
        }

        const tenant_type = profile.tenant_type || 'institute'

        // Fallback for platform owners operating without a strict tenant binding
        if (profile.role === 'owner' && !profile.tenant_id) {
            const { rows: tenants } = await query('SELECT id FROM public.tenants LIMIT 1')
            if (tenants?.[0]) {
                return { user, tenant_id: tenants[0].id, role: profile.role, metadata: profile.metadata, tenant_type: 'institute' }
            }
            return { user, tenant_id: null, role: profile.role, metadata: profile.metadata, tenant_type: 'institute' }
        }

        // Allow staff and students (limited by query filters in route handlers)
        if (['owner', 'tenant_admin', 'teacher', 'student', 'parent'].includes(profile.role)) {
            return { user, tenant_id: profile.tenant_id, role: profile.role, metadata: profile.metadata, tenant_type }
        }
        return null
    } catch (err) {
        console.error('[auth-server verification error]', err)
        return null
    }
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

