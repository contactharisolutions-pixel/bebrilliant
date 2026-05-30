import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabaseAdmin.from('user_profiles').select('tenant_id').eq('id', user.id).single()
        
        if (!profile?.tenant_id) {
            return NextResponse.json({ years: [] })
        }

        const { data: years, error } = await supabaseAdmin
            .from('academic_years')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .order('start_date', { ascending: false })

        if (error) throw error
        return NextResponse.json({ years: years || [] })
    } catch (error: any) {
        console.error('Academic Year GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, start_date, end_date, make_active } = body

        const { data: profile } = await supabaseAdmin.from('user_profiles').select('tenant_id, role').eq('id', user.id).single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (make_active) {
            await supabaseAdmin.from('academic_years').update({ is_active: false }).eq('tenant_id', profile.tenant_id)
        }

        const { data: year, error } = await supabaseAdmin
            .from('academic_years')
            .insert({ tenant_id: profile.tenant_id, name, start_date, end_date, is_active: !!make_active })
            .select().single()

        if (error) throw error
        return NextResponse.json({ year })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, name, start_date, end_date, is_active } = body

        const { data: profile } = await supabaseAdmin.from('user_profiles').select('tenant_id, role').eq('id', user.id).single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (is_active) {
            await supabaseAdmin.from('academic_years').update({ is_active: false }).eq('tenant_id', profile.tenant_id)
        }

        const { error } = await supabaseAdmin
            .from('academic_years')
            .update({ name, start_date, end_date, is_active })
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
