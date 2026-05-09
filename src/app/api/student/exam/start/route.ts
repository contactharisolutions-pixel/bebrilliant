import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { exam_id } = await request.json()
    if (!exam_id) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })

    // 1. Verify access & check if already submitted
    const { data: existing } = await supabaseAdmin
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', exam_id)
        .eq('student_id', user.id)
        .eq('status', 'submitted')
        .single()
    
    if (existing) return NextResponse.json({ error: 'Exam already completed' }, { status: 400 })

    // 2. Fetch or Create Attempt
    const { data: draft } = await supabaseAdmin
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', exam_id)
        .eq('student_id', user.id)
        .eq('status', 'in_progress')
        .single()
    
    if (draft) {
        return NextResponse.json({ attempt: draft })
    }

    // New Attempt
    const { data: newAttempt, error: createError } = await supabaseAdmin
        .from('exam_attempts')
        .insert({
            student_id: user.id,
            exam_id: exam_id,
            status: 'in_progress',
            start_time: new Date().toISOString()
        })
        .select()
        .single()

    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

    return NextResponse.json({ attempt: newAttempt })
}
