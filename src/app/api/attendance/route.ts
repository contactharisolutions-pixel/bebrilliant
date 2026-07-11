import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function POST(request: NextRequest) {
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
        const body = await request.json()
        const { records, date } = body

        if (!records || !Array.isArray(records) || !date) {
            return NextResponse.json({ error: 'Invalid attendance parameters' }, { status: 400 })
        }

        // Batch upsert using transactions or sequential queries
        await Promise.all(
            records.map(r => 
                query(
                    `INSERT INTO public.attendance_logs (tenant_id, student_id, date, status, recorded_by)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (student_id, date)
                     DO UPDATE SET status = EXCLUDED.status, recorded_by = EXCLUDED.recorded_by`,
                    [tenantId, r.student_id, date, r.status, decoded.id]
                )
            )
        )

        return NextResponse.json({ success: true, message: 'Attendance records registered successfully' })
    } catch (e: any) {
        console.error('API /attendance error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
