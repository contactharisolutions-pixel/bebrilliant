import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
// @ts-ignore
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('bb_token')?.value
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string }
        if (!decoded || !decoded.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Get primary role
        const { rows: profileRows } = await query(
            'SELECT role FROM public.user_profiles WHERE id = $1',
            [decoded.id]
        )
        const role = profileRows[0]?.role
        if (!role) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

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

        return NextResponse.json({ role, permissions })
    } catch (err: any) {
        console.error('Error fetching rbac me:', err)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
}
