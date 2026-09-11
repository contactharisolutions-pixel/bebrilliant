import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
// @ts-ignore
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const PRIMARY_JWT_SECRET = process.env.JWT_SECRET || 'BeBrilliant_SuperSecret_2026_ProdKey'
const FALLBACK_JWT_SECRET = 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('bb_token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let decoded: any = null
        try {
            decoded = jwt.verify(token, PRIMARY_JWT_SECRET)
        } catch {
            decoded = jwt.verify(token, FALLBACK_JWT_SECRET)
        }
        if (!decoded || !decoded.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get profile details
        const { rows: profileRows } = await query(
            'SELECT id, role, first_name, last_name, email, avatar_url FROM public.user_profiles WHERE id = $1',
            [decoded.id]
        )
        const profile = profileRows[0]
        const role = profile?.role || 'owner'

        let permissions: string[] = []

        if (role === 'owner') {
            // Platform Owner gets all permissions in the database
            const { rows: permRows } = await query('SELECT key FROM public.permissions')
            permissions = permRows.map((r: any) => r.key)
        } else if (role === 'platform_staff') {
            // Query custom role/permissions
            const { rows: permRows } = await query(`
                SELECT DISTINCT p.key 
                FROM public.permissions p
                JOIN public.role_permissions rp ON rp.permission_id = p.id
                WHERE rp.role_id IN (
                    SELECT role_id FROM public.user_roles WHERE user_id = $1
                    UNION
                    SELECT r.id FROM public.roles r WHERE r.name = $2
                )
            `, [decoded.id, role])
            permissions = permRows.map((r: any) => r.key)
        }

        const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 
                         profile?.email?.split('@')[0] || 
                         'Divyesh Solanki'

        return NextResponse.json({
            role,
            permissions,
            user: {
                id: profile?.id || decoded.id,
                first_name: profile?.first_name || 'Divyesh',
                last_name: profile?.last_name || 'Solanki',
                full_name: fullName,
                email: profile?.email || decoded.email,
                avatar_url: profile?.avatar_url || null
            }
        })
    } catch (err: any) {
        console.error('Error fetching rbac me:', err)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
