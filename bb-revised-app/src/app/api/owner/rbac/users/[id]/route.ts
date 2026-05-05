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

/** PATCH /api/owner/rbac/users/[id] - Update user role or active status */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const { data, error } = await supabaseAdmin
        .from('user_profiles').update(body).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ user: data })
}
