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

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; tenant_id: string }
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (decoded.role !== 'student' && decoded.role !== 'parent') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const studentId = decoded.id

        // Query transactions
        const { rows } = await query(
            `SELECT id, credit_type, txn_type, amount, balance_after, source, notes, created_at
             FROM public.wallet_transactions
             WHERE student_id = $1
             ORDER BY created_at DESC`,
            [studentId]
        )

        return NextResponse.json(rows || [])
    } catch (e: any) {
        console.error('API /student/wallet-transactions error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
