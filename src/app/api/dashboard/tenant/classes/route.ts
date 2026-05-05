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

        const academic_year_id = request.nextUrl.searchParams.get('academic_year_id')
        
        let query = supabaseAdmin
            .from('classes')
            .select('*, divisions(*)')
            .eq('tenant_id', profile?.tenant_id)

        if (academic_year_id) {
            query = query.eq('academic_year_id', academic_year_id)
        }

        const { data: classes, error } = await query.order('sort_order', { ascending: true })

        if (error) throw error
        return NextResponse.json({ classes: classes || [] })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, code, academic_year_id, sort_order } = body

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { data: cls, error } = await supabaseAdmin
            .from('classes')
            .insert({
                tenant_id: profile.tenant_id,
                academic_year_id,
                name,
                code,
                sort_order: sort_order || 0
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ class: cls })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
