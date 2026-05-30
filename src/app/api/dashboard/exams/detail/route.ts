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
            .from('exams')
            .select('*, exam_config(*)')
            .eq('id', id)
            .single()

        if (error || !exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // Parse meta
        let meta: any = {}
        try { meta = JSON.parse(exam.description || '{}') } catch (e) {}

        // Construct response matching what the frontend expects
        // Frontend uses: exData.name, exData.duration, exData.questions
        return NextResponse.json({
            ...exam,
            duration: meta.duration || exam.duration || 60,
            marks: meta.marks || 100,
            questions: meta.questions || []
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
