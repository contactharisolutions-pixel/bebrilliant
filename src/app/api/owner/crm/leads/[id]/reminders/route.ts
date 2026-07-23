import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/leads/[id]/reminders — Get reminders for a lead */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const { data, error } = await supabaseAdmin
        .from('lead_reminders')
        .select('*, assigned_to_profile:assigned_to(id, first_name, last_name, email)')
        .eq('lead_id', id)
        .order('due_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to load reminders' }, { status: 500 })

    return NextResponse.json({ reminders: data ?? [] })
}

/** POST /api/owner/crm/leads/[id]/reminders — Schedule a follow-up reminder */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const body = await request.json()
    const { type, message, due_at, assigned_to } = body

    if (!due_at) return NextResponse.json({ error: 'due_at is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('lead_reminders')
        .insert({
            lead_id: id,
            type: type || 'follow_up',
            message,
            due_at,
            assigned_to: assigned_to || user.id,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })

    return NextResponse.json({ reminder: data }, { status: 201 })
}
