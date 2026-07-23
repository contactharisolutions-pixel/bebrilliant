import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params

    try {
        const { data: page, error: pageErr } = await supabaseAdmin
            .from('cms_pages')
            .select('*')
            .eq('slug', slug)
            .eq('active_status', true)
            .maybeSingle()

        if (pageErr) {
            console.error('Failed to load dynamic CMS page:', pageErr)
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
        }

        if (!page) {
            return NextResponse.json({ found: false, page: null, sections: [] })
        }

        const { data: sections, error: secErr } = await supabaseAdmin
            .from('cms_sections')
            .select('*')
            .eq('page_id', page.page_id)
            .order('position', { ascending: true })

        if (secErr) {
            console.error('Failed to load dynamic CMS page sections:', secErr)
            return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
        }

        const mappedSections = (sections || []).map((s: any) => ({
            section_id: s.section_id,
            page_id: s.page_id,
            section_type: mapDbToType(s.section_type, s.content_json),
            position: s.position,
            content_json: s.content_json
        }))

        return NextResponse.json({
            found: true,
            page: {
                page_id: page.page_id,
                page_name: page.page_name,
                slug: page.slug,
                meta_title: page.meta_title,
                meta_description: page.meta_description,
                keywords: page.keywords
            },
            sections: mappedSections
        })

    } catch (e: any) {
        console.error('Public CMS routing failed:', e)
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 })
    }
}
