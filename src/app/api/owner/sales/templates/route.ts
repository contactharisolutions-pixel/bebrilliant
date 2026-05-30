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

/** GET /api/owner/sales/templates - List global email templates */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
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
    const user = await verifyOwner()
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
