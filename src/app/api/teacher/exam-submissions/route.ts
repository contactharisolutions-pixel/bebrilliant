import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const examId = searchParams.get('examId')
        if (!examId) return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })

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

        // Fetch exam attempts
        const { rows } = await query(
            `SELECT ea.id, ea.status, ea.total_score, ea.start_time, ea.end_time,
                    u.first_name, u.last_name, u.email
             FROM public.exam_attempts ea
             JOIN public.user_profiles u ON ea.student_id = u.id
             WHERE ea.exam_id = $1 AND u.tenant_id = $2
             ORDER BY ea.end_time DESC NULLS LAST`,
            [examId, decoded.tenant_id]
        )

        return NextResponse.json(rows || [])
    } catch (e: any) {
        console.error('API /teacher/exam-submissions error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
