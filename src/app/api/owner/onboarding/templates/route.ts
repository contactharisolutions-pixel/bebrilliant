import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/onboarding/templates — List all templates */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('onboarding_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })

    return NextResponse.json({ templates: data ?? [] })
}

/** POST /api/owner/onboarding/templates — Create a new template */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, description, tasks } = body

    if (!name) return NextResponse.json({ error: 'Template name is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('onboarding_templates')
        .insert({ name, description, tasks: tasks || [], created_by: user.id })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })

    return NextResponse.json({ template: data }, { status: 201 })
}

/** PATCH /api/owner/onboarding/templates — Update a template */
export async function PATCH(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { id, name, description, tasks, is_default } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('onboarding_templates')
        .update({ name, description, tasks, is_default, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })

    return NextResponse.json({ template: data })
}
