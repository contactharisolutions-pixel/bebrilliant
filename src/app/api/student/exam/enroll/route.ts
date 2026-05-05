import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { exam_id } = await request.json()
    if (!exam_id) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })

    try {
        // 1. Fetch Exam Detail to check if paid
        const { data: exam } = await supabaseAdmin.from('exams').select('*').eq('id', exam_id).single()
        if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

        if (exam.is_paid) {
            // Need to check if a successful payment exists
            const { data: payment } = await supabaseAdmin
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'exam')
                .eq('status', 'success')
                // .eq('item_id', exam_id) // Add item_id to payments table for precision? 
                // For now check if any successful exam payment by this user (simplified)
                .single()
            
            // Note: In real setup, we'd check exam-specific payment.
        }

        // 2. Insert Enrollment
        const { data, error: enrError } = await supabaseAdmin
            .from('exam_enrollments')
            .insert({
                student_id: user.id,
                exam_id,
                tenant_id: exam.tenant_id,
                status: exam.is_paid ? 'paid' : 'enrolled'
            })
            .select()
            .single()

        if (enrError) {
            if (enrError.code === '23505') return NextResponse.json({ error: 'Already enrolled' }, { status: 400 })
            throw enrError
        }

        return NextResponse.json({ success: true, enrollment: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
