import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { class_id, name, capacity } = body

        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile || !['tenant_admin', 'owner'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { data: div, error } = await supabaseAdmin
            .from('divisions')
            .insert({
                tenant_id: profile.tenant_id,
                class_id,
                name,
                capacity: capacity || 40
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ division: div })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
