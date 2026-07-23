import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/stages — Get all pipeline stages */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('crm_pipeline_stages')
        .select('*')
        .order('order_index', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to load stages' }, { status: 500 })

    return NextResponse.json({ stages: data ?? [] })
}

/** POST /api/owner/crm/stages — Create a custom pipeline stage */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, color, icon, probability, is_won, is_lost } = body

    if (!name) return NextResponse.json({ error: 'Stage name is required' }, { status: 400 })

    // Get max order_index
    const { data: maxRow } = await supabaseAdmin
        .from('crm_pipeline_stages')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

    const nextOrder = ((maxRow?.order_index ?? 0) as number) + 1

    const { data, error } = await supabaseAdmin
        .from('crm_pipeline_stages')
        .insert({ name, color: color || '#3B82F6', icon, probability: probability ?? 0, is_won: is_won || false, is_lost: is_lost || false, order_index: nextOrder })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 })

    return NextResponse.json({ stage: data }, { status: 201 })
}

/** PATCH /api/owner/crm/stages — Reorder stages (array of {id, order_index}) */
export async function PATCH(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { stages } = body  // [{ id, order_index, name, color, probability }]

    if (!Array.isArray(stages)) return NextResponse.json({ error: 'stages array required' }, { status: 400 })

    const updates = stages.map(s =>
        supabaseAdmin.from('crm_pipeline_stages').update({
            order_index: s.order_index,
            ...(s.name && { name: s.name }),
            ...(s.color && { color: s.color }),
            ...(s.probability !== undefined && { probability: s.probability }),
        }).eq('id', s.id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
}
