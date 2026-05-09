import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/** PATCH /api/owner/tenants/[id] — Toggle active/suspend, update fields */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles').select('role').eq('id', user.id).single()

        if (profile?.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()

        const { data, error } = await supabaseAdmin
            .from('tenants')
            .update(body)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ tenant: data })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** DELETE /api/owner/tenants/[id] — Hard delete (use carefully) */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabaseAdmin
            .from('user_profiles').select('role').eq('id', user.id).single()

        if (profile?.role !== 'owner') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params

        const { error } = await supabaseAdmin
            .from('tenants')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
