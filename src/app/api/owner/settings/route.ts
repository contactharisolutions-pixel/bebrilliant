import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

const DEFAULTS = [
    { 
        key: 'general', 
        value: { 
            platform_name: 'BeBrilliant Pro', 
            support_email: 'support@bebrilliant.io', 
            support_phone: '+91 98765 43210',
            gst_no: '27AAAAA0000A1Z5',
            business_address: 'Level 5, Institutional Tower, Cyber City, Mumbai, Maharashtra 400051',
            date_format: 'DD/MM/YYYY',
            timezone: 'Asia/Kolkata' 
        } 
    },
    { key: 'security', value: { require_2fa_admins: false, session_timeout_mins: 120, max_login_attempts: 5, password_policy: 'medium' } },
    {
        key: 'integrations', value: {
            razorpay_env: 'test',
            razorpay_test_key_id: 'rzp_test_...',
            razorpay_test_key_secret: '',
            razorpay_live_key_id: 'rzp_live_...',
            razorpay_live_key_secret: '',
            openai_model: 'gpt-4o',
            smtp_host: 'smtp.mailtrap.io',
            smtp_port: 587,
            smtp_user: '',
            smtp_pass: '',
            smtp_from: 'noreply@bebrilliant.in',
            twilio_sid: 'AC...',
            twilio_token: '',
            twilio_whatsapp_number: 'whatsapp:+14155238886',
            zoom_active: false
        }
    },
    { key: 'billing', value: { default_currency: 'INR', trial_days: 14, tax_rate: 18, invoice_prefix: 'BB-' } },
    { key: 'maintenance', value: { maintenance_mode: false, maintenance_message: 'System is undergoing scheduled maintenance.' } }
]

/** GET /api/owner/settings — Load all platform settings (Auto-seed if empty) */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        let { data, error } = await supabaseAdmin.from('platform_settings').select('key, value, updated_at')

        if (error) {
            if (error.code === '42P01') {
                return NextResponse.json(DEFAULTS)
            }
            throw error
        }

        // Seeding mechanism: if table exists but is empty, seed defaults
        if (!data || data.length === 0) {
            const seedData = DEFAULTS.map(d => ({
                key: d.key,
                value: d.value,
                updated_at: new Date().toISOString()
            }))

            const { data: inserted, error: insertError } = await supabaseAdmin
                .from('platform_settings')
                .insert(seedData)
                .select('key, value, updated_at')

            if (insertError) throw insertError
            data = inserted
        }

        return NextResponse.json(data ?? [])
    } catch (e: any) {
        console.error('Settings GET failure:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** PATCH /api/owner/settings — Upsert specific settings key value */
export async function PATCH(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { key, value } = body

        if (!key || !value) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })
        }

        // Perform upsert on conflict of 'key'
        const { data, error } = await supabaseAdmin
            .from('platform_settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            }, { onConflict: 'key' })
            .select()

        if (error) throw error

        return NextResponse.json({ success: true, count: data?.length ?? 1 })
    } catch (e: any) {
        console.error('Settings PATCH failure:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
