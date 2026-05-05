import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile) return null

    // Platform Owner bypass
    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true }
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        if (is_owner && tenant_id === 'platform') {
            // Fetch from global platform_settings
            const { data } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'cms_config').maybeSingle()
            const global_cms = data?.value || {
                hero_title: 'BrightBoard: Digital Infrastructure for Education',
                hero_desc: 'Deploy a completely white-labeled, AI-powered ERP across your entire institute network.',
                primary_cta: 'Request Platform Demo',
                footer_text: '© 2026 BrightBoard Enterprise. All Rights Reserved.',
                show_marketplace: true,
                show_teacher_profiles: true,
                pages: [
                    { name: 'Core Platform', status: 'published' },
                    { name: 'Architecture', status: 'published' },
                    { name: 'Enterprise Pricing', status: 'published' }
                ]
            }
            return NextResponse.json(global_cms)
        }

        // 1. Fetch Tenant CMS Overrides
        const { data: tenant } = await supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single()
        const cms_config = tenant?.settings?.cms || {
            hero_title: 'Welcome to our Learning Hub',
            hero_desc: 'Master your future with our specialized coaching programs and AI-driven exams.',
            primary_cta: 'Enroll Now',
            footer_text: '© 2026 Your Institute. All Rights Reserved.',
            show_marketplace: true,
            show_teacher_profiles: true,
            pages: [
                { name: 'Home', status: 'published' },
                { name: 'Courses', status: 'published' },
                { name: 'About Us', status: 'draft' }
            ]
        }

        return NextResponse.json(cms_config)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'SAVE_CMS') {
            if (is_owner && tenant_id === 'platform') {
                const { error } = await supabaseAdmin.from('platform_settings').upsert({
                    key: 'cms_config',
                    value: payload,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' })
                if (error) throw error
                return NextResponse.json({ success: true })
            }

            const { data: tenant } = await supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single()
            const newSettings = { ...tenant?.settings, cms: payload }

            const { error } = await supabaseAdmin.from('tenants').update({ settings: newSettings }).eq('id', tenant_id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid routing sequence' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
