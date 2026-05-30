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

        const { data: subjects, error } = await supabaseAdmin
            .from('subjects')
            .select('*')
            .eq('tenant_id', profile?.tenant_id)
            .order('name')

        if (error) throw error
        return NextResponse.json({ subjects: subjects || [] })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, code, is_optional } = body

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { data: sub, error } = await supabaseAdmin
            .from('subjects')
            .insert({
                tenant_id: profile.tenant_id,
                name,
                code,
                is_optional: !!is_optional
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ subject: sub })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
