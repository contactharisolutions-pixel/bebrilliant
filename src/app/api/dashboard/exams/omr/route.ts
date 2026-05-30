import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const examId = request.nextUrl.searchParams.get('examId')
    if (!examId) return NextResponse.json({ error: 'Exam ID Required' }, { status: 400 })

    try {
        const { data: sheets, error } = await supabaseAdmin
            .from('omr_sheets')
            .select('*')
            .eq('exam_id', examId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json({ sheets })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    // Already implemented CREATE_EXAM in a previous turn or assumed existing
    // But I'll provide it here for completeness if needed
    const body = await request.json()
    const { action, payload } = body
    if (action === 'CREATE_EXAM') {
        const { data, error } = await supabaseAdmin.from('omr_exams').insert([payload]).select().single()
        if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        return NextResponse.json({ exam: data })
    }
    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 })
}
