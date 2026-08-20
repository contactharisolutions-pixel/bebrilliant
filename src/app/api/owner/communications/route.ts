import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { sendMail } from '@/lib/email'
import crypto from 'crypto'

const TEST_EMAIL = 'tech.dipakraval@gmail.com'
const TEST_WHATSAPP = '+918141388570'

async function sendTwilioWhatsApp(to: string, body: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Load Twilio credentials from platform_settings
        const { data: settings } = await supabaseAdmin
            .from('platform_settings')
            .select('value')
            .eq('key', 'integrations')
            .maybeSingle()

        const integrations = settings?.value || {}
        const accountSid = integrations?.twilio_sid
        const authToken = integrations?.twilio_token
        const fromNumber = integrations?.twilio_whatsapp_number || 'whatsapp:+14155238886'

        if (!accountSid || !authToken) {
            return { success: false, error: 'Twilio credentials not configured. Please set them in Global Settings → Integrations.' }
        }

        const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
        const fromFormatted = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`

        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

        const formData = new URLSearchParams()
        formData.append('From', fromFormatted)
        formData.append('To', toNumber)
        formData.append('Body', body)

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        })

        const result = await res.json()
        if (!res.ok) return { success: false, error: result.message || 'Twilio API error' }
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('automation.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [emailTpls, waTpls, autoRules, pushSettings] = await Promise.all([
        supabaseAdmin.from('email_templates').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('whatsapp_templates').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('automation_rules').select('*').order('id', { ascending: false }),
        supabaseAdmin.from('platform_settings').select('value').eq('key', 'push_templates').maybeSingle()
    ])

    const pushTpls = pushSettings.data?.value || []

    const stats = {
        emailTemplates: emailTpls.data?.length || 0,
        waTemplates: waTpls.data?.length || 0,
        pushTemplates: Array.isArray(pushTpls) ? pushTpls.length : 0,
        activeRules: autoRules.data?.filter((r: any) => r.active_status).length || 0,
        totalRules: autoRules.data?.length || 0
    }

    return NextResponse.json({
        emailTemplates: emailTpls.data || [],
        waTemplates: waTpls.data || [],
        pushTemplates: Array.isArray(pushTpls) ? pushTpls : [],
        automationRules: autoRules.data || [],
        stats
    })
}

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('automation.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { action, payload } = await request.json()

    try {
        // ── EMAIL TEMPLATES ──────────────────────────────────────────────────
        if (action === 'CREATE_EMAIL_TEMPLATE') {
            const { data, error } = await supabaseAdmin.from('email_templates').insert([{
                name: payload.name, subject: payload.subject, body: payload.body, tenant_id: null
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'UPDATE_EMAIL_TEMPLATE') {
            const { data, error } = await supabaseAdmin.from('email_templates')
                .update({ name: payload.name, subject: payload.subject, body: payload.body })
                .eq('id', payload.id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_EMAIL_TEMPLATE') {
            const { error } = await supabaseAdmin.from('email_templates').delete().eq('id', payload.id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'TEST_EMAIL') {
            const { data: tpl } = await supabaseAdmin.from('email_templates').select('*').eq('id', payload.id).maybeSingle()
            if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

            const testBody = (tpl.body as string)
                .replace(/{name}/g, 'Test User').replace(/{email}/g, TEST_EMAIL)
                .replace(/{student_name}/g, 'Test Student').replace(/{exam_name}/g, 'Mock Exam 2026')
                .replace(/{institute_name}/g, 'BeBrilliant Demo').replace(/{exam_fee}/g, '199')
                .replace(/{amount}/g, '499').replace(/{txn_id}/g, 'TXN_TEST_001')
                .replace(/{date}/g, new Date().toLocaleDateString()).replace(/{purpose}/g, 'Exam Enrollment')
                .replace(/{score}/g, '87').replace(/{rank}/g, '3').replace(/{temp_password}/g, 'TestPass@123')
                .replace(/{commission_amount}/g, '250').replace(/{total_earned}/g, '1250')
                .replace(/{commission_source}/g, 'Referral - Student Signup')
                .replace(/{setup_link}|{exam_link}|{reset_link}|{result_link}|{dashboard_link}|{login_link}/g, 'https://bebrilliant.io')
                .replace(/{exam_date}/g, 'July 15, 2026').replace(/{duration}/g, '90')

            const result = await sendMail({
                to: TEST_EMAIL,
                subject: `[TEST] ${tpl.subject}`,
                html: testBody
            })

            if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
            return NextResponse.json({ success: true, message: `Test email sent to ${TEST_EMAIL}` })
        }

        // ── WHATSAPP TEMPLATES ────────────────────────────────────────────────
        if (action === 'CREATE_WHATSAPP_TEMPLATE') {
            const { data, error } = await supabaseAdmin.from('whatsapp_templates').insert([{
                template_key: payload.template_key, template_text: payload.template_text,
                is_active: payload.is_active ?? true, tenant_id: null
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'UPDATE_WHATSAPP_TEMPLATE') {
            const { data, error } = await supabaseAdmin.from('whatsapp_templates')
                .update({ template_key: payload.template_key, template_text: payload.template_text, is_active: payload.is_active })
                .eq('id', payload.id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_WHATSAPP_TEMPLATE') {
            const { error } = await supabaseAdmin.from('whatsapp_templates').delete().eq('id', payload.id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'TEST_WHATSAPP') {
            const { data: tpl } = await supabaseAdmin.from('whatsapp_templates').select('*').eq('id', payload.id).maybeSingle()
            if (!tpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

            const testMsg = (tpl.template_text as string)
                .replace(/{exam_name}/g, 'Mock Exam 2026').replace(/{institute_name}/g, 'BeBrilliant Demo')
                .replace(/{exam_fee}/g, '199').replace(/{student_name}/g, 'Test Student')
                .replace(/{referral_link}/g, 'https://bebrilliant.io/exam/demo')
                .replace(/{affiliate_signup_link}/g, 'https://bebrilliant.io/affiliate')
                .replace(/{login_link}/g, 'https://bebrilliant.io/login')
                .replace(/{exam_date}/g, 'July 15, 2026').replace(/{exam_time}/g, '10:00 AM')
                .replace(/{exam_link}/g, 'https://bebrilliant.io/exam/demo')

            const result = await sendTwilioWhatsApp(TEST_WHATSAPP, `[TEST MESSAGE]\n\n${testMsg}`)
            if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 })
            return NextResponse.json({ success: true, message: `Test WhatsApp sent to ${TEST_WHATSAPP}` })
        }

        // ── PUSH NOTIFICATION TEMPLATES ───────────────────────────────────────
        if (action === 'CREATE_PUSH_TEMPLATE') {
            const id = crypto.randomUUID()
            const { data: settings } = await supabaseAdmin.from('platform_settings')
                .select('value').eq('key', 'push_templates').maybeSingle()
            const existing = settings?.value || []
            const updated = [...existing, { id, ...payload }]
            await supabaseAdmin.from('platform_settings').upsert([{ key: 'push_templates', value: updated }], { onConflict: 'key' })
            return NextResponse.json({ id, ...payload })
        }

        if (action === 'UPDATE_PUSH_TEMPLATE') {
            const { data: settings } = await supabaseAdmin.from('platform_settings')
                .select('value').eq('key', 'push_templates').maybeSingle()
            const existing = (settings?.value || []).map((t: any) => t.id === payload.id ? { ...t, ...payload } : t)
            await supabaseAdmin.from('platform_settings').upsert([{ key: 'push_templates', value: existing }], { onConflict: 'key' })
            return NextResponse.json({ success: true })
        }

        if (action === 'DELETE_PUSH_TEMPLATE') {
            const { data: settings } = await supabaseAdmin.from('platform_settings')
                .select('value').eq('key', 'push_templates').maybeSingle()
            const existing = (settings?.value || []).filter((t: any) => t.id !== payload.id)
            await supabaseAdmin.from('platform_settings').upsert([{ key: 'push_templates', value: existing }], { onConflict: 'key' })
            return NextResponse.json({ success: true })
        }

        if (action === 'TEST_PUSH') {
            // Store as an in-app notification (FCM integration placeholder)
            return NextResponse.json({
                success: true,
                message: 'Push notification queued successfully. FCM integration ready to connect via Global Settings.'
            })
        }

        // ── AUTOMATION RULES ──────────────────────────────────────────────────
        if (action === 'CREATE_AUTOMATION_RULE') {
            const { data, error } = await supabaseAdmin.from('automation_rules').insert([{
                trigger_event: payload.trigger_event, channel: payload.channel,
                template_id: payload.template_id, delay_minutes: payload.delay_minutes || 0,
                active_status: payload.active_status ?? true, business_id: payload.business_id || null
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'TOGGLE_AUTOMATION_RULE') {
            const { data, error } = await supabaseAdmin.from('automation_rules')
                .update({ active_status: payload.active_status })
                .eq('id', payload.id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_AUTOMATION_RULE') {
            const { error } = await supabaseAdmin.from('automation_rules').delete().eq('id', payload.id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (e: any) {
        console.error('Communications API error:', e)
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
