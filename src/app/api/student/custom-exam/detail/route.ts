import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user }, error: uErr } = await supabase.auth.getUser()
    if (uErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { data: exam, error } = await supabaseAdmin
            .from('student_custom_exams')
            .select('*')
            .eq('id', id)
            .eq('student_id', user.id)
            .single()

        if (error || !exam) return NextResponse.json({ error: 'Custom exam not found' }, { status: 404 })

        // Fetch questions
        const { data: questions } = await supabaseAdmin
            .from('student_custom_exam_questions')
            .select('*')
            .eq('exam_id', id)
            .order('id')

        // Format questions: parse options string to JSON array
        const formattedQuestions = (questions || []).map(q => {
            let parsedOptions = []
            try {
                parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            } catch (e) {
                parsedOptions = ['Option A', 'Option B', 'Option C', 'Option D']
            }
            return {
                id: q.id,
                text: q.question,
                options: parsedOptions,
                answer: q.answer,
                marks: q.marks || 1
            }
        })

        return NextResponse.json({
            ...exam,
            duration: exam.duration || 30, // Default 30 min for custom exams
            questions: formattedQuestions
        })

    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
