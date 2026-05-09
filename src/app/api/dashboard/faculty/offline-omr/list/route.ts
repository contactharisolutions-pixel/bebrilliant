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

        const { data: exams, error } = await supabaseAdmin
            .from('offline_exams')
            .select('*, subjects(name)')
            .eq('tenant_id', profile?.tenant_id)
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json({ exams: exams || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
