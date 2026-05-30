import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return profile?.role === 'owner' ? user : null
}

export async function GET() {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const { data: config } = await supabaseAdmin.from('platform_settings').select('*').eq('key', 'finance_config').single()
        const { data: overrides } = await supabaseAdmin.from('platform_settings').select('*').eq('key', 'tenant_commissions').single()

        return NextResponse.json({ 
            config: config?.value || { platform_fee_percent: 10, min_withdrawal: 1000, tds_percent: 10, gst_percent: 18 },
            overrides: overrides?.value || {}
        })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { type, payload } = await request.json()

    try {
        if (type === 'GLOBAL_CONFIG') {
            await supabaseAdmin.from('platform_settings').upsert({
                key: 'finance_config',
                value: payload,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
        } else if (type === 'TENANT_OVERRIDE') {
            await supabaseAdmin.from('platform_settings').upsert({
                key: 'tenant_commissions',
                value: payload,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
