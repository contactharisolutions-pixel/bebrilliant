import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return (p?.role === 'owner' || p?.role === 'admin') ? user : null
}

export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin.from('platform_settings').select('key, value, updated_at')
    if (error && error.code === '42P01') {
        // Table doesn't exist yet, return defaults safely
        return NextResponse.json([
            { key: 'general', value: { platform_name: 'BrightBoard Enterprise', support_email: 'support@brightboard.io', timezone: 'Asia/Kolkata', maintenance_mode: false } },
            { key: 'security', value: { require_2fa_admins: true, session_timeout_mins: 120, max_login_attempts: 5, password_policy: 'strict' } },
            { key: 'integrations', value: { stripe_public: 'pk_test_...', openai_model: 'gpt-4o', sendgrid_active: true, zoom_active: false } },
            { key: 'billing', value: { default_currency: 'INR', trial_days: 14, tax_rate: 18, invoice_prefix: 'BB-' } },
        ])
    } else if (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { key, value } = body

    if (!key || !value) return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })

    const { data, error } = await supabaseAdmin
        .from('platform_settings')
        .update({ value, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq('key', key)
        .select()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ success: true, count: data.length })
}
