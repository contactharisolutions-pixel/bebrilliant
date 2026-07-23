import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import crypto from 'crypto'

const mapTypeToDb = (type: string) => {
    switch (type) {
        case 'hero': return 'Hero banner'
        case 'features': return 'Product slider'
        case 'pricing': return 'Offer banner'
        case 'faq': return 'Text block'
        case 'cta': return 'Text block'
        default: return 'Text block'
    }
}

const mapDbToType = (dbType: string, contentJson: any) => {
    if (dbType === 'Hero banner') return 'hero'
    if (dbType === 'Product slider') return 'features'
    if (dbType === 'Offer banner') return 'pricing'
    if (dbType === 'Text block') {
        if (contentJson && contentJson.list) return 'faq'
        return 'cta'
    }
    return 'hero'
}

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('cms.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: pages } = await supabaseAdmin
        .from('cms_pages')
        .select('*')
        .order('created_at', { ascending: false })

    const { data: palettes } = await supabaseAdmin.from('theme_palettes').select('*').order('created_at', { ascending: false })

    const { data: branding } = await supabaseAdmin.from('tenant_branding')
        .select('*, tenants(name, type, is_active)')
        .order('created_at', { ascending: false })

    const { data: demos } = await supabaseAdmin.from('demo_requests').select('*').order('created_at', { ascending: false })

    return NextResponse.json({
        pages: pages || [],
        palettes: palettes || [],
        branding: branding || [],
        demos: demos || []
    })
}

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('cms.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'CREATE_PAGE') {
            const pageId = crypto.randomUUID()
            const { data, error } = await supabaseAdmin.from('cms_pages').insert([{
                page_id: pageId,
                page_name: payload.page_name,
                slug: payload.slug,
                page_type: 'landing', // Matches check constraint
                active_status: payload.is_published ?? true,
                meta_title: payload.page_name,
                meta_description: `BeBrilliant platform page: ${payload.page_name}`
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'TOGGLE_PAGE') {
            const { data, error } = await supabaseAdmin
                .from('cms_pages')
                .update({ active_status: payload.is_published })
                .eq('page_id', payload.id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_PAGE') {
            await supabaseAdmin.from('cms_sections').delete().eq('page_id', payload.id)
            const { error } = await supabaseAdmin.from('cms_pages').delete().eq('page_id', payload.id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'GET_PAGE_SECTIONS') {
            const { data, error } = await supabaseAdmin
                .from('cms_sections')
                .select('*')
                .eq('page_id', payload.page_id)
                .order('position', { ascending: true })
            if (error) throw error

            const mappedSections = (data || []).map((s: any) => ({
                section_id: s.section_id,
                page_id: s.page_id,
                section_type: mapDbToType(s.section_type, s.content_json),
                position: s.position,
                content_json: s.content_json
            }))

            return NextResponse.json({ sections: mappedSections })
        }

        if (action === 'UPDATE_PAGE_SECTIONS') {
            const { page_id, sections } = payload
            await supabaseAdmin.from('cms_sections').delete().eq('page_id', page_id)

            if (sections && sections.length > 0) {
                const rowsToInsert = sections.map((s: any, idx: number) => ({
                    section_id: s.section_id.startsWith('new-') ? crypto.randomUUID() : s.section_id,
                    page_id,
                    section_type: mapTypeToDb(s.section_type),
                    position: idx + 1,
                    content_json: s.content_json || {}
                }))
                
                const { error: insErr } = await supabaseAdmin.from('cms_sections').insert(rowsToInsert)
                if (insErr) throw insErr
            }
            
            return NextResponse.json({ success: true })
        }

        if (action === 'UPDATE_PAGE_SEO') {
            const { page_id, meta_title, meta_description, keywords } = payload
            const { data, error } = await supabaseAdmin
                .from('cms_pages')
                .update({ meta_title, meta_description, keywords })
                .eq('page_id', page_id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
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
        console.error('CMS Admin POST Action Failed:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
