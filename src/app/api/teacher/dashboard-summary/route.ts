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

        // Verify role is educator/staff
        if (!['teacher', 'tenant_admin', 'owner'].includes(decoded.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const tenantId = decoded.tenant_id

        // 1. Total Students
        const { rows: studentRows } = await query(
            `SELECT COUNT(*)::int as count FROM public.user_profiles 
             WHERE tenant_id = $1 AND role = 'student' AND is_active = true`,
            [tenantId]
        )
        const studentsCount = studentRows[0]?.count || 0

        // 2. Total Exams
        const { rows: examRows } = await query(
            `SELECT COUNT(*)::int as count FROM public.exams 
             WHERE tenant_id = $1`,
            [tenantId]
        )
        const examsCount = examRows[0]?.count || 0

        // 3. Live classes scheduled for today
        const { rows: liveRows } = await query(
            `SELECT COUNT(*)::int as count FROM public.live_classes 
             WHERE tenant_id = $1 AND scheduled_at::date = CURRENT_DATE`,
            [tenantId]
        )
        const liveCount = liveRows[0]?.count || 0

        // 4. Pending submissions needing grading
        const { rows: attemptRows } = await query(
            `SELECT COUNT(*)::int as count FROM public.exam_attempts ea
             JOIN public.exams e ON ea.exam_id = e.id
             WHERE e.tenant_id = $1 AND ea.status = 'submitted'`,
            [tenantId]
        )
        const pendingCount = attemptRows[0]?.count || 0

        return NextResponse.json({
            students: studentsCount,
            exams: examsCount,
            liveClasses: liveCount,
            pendingSubmissions: pendingCount
        })
    } catch (e: any) {
        console.error('API /teacher/dashboard-summary error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
