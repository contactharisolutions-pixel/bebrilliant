import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/whatsapp-templates — list all global (platform) templates */
export async function GET() {
    const user = await verifyPlatformAccess('automation.manage')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('whatsapp_templates')
        .select('*')
        .is('tenant_id', null)
        .order('template_key')

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json(data)
}

/** PUT /api/owner/whatsapp-templates — upsert multiple global templates */
export async function PUT(req: NextRequest) {
    const user = await verifyPlatformAccess('automation.manage')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const templates = await req.json() as Array<{
        template_key: string; template_text: string; is_active: boolean
    }>

    if (!Array.isArray(templates)) {
        return NextResponse.json({ error: 'Expected an array of templates' }, { status: 400 })
    }

    const rows = templates.map(t => ({
        tenant_id:     null,
        template_key:  t.template_key,
        template_text: t.template_text,
        is_active:     t.is_active ?? true,
        updated_at:    new Date().toISOString(),
    }))

    const { error } = await supabaseAdmin
        .from('whatsapp_templates')
        .upsert(rows, { onConflict: 'tenant_id,template_key' })

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ success: true })
}

