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

        // 1. Fetch child attendance rate
        const { rows: attRows } = await query(
            `SELECT 
                COUNT(CASE WHEN status = 'present' THEN 1 END)::float / NULLIF(COUNT(id), 0) * 100 as rate,
                COUNT(CASE WHEN status = 'absent' THEN 1 END)::int as absent_count
             FROM public.attendance_logs
             WHERE student_id = $1`,
            [childId]
        )
        const attendanceRate = attRows[0]?.rate || 100
        const absentCount = attRows[0]?.absent_count || 0

        // 2. Fetch completed exams and average grade percentage
        const { rows: perfRows } = await query(
            `SELECT COUNT(id)::int as completed, 
                    COALESCE(AVG(percentage), 0)::float as avg_score 
             FROM public.student_performance 
             WHERE student_id = $1`,
            [childId]
        )
        const completedExams = perfRows[0]?.completed || 0
        const avgScore = perfRows[0]?.avg_score || 0

        // 3. Fetch recent scores list
        const { rows: scoreRows } = await query(
            `SELECT sp.id, sp.marks_obtained, sp.total_marks, sp.percentage, sp.exam_date, sp.subject,
                    e.name as exam_name
             FROM public.student_performance sp
             JOIN public.exams e ON sp.exam_id = e.id
             WHERE sp.student_id = $1
             ORDER BY sp.exam_date DESC
             LIMIT 5`,
            [childId]
        )

        // 4. Fetch daily attendance history for calendar tracking
        const { rows: attLogs } = await query(
            `SELECT date::text, status
             FROM public.attendance_logs
             WHERE student_id = $1
             ORDER BY date DESC
             LIMIT 30`,
            [childId]
        )

        return NextResponse.json({
            attendanceRate: Math.round(attendanceRate),
            absentCount,
            avgScore: Math.round(avgScore),
            completedExams,
            recentScores: scoreRows || [],
            attendanceLogs: attLogs || []
        })
    } catch (e: any) {
        console.error('API /parent/child-summary error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
