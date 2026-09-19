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

        // Resolve teacher's assigned classes for scoping
        let assignedClasses: string[] = []
        if (decoded.role === 'teacher') {
            const profileRes = await query(
                `SELECT metadata FROM public.user_profiles WHERE id = $1`,
                [decoded.id]
            )
            if (profileRes.rows[0]?.metadata?.assigned_classes) {
                assignedClasses = profileRes.rows[0].metadata.assigned_classes
            }
        }

        // 1. Fetch performance stats for the last 5 exams using online_exams (active table)
        let examPerfQuery = `
            SELECT oe.id, oe.title AS name,
                    COALESCE(AVG(COALESCE(oea.marks_obtained, oea.score, 0)), 0)::float as avg_score,
                    COALESCE(
                        COUNT(CASE WHEN COALESCE(oea.marks_obtained, oea.score, 0) >= (COALESCE(oe.total_marks, 100) * 0.4) THEN 1 END)::float
                        / NULLIF(COUNT(oea.id), 0) * 100, 0
                    )::float as pass_rate
             FROM public.online_exams oe
             LEFT JOIN public.online_exam_attempts oea ON oea.exam_id = oe.id 
                 AND oea.status IN ('submitted', 'completed', 'evaluated')
             WHERE oe.tenant_id = $1`
        const examPerfParams: any[] = [tenantId]

        if (assignedClasses.length > 0) {
            const tokens = assignedClasses.map(c => c.replace(/[^0-9]/g, '')).filter(Boolean)
            examPerfParams.push(assignedClasses)
            examPerfParams.push(tokens)
            examPerfQuery += ` AND (
                oe.class_name = ANY($${examPerfParams.length - 1})
                OR regexp_replace(COALESCE(oe.class_name, ''), '[^0-9]', '', 'g') = ANY($${examPerfParams.length})
            )`
        }

        examPerfQuery += `
             GROUP BY oe.id, oe.title, oe.created_at
             ORDER BY oe.created_at DESC
             LIMIT 5`

        const { rows: examPerf } = await query(examPerfQuery, examPerfParams)

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
