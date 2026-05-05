import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { title, class_id, division_id, subject_id, total_questions, shuffle_questions, shuffle_options, selected_questions } = body

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role, current_academic_year_id')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner', 'teacher'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 1. Create the Offline Exam record
        const { data: exam, error: examError } = await supabaseAdmin
            .from('offline_exams')
            .insert({
                tenant_id: profile.tenant_id,
                academic_year_id: profile.current_academic_year_id,
                title,
                class_id,
                division_id: division_id || null,
                subject_id,
                total_questions,
                shuffle_questions: !!shuffle_questions,
                shuffle_options: !!shuffle_options,
                created_by: user.id,
                status: 'published'
            })
            .select()
            .single()

        if (examError || !exam) throw examError

        // 2. Insert Questions if selected
        if (selected_questions && selected_questions.length > 0) {
            const questionInserts = selected_questions.map((qid: string, idx: number) => ({
                exam_id: exam.id,
                question_id: qid,
                question_order: idx + 1
            }))
            
            const { error: qError } = await supabaseAdmin
                .from('offline_exam_questions')
                .insert(questionInserts)
                
            if (qError) throw qError
        }

        return NextResponse.json({ success: true, exam })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
