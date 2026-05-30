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

export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')
    if (!tenant_id) return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('affiliate_settings')
        .select('*')
        .eq('tenant_id', tenant_id)
        .single()

    // It's okay if not found, we just return empty
    return NextResponse.json({ settings: data || null })
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')
    if (!tenant_id) return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })

    const body = await request.json()

    const { data, error } = await supabaseAdmin
        .from('affiliate_settings')
        .upsert({
            tenant_id,
            ...body,
            updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ settings: data })
}
