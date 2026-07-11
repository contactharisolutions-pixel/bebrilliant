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
        if (!decoded || !decoded.id || !decoded.tenant_id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (decoded.role !== 'student' && decoded.role !== 'parent') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const studentId = decoded.id
        const tenantId = decoded.tenant_id

        // 1. Fetch student wallet balance
        const { rows: walletRows } = await query(
            `SELECT COALESCE(total_balance, 0)::float as balance 
             FROM public.student_wallets 
             WHERE student_id = $1`,
            [studentId]
        )
        const balance = walletRows[0]?.balance || 0

        // 2. Fetch average test score and completed exams count
        const { rows: perfRows } = await query(
            `SELECT COUNT(id)::int as completed, 
                    COALESCE(AVG(percentage), 0)::float as avg_score 
             FROM public.student_performance 
             WHERE student_id = $1`,
            [studentId]
        )
        const completedExams = perfRows[0]?.completed || 0
        const avgScore = perfRows[0]?.avg_score || 0

        // 3. Fetch scheduled live classes today
        const { rows: liveRows } = await query(
            `SELECT COUNT(id)::int as count 
             FROM public.live_classes 
             WHERE tenant_id = $1 AND scheduled_at::date = CURRENT_DATE`,
            [tenantId]
        )
        const liveToday = liveRows[0]?.count || 0

        return NextResponse.json({
            credits: balance,
            avgScore: Math.round(avgScore),
            completedExams,
            liveToday
        })
    } catch (e: any) {
        console.error('API /student/dashboard-summary error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
