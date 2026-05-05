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

/** GET /api/owner/whatsapp-templates — list all global (platform) templates */
export async function GET() {
    const owner = await verifyOwner()
    if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('whatsapp_templates')
        .select('*')
        .is('tenant_id', null)
        .order('template_key')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

/** PUT /api/owner/whatsapp-templates — upsert multiple global templates */
export async function PUT(req: NextRequest) {
    const owner = await verifyOwner()
    if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
