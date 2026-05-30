import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { exam_id } = body

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner', 'teacher'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 1. Fetch OMR Sheets already generated for this exam
        const { data: sheets } = await supabaseAdmin
            .from('omr_sheets')
            .select('id, student_id, seat_number')
            .eq('exam_id', exam_id)

        if (!sheets) return NextResponse.json({ error: 'No sheets found' }, { status: 404 })

        // 2. Map and Upsert QR metadata
        const barcodes = sheets.map(s => ({
            tenant_id: profile.tenant_id,
            exam_id,
            student_id: s.student_id,
            qr_code: `${exam_id}|${s.student_id}|${s.seat_number}`,
            barcode: s.seat_number // Simplified for now
        }))

        const { error } = await supabaseAdmin
            .from('omr_barcodes')
            .upsert(barcodes, { onConflict: 'exam_id,student_id' })

        if (error) throw error

        return NextResponse.json({ success: true, count: barcodes.length })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
