import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/onboarding/[id]/comments — Get threaded comments */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const { data, error } = await supabaseAdmin
        .from('onboarding_comments')
        .select('*, created_by_profile:created_by(id, first_name, last_name, avatar_url, role)')
        .eq('checklist_id', id)
        .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 })

    return NextResponse.json({ comments: data ?? [] })
}

/** POST /api/owner/onboarding/[id]/comments — Post a comment */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    const body = await request.json()
    const { content, parent_id, mentions } = body

    if (!content?.trim()) return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('onboarding_comments')
        .insert({
            checklist_id: id,
            content: content.trim(),
            parent_id: parent_id || null,
            mentions: mentions || [],
            created_by: user.id,
        })
        .select('*, created_by_profile:created_by(id, first_name, last_name, avatar_url, role)')
        .single()

    if (error) return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })

    // Log timeline event
    await supabaseAdmin.from('onboarding_timeline_events').insert({
        checklist_id: id,
        type: 'comment_added',
        payload: { comment_id: data.id, preview: content.slice(0, 100) },
        created_by: user.id,
    })

    return NextResponse.json({ comment: data }, { status: 201 })
}
