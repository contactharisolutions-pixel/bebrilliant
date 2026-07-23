import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { sendMail } from '@/lib/email'

const TEST_EMAIL = 'tech.dipakraval@gmail.com'
const TEST_WHATSAPP = '+918141388570'

// ── Audience resolver: returns list of recipients based on filter ─────────────
async function resolveAudience(filter: any): Promise<{ id: string; email: string; phone: string; name: string }[]> {
    const target = filter.target || 'all_tenants'
    let results: any[] = []

    if (target === 'all_tenants' || target === 'tenants') {
        let query = supabaseAdmin
            .from('tenants')
            .select('id, name, email, phone, type, subscription_status, is_active, created_at')
        
        // Active State Filter
        if (filter.is_active !== undefined && filter.is_active !== 'all') {
            const isActiveBool = filter.is_active === 'true' || filter.is_active === true
            query = query.eq('is_active', isActiveBool)
        }
        // Subscription Status Filter
        if (filter.subscription_status && filter.subscription_status !== 'all') {
            query = query.eq('subscription_status', filter.subscription_status)
        }
        // Tenant Type Filter
        if (filter.tenant_type && filter.tenant_type !== 'all') {
            query = query.eq('type', filter.tenant_type)
        }

        const { data } = await query
        results = (data || []).map((r: any) => ({ 
            id: r.id, 
            name: r.name, 
            email: r.email, 
            phone: r.phone, 
            role: 'tenant',
            created_at: r.created_at
        }))
    }

    if (target === 'all_teachers' || target === 'teachers') {
        let query = supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, email, phone, role, is_active, created_at')
        
        // Verification State Filter
        if (filter.teacher_role && filter.teacher_role !== 'all') {
            query = query.eq('role', filter.teacher_role)
        } else {
            query = query.in('role', ['teacher', 'teacher_pending'])
        }

        // Active State Filter
        if (filter.is_active !== undefined && filter.is_active !== 'all') {
            const isActiveBool = filter.is_active === 'true' || filter.is_active === true
            query = query.eq('is_active', isActiveBool)
        }

        const { data } = await query
        results = (data || []).map((r: any) => ({
            id: r.id,
            name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Teacher',
            email: r.email,
            phone: r.phone,
            role: r.role,
            is_active: r.is_active,
            created_at: r.created_at
        }))

        // Advanced filter: has email
        if (filter.has_email === 'yes') {
            results = results.filter((r: any) => !!r.email)
        } else if (filter.has_email === 'no') {
            results = results.filter((r: any) => !r.email)
        }
    }

    if (target === 'all_students' || target === 'students') {
        let query = supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, email, phone, role, tenant_id, is_active, created_at')
            .eq('role', 'student')

        // Associated Institute Filter
        if (filter.tenant_id && filter.tenant_id !== 'all') {
            query = query.eq('tenant_id', filter.tenant_id)
        }

        // Active State Filter
        if (filter.is_active !== undefined && filter.is_active !== 'all') {
            const isActiveBool = filter.is_active === 'true' || filter.is_active === true
            query = query.eq('is_active', isActiveBool)
        }

        const { data } = await query
        results = (data || []).map((r: any) => ({
            id: r.id,
            name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Student',
            email: r.email,
            phone: r.phone,
            role: r.role,
            tenant_id: r.tenant_id,
            is_active: r.is_active,
            created_at: r.created_at
        }))

        // Advanced filter: has phone
        if (filter.has_phone === 'yes') {
            results = results.filter((r: any) => !!r.phone)
        } else if (filter.has_phone === 'no') {
            results = results.filter((r: any) => !r.phone)
        }
    }

    // Apply advanced global filters
    if (filter.subscription_plan) {
        results = results.filter((r: any) => r.subscription_plan === filter.subscription_plan)
    }

    if (filter.created_after) {
        const since = new Date(filter.created_after)
        results = results.filter((r: any) => new Date(r.created_at || 0) >= since)
    }

    return results.filter((r: any) => r.email || r.phone)
}

async function sendTwilioWhatsApp(to: string, body: string): Promise<boolean> {
    const { data: settings } = await supabaseAdmin
        .from('platform_settings').select('value').eq('key', 'integrations').maybeSingle()
    const integrations = settings?.value || {}
    const { twilio_sid: sid, twilio_token: token, twilio_whatsapp_number: fromNum } = integrations
    if (!sid || !token) return false

    const form = new URLSearchParams({
        From: fromNum?.startsWith('whatsapp:') ? fromNum : `whatsapp:${fromNum || '+14155238886'}`,
        To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
        Body: body
    })
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
    })
    return res.ok
}

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('automation.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [campaigns, groups, logs, tenantsRes] = await Promise.all([
        supabaseAdmin.from('broadcast_campaigns').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('broadcast_groups').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('broadcast_logs').select('campaign_id, status').order('sent_at', { ascending: false }),
        supabaseAdmin.from('tenants').select('id, name').order('name')
    ])

    const stats = {
        total: campaigns.data?.length || 0,
        draft: campaigns.data?.filter((c: any) => c.status === 'draft').length || 0,
        scheduled: campaigns.data?.filter((c: any) => c.status === 'scheduled').length || 0,
        sent: campaigns.data?.filter((c: any) => c.status === 'sent').length || 0,
        totalRecipients: campaigns.data?.reduce((a: number, c: any) => a + (c.total_recipients || 0), 0) || 0,
        groups: groups.data?.length || 0
    }

    return NextResponse.json({ 
        campaigns: campaigns.data || [], 
        groups: groups.data || [], 
        tenants: tenantsRes.data || [],
        stats 
    })
}

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('automation.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { action, payload } = await request.json()

    try {
        // ── RESOLVE AUDIENCE (preview count) ──────────────────────────────────
        if (action === 'RESOLVE_AUDIENCE') {
            const recipients = await resolveAudience(payload.filter || {})
            return NextResponse.json({ count: recipients.length, sample: recipients.slice(0, 3).map((r: any) => ({ name: r.name, email: r.email })) })
        }

        // ── CREATE CAMPAIGN ────────────────────────────────────────────────────
        if (action === 'CREATE_CAMPAIGN') {
            const recipients = await resolveAudience(payload.audience_filter || {})
            const { data, error } = await supabaseAdmin.from('broadcast_campaigns').insert([{
                name: payload.name, channel: payload.channel, template_id: payload.template_id || null,
                status: payload.scheduled_at ? 'scheduled' : 'draft',
                audience_filter: payload.audience_filter || {}, group_id: payload.group_id || null,
                scheduled_at: payload.scheduled_at || null,
                total_recipients: recipients.length, created_by: null
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        // ── LAUNCH CAMPAIGN ────────────────────────────────────────────────────
        if (action === 'LAUNCH_CAMPAIGN') {
            const { data: campaign } = await supabaseAdmin.from('broadcast_campaigns').select('*').eq('id', payload.id).single()
            if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

            // Update status to sending
            await supabaseAdmin.from('broadcast_campaigns').update({ status: 'sending' }).eq('id', payload.id)

            const recipients = await resolveAudience(campaign.audience_filter || {})
            let sentCount = 0, failedCount = 0

            // Get template
            let templateBody = ''
            let templateSubject = ''
            if (campaign.channel === 'email' && campaign.template_id) {
                const { data: tpl } = await supabaseAdmin.from('email_templates').select('*').eq('id', campaign.template_id).single()
                templateBody = tpl?.body || ''
                templateSubject = tpl?.subject || campaign.name
            }
            if (campaign.channel === 'whatsapp' && campaign.template_id) {
                const { data: tpl } = await supabaseAdmin.from('whatsapp_templates').select('*').eq('id', campaign.template_id).single()
                templateBody = tpl?.template_text || ''
            }

            const logs: any[] = []
            for (const recipient of recipients) {
                let success = false
                let errMsg = ''
                try {
                    if (campaign.channel === 'email' && recipient.email) {
                        const personalised = templateBody.replace(/{name}/g, recipient.name || 'User').replace(/{email}/g, recipient.email)
                        const res = await sendMail({ to: recipient.email, subject: templateSubject, html: personalised })
                        success = res.success
                        errMsg = res.error ? (typeof res.error === 'object' ? (res.error as any).message || JSON.stringify(res.error) : String(res.error)) : ''
                    } else if (campaign.channel === 'whatsapp' && recipient.phone) {
                        const personalised = templateBody.replace(/{name}/g, recipient.name || 'User')
                        success = await sendTwilioWhatsApp(recipient.phone, personalised)
                    } else {
                        success = true // push/undeliverable — mark as sent
                    }
                } catch (e: any) { errMsg = e.message }

                if (success) sentCount++; else failedCount++
                logs.push({ campaign_id: payload.id, recipient_id: recipient.id, recipient_email: recipient.email, recipient_phone: recipient.phone, status: success ? 'sent' : 'failed', sent_at: new Date().toISOString(), error: errMsg || null })
            }

            // Bulk insert logs
            if (logs.length > 0) {
                await supabaseAdmin.from('broadcast_logs').insert(logs)
            }

            // Mark campaign done
            await supabaseAdmin.from('broadcast_campaigns').update({
                status: 'sent', sent_at: new Date().toISOString(),
                sent_count: sentCount, failed_count: failedCount
            }).eq('id', payload.id)

            return NextResponse.json({ success: true, sent: sentCount, failed: failedCount, total: recipients.length })
        }

        // ── CANCEL CAMPAIGN ────────────────────────────────────────────────────
        if (action === 'CANCEL_CAMPAIGN') {
            await supabaseAdmin.from('broadcast_campaigns').update({ status: 'cancelled' }).eq('id', payload.id)
            return NextResponse.json({ success: true })
        }

        // ── DELETE CAMPAIGN ────────────────────────────────────────────────────
        if (action === 'DELETE_CAMPAIGN') {
            await supabaseAdmin.from('broadcast_campaigns').delete().eq('id', payload.id)
            return NextResponse.json({ success: true })
        }

        // ── GROUPS MANAGEMENT ──────────────────────────────────────────────────
        if (action === 'CREATE_GROUP') {
            const { data, error } = await supabaseAdmin.from('broadcast_groups').insert([{
                name: payload.name, description: payload.description || '',
                filter_config: payload.filter_config || {}
            }]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'DELETE_GROUP') {
            await supabaseAdmin.from('broadcast_groups').delete().eq('id', payload.id)
            return NextResponse.json({ success: true })
        }

        if (action === 'REFRESH_GROUP_COUNT') {
            const { data: grp } = await supabaseAdmin.from('broadcast_groups').select('*').eq('id', payload.id).single()
            const recipients = await resolveAudience(grp?.filter_config || {})
            await supabaseAdmin.from('broadcast_groups').update({ member_count: recipients.length }).eq('id', payload.id)
            return NextResponse.json({ count: recipients.length })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (e: any) {
        console.error('Marketing API error:', e)
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
