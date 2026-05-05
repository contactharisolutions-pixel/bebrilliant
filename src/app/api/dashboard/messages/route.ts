import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantStaff() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role, tenant_id, metadata')
        .eq('id', user.id)
        .single()
    if (!profile) return null

    if (profile.tenant_id && ['admin', 'teacher', 'owner', 'tenant_admin'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, role: profile.role, metadata: profile.metadata }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { tenant_id, user } = session
    const url = new URL(request.url)
    const groupId = url.searchParams.get('groupId')
    const contactId = url.searchParams.get('contactId')

    try {
        if (groupId || contactId) {
            let query = supabaseAdmin
                .from('messages')
                .select('*')
                .eq('tenant_id', tenant_id)
                .order('created_at', { ascending: true })

            if (groupId) query = query.eq('group_id', groupId)
            else if (contactId) {
              query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${user.id})`)
            }

            const { data, error } = await query
            if (error && error.code !== 'PGRST116') throw error
            return NextResponse.json(data || [])
        }

        // Fetch contacts:Staff, Students, Groups
        const { data: profiles } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, role, metadata')
            .eq('tenant_id', tenant_id)
            .neq('id', user.id)

        return NextResponse.json({ profiles: profiles || [] })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { tenant_id, user } = session
    const { action, payload } = await request.json()

    try {
        if (action === 'SEND_MESSAGE') {
            const { content, group_id, recipient_id, is_bulk, msg_type } = payload
            const { error } = await supabaseAdmin
                .from('messages')
                .insert([{
                    tenant_id,
                    sender_id: user.id,
                    content,
                    group_id,
                    recipient_id,
                    is_bulk: is_bulk || false,
                    msg_type: msg_type || 'text'
                }])
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
