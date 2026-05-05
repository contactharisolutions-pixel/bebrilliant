import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        const { data: uploads, error } = await supabaseAdmin
            .from('answer_sheet_uploads')
            .select(`
                *,
                student:user_profiles!answer_sheet_uploads_student_id_fkey(first_name, last_name),
                exam:offline_exams(title)
            `)
            .eq('tenant_id', profile?.tenant_id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json({ uploads: uploads || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
