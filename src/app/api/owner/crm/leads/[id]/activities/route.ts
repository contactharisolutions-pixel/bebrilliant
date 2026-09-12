import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/leads/[id]/activities — Get activity log for a lead */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const { data, error } = await supabaseAdmin
        .from('lead_activities')
        .select('*, created_by_profile:created_by(id, first_name, last_name, email, role)')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Failed to load activities' }, { status: 500 })

    const formatted = (data ?? []).map((r: any) => ({
        ...r,
        content: r.content || r.notes || '',
        notes: r.notes || r.content || '',
    }))

    return NextResponse.json({ activities: formatted })
}

/** POST /api/owner/crm/leads/[id]/activities — Log a new activity / note */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const body = await request.json()
    const { type, content, metadata } = body
    const noteText = (content || body.notes || '').trim()

    const VALID_TYPES = [
        'call', 'email', 'note', 'meeting', 'status_change', 
        'stage_change', 'assignment', 'insight', 'urgent', 'requirement'
    ]
    if (!type || !VALID_TYPES.includes(type)) {
        return NextResponse.json({ error: 'Valid activity type is required' }, { status: 400 })
    }

    if (!noteText && ['note', 'insight', 'urgent', 'requirement'].includes(type)) {
        return NextResponse.json({ error: 'Note content cannot be empty' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('lead_activities')
        .insert({ 
            lead_id: id, 
            type, 
            content: noteText, 
            notes: noteText, 
            metadata: metadata || {}, 
            created_by: user.id 
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 })

    return NextResponse.json({ activity: data }, { status: 201 })
}
