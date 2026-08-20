import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/leads/[id] - Retrieve single lead details */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('owner_leads')
        .select('*, demos(*)')
        .eq('id', id)
        .single()

    if (error) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    return NextResponse.json({ lead: data })
}

/** PATCH /api/owner/crm/leads/[id] - Update lead status / fields */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const updateData: any = { ...body, updated_at: new Date().toISOString() }
    if (body.assigned_to !== undefined) {
        updateData.allocated_at = body.assigned_to ? new Date().toISOString() : null
    }

    const { data, error } = await supabaseAdmin
        .from('owner_leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ lead: data })
}

/** DELETE /api/owner/crm/leads/[id] - Remove lead */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabaseAdmin
        .from('owner_leads').delete().eq('id', id)

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ success: true })
}

