import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

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

        // 1. Get Exam Details
        const { data: exam } = await supabaseAdmin
            .from('offline_exams')
            .select('*')
            .eq('id', exam_id)
            .single()

        if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

        // 2. Fetch Students for the class/division
        let query = supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, metadata')
            .eq('tenant_id', profile.tenant_id)
            .eq('role', 'student')
            .eq('is_active', true)
        
        // This relies on class mapping being stored in metadata, or we can look up academic records.
        // For robustness, in a real system we'd join student_academic_records. We'll simulate fetching eligible students.

        const { data: students, error: studErr } = await query
        if (studErr) throw studErr

        // 3. Generate OMR Sheet metadata per student
        const generatedSheets = []
        let currentSeat = 1001

        for (const student of (students || [])) {
            // Check if already generated
            const { data: existing } = await supabaseAdmin
                .from('omr_sheets')
                .select('id')
                .eq('exam_id', exam.id)
                .eq('student_id', student.id)
                .single()

            if (!existing) {
                const sheetId = crypto.randomUUID()
                const seatNumber = `${currentSeat++}`
                const shuffleSeed = exam.shuffle_questions ? crypto.randomBytes(4).toString('hex') : null

                const { data: sheet } = await supabaseAdmin
                    .from('omr_sheets')
                    .insert({
                        id: sheetId,
                        tenant_id: profile.tenant_id,
                        exam_id: exam.id,
                        student_id: student.id,
                        seat_number: seatNumber,
                        shuffle_seed: shuffleSeed
                    })
                    .select()
                    .single()
                
                if (sheet) generatedSheets.push(sheet)
            }
        }

        return NextResponse.json({ success: true, count: generatedSheets.length, message: 'OMR Metadata generated. Ready for PDF printing.' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
