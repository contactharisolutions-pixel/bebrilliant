import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/sales/templates - List global email templates */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .is('tenant_id', null)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ templates: data ?? [] })
}

/** POST /api/owner/sales/templates - Create global email template */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, subject, body } = await request.json()
    if (!name || !subject || !body) return NextResponse.json({ error: 'name, subject and body are required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('email_templates')
        .insert({ name, subject, body, tenant_id: null })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ template: data }, { status: 201 })
}

/** PUT /api/owner/sales/templates - Update global email template */
export async function PUT(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, name, subject, body } = await request.json()
    if (!id || !name || !subject || !body) return NextResponse.json({ error: 'id, name, subject and body are required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('email_templates')
        .update({ name, subject, body, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ template: data })
}

/** DELETE /api/owner/sales/templates - Delete global email template */
export async function DELETE(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })

    const { error } = await supabaseAdmin
        .from('email_templates')
        .delete()
        .eq('id', id)

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ success: true })
}

