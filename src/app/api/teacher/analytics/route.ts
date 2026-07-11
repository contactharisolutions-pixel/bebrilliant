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

        if (!['teacher', 'tenant_admin', 'owner'].includes(decoded.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const tenantId = decoded.tenant_id

        // 1. Fetch performance stats for the last 5 exams in this tenant
        const { rows: examPerf } = await query(
            `SELECT e.id, e.name, 
                    COALESCE(AVG(ea.total_score), 0)::float as avg_score, 
                    COALESCE(COUNT(CASE WHEN ea.total_score >= 40 THEN 1 END)::float / NULLIF(COUNT(ea.id), 0) * 100, 0)::float as pass_rate
             FROM public.exams e
             LEFT JOIN public.exam_attempts ea ON ea.exam_id = e.id AND ea.status IN ('submitted', 'evaluated')
             WHERE e.tenant_id = $1
             GROUP BY e.id, e.name, e.created_at
             ORDER BY e.created_at DESC
             LIMIT 5`,
            [tenantId]
        )

        // 2. Fetch daily attendance trend for the last 7 days
        const { rows: attendanceTrend } = await query(
            `SELECT date::text as date,
                    COUNT(CASE WHEN status = 'present' THEN 1 END)::int as present,
                    COUNT(CASE WHEN status = 'absent' THEN 1 END)::int as absent,
                    COUNT(CASE WHEN status = 'late' THEN 1 END)::int as late
             FROM public.attendance_logs
             WHERE tenant_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
             GROUP BY date
             ORDER BY date ASC`,
            [tenantId]
        )

        return NextResponse.json({
            examPerformance: examPerf || [],
            attendanceTrend: attendanceTrend || []
        })
    } catch (e: any) {
        console.error('API /teacher/analytics error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
