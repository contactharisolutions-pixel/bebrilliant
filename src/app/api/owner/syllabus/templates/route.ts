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

/** GET /api/owner/syllabus/templates - List global exam templates */
export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data, error } = await supabaseAdmin
        .from('exam_templates').select('*').is('tenant_id', null).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ templates: data ?? [] })
}

/** POST /api/owner/syllabus/templates - Create a global master exam template */
export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, structure } = await request.json()
    if (!name || !structure) return NextResponse.json({ error: 'name and structure are required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('exam_templates')
        .insert({ name, structure, tenant_id: null })
        .select().single()
    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ template: data }, { status: 201 })
}
