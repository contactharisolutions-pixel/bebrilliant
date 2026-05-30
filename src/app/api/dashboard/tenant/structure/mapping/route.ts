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

        const type = request.nextUrl.searchParams.get('type') // 'class-subject' or 'teacher-subject'

        if (type === 'class-subject') {
            const { data: mapping } = await supabaseAdmin
                .from('class_subjects')
                .select('*, subjects(name, code)')
                .eq('tenant_id', profile?.tenant_id)
            return NextResponse.json({ mapping })
        }

        if (type === 'teacher-subject') {
            const { data: mapping } = await supabaseAdmin
                .from('teacher_subjects')
                .select('*, user_profiles!teacher_id(first_name, last_name, email), classes(name), divisions(name), subjects(name)')
                .eq('tenant_id', profile?.tenant_id)
            return NextResponse.json({ mapping })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()
        const { type, data } = body // type: 'class-subject' or 'teacher-subject'

        if (type === 'class-subject') {
            const { class_id, subject_ids } = data
            const inserts = subject_ids.map((sid: string) => ({
                tenant_id: profile.tenant_id,
                class_id,
                subject_id: sid
            }))

            const { error } = await supabaseAdmin
                .from('class_subjects')
                .upsert(inserts, { onConflict: 'class_id,subject_id' })

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (type === 'teacher-subject') {
            const { teacher_id, class_id, division_id, subject_id } = data
            const { error } = await supabaseAdmin
                .from('teacher_subjects')
                .upsert({
                    tenant_id: profile.tenant_id,
                    teacher_id,
                    class_id,
                    division_id,
                    subject_id
                }, { onConflict: 'teacher_id,class_id,division_id,subject_id' })

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
