import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const childId = searchParams.get('childId')
        if (!childId) return NextResponse.json({ error: 'Child ID is required' }, { status: 400 })

        const cookieStore = await cookies()
        const token = cookieStore.get('bb_token')?.value || request.headers.get('authorization')?.split(' ')[1]
        
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; tenant_id: string }
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (decoded.role !== 'parent') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Safety check: ensure child is linked to this parent
        const { rows: safetyRows } = await query(
            `SELECT id FROM public.user_profiles 
             WHERE id = $1 AND parent_login_id = $2`,
            [childId, decoded.id]
        )
        if (safetyRows.length === 0) {
            return NextResponse.json({ error: 'Access denied: child not linked to this parent' }, { status: 403 })
        }

        // Query payments associated with child (user_id = childId) or parent (user_id = parentId) in this tenant
        const { rows: paymentRows } = await query(
            `SELECT id, type, amount::float, status, razorpay_payment_id, created_at
             FROM public.payments
             WHERE (user_id = $1 OR user_id = $2) AND tenant_id = $3
             ORDER BY created_at DESC`,
            [childId, decoded.id, decoded.tenant_id]
        )

        return NextResponse.json(paymentRows || [])
    } catch (e: any) {
        console.error('API /parent/child-payments error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
