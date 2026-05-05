import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return p?.role === 'owner' ? user : null
}

export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 1. Platform Pages (tenant_id is null)
    const { data: pages } = await supabaseAdmin.from('cms_pages').select('*').is('tenant_id', null).order('created_at', { ascending: false })

    // 2. Theme Palettes
    const { data: palettes } = await supabaseAdmin.from('theme_palettes').select('*').order('created_at', { ascending: false })

    // 3. Tenant Branding (with tenant info)
    const { data: branding } = await supabaseAdmin.from('tenant_branding')
        .select('*, tenants(name, type, is_active)')
        .order('created_at', { ascending: false })

    // 4. Demo Requests
    const { data: demos } = await supabaseAdmin.from('demo_requests').select('*').order('created_at', { ascending: false })

    return NextResponse.json({
        pages: pages || [],
        palettes: palettes || [],
        branding: branding || [],
        demos: demos || []
    })
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'CREATE_PAGE') {
            const { data, error } = await supabaseAdmin.from('cms_pages').insert([{
                tenant_id: null,
                page_name: payload.page_name,
                slug: payload.slug,
                is_published: payload.is_published
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'TOGGLE_PAGE') {
            const { data, error } = await supabaseAdmin.from('cms_pages').update({ is_published: payload.is_published }).eq('id', payload.id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_PAGE') {
            const { error } = await supabaseAdmin.from('cms_pages').delete().eq('id', payload.id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'CREATE_PALETTE') {
            const { data, error } = await supabaseAdmin.from('theme_palettes').insert([{
                name: payload.name,
                primary_color: payload.primary_color,
                secondary_color: payload.secondary_color,
                background: payload.background,
                text_color: payload.text_color
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_PALETTE') {
            const { error } = await supabaseAdmin.from('theme_palettes').delete().eq('id', payload.id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'UPDATE_DEMO_STATUS') {
            const { data, error } = await supabaseAdmin.from('demo_requests').update({ status: payload.status }).eq('id', payload.id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
