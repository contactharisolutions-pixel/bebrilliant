import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('bb_token')?.value || request.headers.get('authorization')?.split(' ')[1]
        
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Optimized query to fetch profile + tenant details
        const { rows } = await query(
            `SELECT up.role, up.first_name, up.last_name, up.tenant_id, up.is_first_login, 
                    t.name as tenant_name, t.logo as tenant_logo, t.tenant_type
             FROM public.user_profiles up
             LEFT JOIN public.tenants t ON up.tenant_id = t.id
             WHERE up.id = $1`,
            [decoded.id]
        )

        const profile = rows[0]
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        let tenantBranding = null
        if (profile.tenant_id) {
            tenantBranding = {
                name: profile.tenant_name,
                logo_url: profile.tenant_logo || null,
                tenant_type: profile.tenant_type
            }
        } else if (profile.role === 'owner') {
            tenantBranding = { name: 'BrightBoard Enterprise Hub', logo_url: '/logo-master.png' }
        }

        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || decoded.email?.split('@')[0] || 'Unknown User'

        return NextResponse.json({
            id: decoded.id,
            email: decoded.email,
            role: profile.role,
            fullName,
            tenant_id: profile.tenant_id,
            tenant: tenantBranding,
            is_first_login: profile.is_first_login
        })
    } catch (e: any) {
        console.error('API /auth/me error:', e)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}

