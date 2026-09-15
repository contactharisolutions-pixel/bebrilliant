import { NextRequest, NextResponse } from 'next/server'
import { promises as dnsPromises } from 'dns'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()
    if (!profile) return null

    // Platform Owner bypass
    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true }
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        if (is_owner && tenant_id === 'platform') {
            return NextResponse.json({
                id: 'platform-master',
                name: 'BrightBoard Enterprise Global Hub',
                legal_name: 'BrightBoard Technologies Pvt. Ltd.',
                subdomain: 'platform',
                logo_url: '/logo-master.png',
                favicon_url: '',
                primary_color: '#004B93',
                secondary_color: '#10B981',
                accent_color: '#F59E0B',
                subscription_plan: 'enterprise_master',
                tenant_type: 'platform',
                settings: {
                    branding: {
                        name: 'BrightBoard Enterprise Global Hub',
                        legal_name: 'BrightBoard Technologies Pvt. Ltd.',
                        tagline: 'Leading AI-Powered Educational Infrastructure',
                        logo_url: '/logo-master.png',
                        favicon_url: '',
                        primary_color: '#004B93',
                        secondary_color: '#10B981',
                        accent_color: '#F59E0B'
                    },
                    contact: {
                        address: 'Innovation Campus, Cyber City',
                        city: 'Jaipur',
                        state: 'Rajasthan',
                        pincode: '302020',
                        country: 'India',
                        email: 'admin@brightboard.in',
                        phone: '+91 98765 43210',
                        alt_phone: '+91 98765 43211',
                        whatsapp: '+91 98765 43210',
                        website: 'https://brightboard.in',
                        working_hours: 'Mon - Sat: 09:00 AM - 06:00 PM'
                    },
                    security: {
                        allow_registration: true,
                        allow_teacher_registration: false,
                        allow_social_login: true,
                        mfa_required: true,
                        session_timeout_minutes: 60,
                        password_policy: 'strong',
                        prevent_concurrent_logins: true
                    },
                    automation: {
                        notify_on_login: true,
                        notify_on_failed_login: true,
                        auto_archive_exams: true,
                        exam_archive_days: 60,
                        auto_publish_results: false,
                        fee_due_reminder_days: 3,
                        attendance_sms_alert: true,
                        auto_generate_id_cards: true
                    },
                    domains: {
                        subdomain: 'platform',
                        custom_domain: 'portal.brightboard.in',
                        cname_target: 'cname.bebrilliant.in',
                        status: 'active',
                        ssl_status: 'active',
                        verification_token: 'bb-verify-platform-master',
                        cname_status: 'verified',
                        txt_status: 'verified',
                        last_checked: null
                    }
                },
                completeness_score: 100
            })
        }

        const { data: tenant, error } = await supabaseAdmin
            .from('tenants')
            .select('*')
            .eq('id', tenant_id)
            .single()

        if (error) throw error

        const rawSettings = tenant.settings || tenant.metadata || {}

        // Construct structured defaults for all 5 enterprise areas
        const brandingSettings = {
            name: tenant.name || 'Educational Institution',
            legal_name: rawSettings.branding?.legal_name || tenant.name || 'Educational Institution Pvt Ltd',
            tagline: rawSettings.branding?.tagline || 'Excellence in Modern Education & Mentorship',
            logo_url: tenant.logo_url || tenant.logo || rawSettings.branding?.logo_url || '',
            favicon_url: rawSettings.branding?.favicon_url || '',
            primary_color: tenant.primary_color || rawSettings.branding?.primary_color || '#004B93',
            secondary_color: tenant.secondary_color || rawSettings.branding?.secondary_color || '#10B981',
            accent_color: rawSettings.branding?.accent_color || '#F59E0B'
        }

        const contactSettings = {
            address: rawSettings.contact?.address || 'Main Campus, Institutional Area, Mansarovar',
            city: rawSettings.contact?.city || 'Jaipur',
            state: rawSettings.contact?.state || 'Rajasthan',
            pincode: rawSettings.contact?.pincode || '302020',
            country: rawSettings.contact?.country || 'India',
            email: rawSettings.contact?.email || tenant.email || 'contact@silverbells.edu.in',
            phone: rawSettings.contact?.phone || '+91 94140 12345',
            alt_phone: rawSettings.contact?.alt_phone || '+91 94140 67890',
            whatsapp: rawSettings.contact?.whatsapp || '+91 94140 12345',
            website: rawSettings.contact?.website || 'https://silverbells.edu.in',
            working_hours: rawSettings.contact?.working_hours || 'Mon - Sat: 08:00 AM - 03:30 PM'
        }

        const securitySettings = {
            allow_registration: rawSettings.security?.allow_registration ?? rawSettings.auth?.allow_registration ?? true,
            allow_teacher_registration: rawSettings.security?.allow_teacher_registration ?? false,
            allow_social_login: rawSettings.security?.allow_social_login ?? rawSettings.auth?.allow_social_login ?? true,
            mfa_required: rawSettings.security?.mfa_required ?? rawSettings.auth?.mfa_required ?? false,
            session_timeout_minutes: rawSettings.security?.session_timeout_minutes ?? 60,
            password_policy: rawSettings.security?.password_policy || 'standard',
            prevent_concurrent_logins: rawSettings.security?.prevent_concurrent_logins ?? true
        }

        const automationSettings = {
            notify_on_login: rawSettings.automation?.notify_on_login ?? rawSettings.workflows?.notify_on_login ?? true,
            notify_on_failed_login: rawSettings.automation?.notify_on_failed_login ?? true,
            auto_archive_exams: rawSettings.automation?.auto_archive_exams ?? rawSettings.workflows?.auto_archive_exams ?? false,
            exam_archive_days: rawSettings.automation?.exam_archive_days ?? 60,
            auto_publish_results: rawSettings.automation?.auto_publish_results ?? false,
            fee_due_reminder_days: rawSettings.automation?.fee_due_reminder_days ?? 3,
            attendance_sms_alert: rawSettings.automation?.attendance_sms_alert ?? true,
            auto_generate_id_cards: rawSettings.automation?.auto_generate_id_cards ?? true
        }

        const domainSettings = {
            subdomain: tenant.subdomain || 'silverbells',
            custom_domain: rawSettings.domains?.custom_domain || '',
            cname_target: 'cname.bebrilliant.in',
            status: rawSettings.domains?.status || 'active',
            ssl_status: rawSettings.domains?.ssl_status || 'active',
            verification_token: rawSettings.domains?.verification_token || `bb-verify-${tenant.subdomain || 'node'}`,
            cname_status: rawSettings.domains?.cname_status || 'pending',
            txt_status: rawSettings.domains?.txt_status || 'pending',
            last_checked: rawSettings.domains?.last_checked || null
        }

        // Calculate profile completeness score
        let score = 0
        if (brandingSettings.name) score += 15
        if (brandingSettings.logo_url) score += 15
        if (contactSettings.address) score += 15
        if (contactSettings.email) score += 15
        if (contactSettings.phone) score += 15
        if (domainSettings.subdomain) score += 15
        if (securitySettings.mfa_required || securitySettings.allow_registration !== undefined) score += 10

        return NextResponse.json({
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain || 'silverbells',
            logo_url: brandingSettings.logo_url,
            primary_color: brandingSettings.primary_color,
            secondary_color: brandingSettings.secondary_color,
            subscription_plan: tenant.subscription_plan || 'School (Standard)',
            tenant_type: tenant.tenant_type || tenant.type || 'school',
            settings: {
                branding: brandingSettings,
                contact: contactSettings,
                security: securitySettings,
                automation: automationSettings,
                domains: domainSettings,
                billing: rawSettings.billing || {}
            },
            completeness_score: Math.min(100, score)
        })
    } catch (error: any) {
        console.error('Settings GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (is_owner && tenant_id === 'platform') {
            return NextResponse.json({ success: true, message: 'Platform Master Settings Locked' })
        }

        // Load existing tenant settings
        const { data: tenant, error: fetchErr } = await supabaseAdmin
            .from('tenants')
            .select('*')
            .eq('id', tenant_id)
            .single()

        if (fetchErr || !tenant) {
            return NextResponse.json({ error: 'Tenant record not found' }, { status: 404 })
        }

        const currentSettings = tenant.settings || tenant.metadata || {}

        if (action === 'SAVE_ALL_SETTINGS') {
            const { branding, contact, security, automation, domains } = payload

            // Subdomain uniqueness check before saving
            const newSubdomain = domains?.subdomain || branding?.subdomain
            if (newSubdomain && newSubdomain !== tenant.subdomain) {
                const { data: existingTenant } = await supabaseAdmin
                    .from('tenants')
                    .select('id')
                    .eq('subdomain', newSubdomain)
                    .neq('id', tenant_id)
                    .maybeSingle()
                if (existingTenant) {
                    return NextResponse.json({ error: `The subdomain "${newSubdomain}" is already taken. Please choose a different one.` }, { status: 409 })
                }
            }

            const updatedSettings = {
                ...currentSettings,
                branding: { ...(currentSettings.branding || {}), ...(branding || {}) },
                contact: { ...(currentSettings.contact || {}), ...(contact || {}) },
                security: { ...(currentSettings.security || {}), ...(security || {}) },
                automation: { ...(currentSettings.automation || {}), ...(automation || {}) },
                domains: { ...(currentSettings.domains || {}), ...(domains || {}) }
            }

            // Sync root columns
            const rootUpdates: any = {
                settings: updatedSettings,
                updated_at: new Date().toISOString()
            }

            if (branding?.name) rootUpdates.name = branding.name
            // Sync subdomain from both possible sources
            if (newSubdomain) rootUpdates.subdomain = newSubdomain
            if (branding?.logo_url) {
                rootUpdates.logo_url = branding.logo_url
                rootUpdates.logo = branding.logo_url
            }
            if (branding?.primary_color) rootUpdates.primary_color = branding.primary_color
            if (branding?.secondary_color) rootUpdates.secondary_color = branding.secondary_color

            const { error: updErr } = await supabaseAdmin
                .from('tenants')
                .update(rootUpdates)
                .eq('id', tenant_id)

            if (updErr) throw updErr

            return NextResponse.json({
                success: true,
                message: 'All school configurations saved successfully!'
            })
        }

        if (action === 'UPDATE_BRANDING') {
            const { name, legal_name, tagline, logo_url, favicon_url, primary_color, secondary_color, accent_color, subdomain } = payload

            // Subdomain uniqueness check
            if (subdomain && subdomain !== tenant.subdomain) {
                const { data: existingTenant } = await supabaseAdmin
                    .from('tenants')
                    .select('id')
                    .eq('subdomain', subdomain)
                    .neq('id', tenant_id)
                    .maybeSingle()
                if (existingTenant) {
                    return NextResponse.json({ error: `The subdomain "${subdomain}" is already taken. Please choose a different one.` }, { status: 409 })
                }
            }

            const updatedSettings = {
                ...currentSettings,
                branding: {
                    ...(currentSettings.branding || {}),
                    name,
                    legal_name,
                    tagline,
                    logo_url,
                    favicon_url,
                    primary_color,
                    secondary_color,
                    accent_color
                }
            }

            const rootUpdates: any = {
                settings: updatedSettings,
                name: name || tenant.name,
                logo_url: logo_url || tenant.logo_url,
                logo: logo_url || tenant.logo,
                primary_color: primary_color || tenant.primary_color,
                secondary_color: secondary_color || tenant.secondary_color,
                updated_at: new Date().toISOString()
            }

            if (subdomain) rootUpdates.subdomain = subdomain

            const { error: updErr } = await supabaseAdmin
                .from('tenants')
                .update(rootUpdates)
                .eq('id', tenant_id)

            if (updErr) throw updErr

            return NextResponse.json({ success: true, message: 'Branding updated successfully.' })
        }

        if (action === 'UPDATE_CONTACT') {
            const updatedSettings = {
                ...currentSettings,
                contact: { ...(currentSettings.contact || {}), ...(payload || {}) }
            }

            const { error: updErr } = await supabaseAdmin
                .from('tenants')
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
                .eq('id', tenant_id)

            if (updErr) throw updErr

            return NextResponse.json({ success: true, message: 'Campus contact details updated.' })
        }

        if (action === 'UPDATE_SECURITY') {
            const updatedSettings = {
                ...currentSettings,
                security: { ...(currentSettings.security || {}), ...(payload || {}) },
                auth: { ...(currentSettings.auth || {}), ...(payload || {}) }
            }

            const { error: updErr } = await supabaseAdmin
                .from('tenants')
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
                .eq('id', tenant_id)

            if (updErr) throw updErr

            return NextResponse.json({ success: true, message: 'Security governance updated.' })
        }

        if (action === 'UPDATE_AUTOMATION') {
            const updatedSettings = {
                ...currentSettings,
                automation: { ...(currentSettings.automation || {}), ...(payload || {}) },
                workflows: { ...(currentSettings.workflows || {}), ...(payload || {}) }
            }

            const { error: updErr } = await supabaseAdmin
                .from('tenants')
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
                .eq('id', tenant_id)

            if (updErr) throw updErr

            return NextResponse.json({ success: true, message: 'Automation triggers updated.' })
        }

        if (action === 'SAVE_CUSTOM_DOMAIN') {
            const { custom_domain } = payload || {}
            const updatedSettings = {
                ...currentSettings,
                domains: {
                    ...(currentSettings.domains || {}),
                    custom_domain: custom_domain || '',
                    cname_status: custom_domain
                        ? (currentSettings.domains?.cname_status || 'pending')
                        : 'pending',
                    txt_status: custom_domain
                        ? (currentSettings.domains?.txt_status || 'pending')
                        : 'pending',
                    status: custom_domain ? 'pending' : 'active',
                    last_checked: null
                }
            }
            const { error: scErr } = await supabaseAdmin
                .from('tenants')
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
                .eq('id', tenant_id)
            if (scErr) throw scErr
            return NextResponse.json({
                success: true,
                message: custom_domain
                    ? `Custom domain "${custom_domain}" saved. Add the DNS records below, then click Verify DNS.`
                    : 'Custom domain removed. Your school is now using the cloud subdomain.'
            })
        }

        if (action === 'UPDATE_DOMAINS') {
            const { custom_domain, subdomain } = payload || {}
            const updatedSettings = {
                ...currentSettings,
                domains: {
                    ...(currentSettings.domains || {}),
                    custom_domain: custom_domain || currentSettings.domains?.custom_domain || '',
                    subdomain: subdomain || tenant.subdomain,
                    status: currentSettings.domains?.status || 'active',
                    last_checked: new Date().toISOString()
                }
            }
            const rootUpdates: any = { settings: updatedSettings, updated_at: new Date().toISOString() }
            if (subdomain) rootUpdates.subdomain = subdomain
            await supabaseAdmin.from('tenants').update(rootUpdates).eq('id', tenant_id)
            return NextResponse.json({ success: true, message: 'Domain configuration saved.' })
        }

        if (action === 'VERIFY_DOMAIN') {
            const { custom_domain } = payload || {}
            const targetDomain = custom_domain || currentSettings.domains?.custom_domain || ''

            if (!targetDomain) {
                return NextResponse.json({ error: 'No custom domain to verify. Please save a domain first.' }, { status: 400 })
            }

            let cname_status = 'pending'
            let txt_status = 'pending'

            // Real CNAME check — query the full FQDN for a CNAME record
            try {
                const cnameResults = await dnsPromises.resolveCname(targetDomain)
                const resolved = cnameResults?.[0] || ''
                cname_status = resolved.toLowerCase().includes('bebrilliant.in') ? 'verified' : 'configured'
            } catch {
                cname_status = 'pending'
            }

            // Real TXT check — query _bebrilliant-challenge.<root-domain>
            const verToken = currentSettings.domains?.verification_token || `bb-verify-${tenant.subdomain || 'node'}`
            try {
                // Extract the root domain (strip first label from e.g. portal.silverbells.edu.in → silverbells.edu.in)
                const parts = targetDomain.split('.')
                const rootDomain = parts.length > 2 ? parts.slice(1).join('.') : targetDomain
                const txtHost = `_bebrilliant-challenge.${rootDomain}`
                const txtResults = await dnsPromises.resolveTxt(txtHost)
                const flatTxt = txtResults.flat()
                txt_status = flatTxt.some(t => t.includes(verToken) || t.includes('bb-verify-')) ? 'verified' : 'pending'
            } catch {
                txt_status = 'pending'
            }

            const isFullyVerified = cname_status === 'verified' && txt_status === 'verified'

            const updatedSettings = {
                ...currentSettings,
                domains: {
                    ...(currentSettings.domains || {}),
                    custom_domain: targetDomain,
                    status: isFullyVerified ? 'verified' : 'pending',
                    cname_status,
                    txt_status,
                    ssl_status: isFullyVerified ? 'active' : (currentSettings.domains?.ssl_status || 'pending'),
                    last_checked: new Date().toISOString()
                }
            }

            const { error: vErr } = await supabaseAdmin
                .from('tenants')
                .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
                .eq('id', tenant_id)
            if (vErr) throw vErr

            return NextResponse.json({
                success: true,
                cname_status,
                txt_status,
                verified: isFullyVerified,
                message: isFullyVerified
                    ? `✅ Domain ${targetDomain} is fully verified and active!`
                    : `DNS check complete — CNAME: ${cname_status.toUpperCase()}, TXT Record: ${txt_status.toUpperCase()}. DNS changes can take 15–60 minutes to propagate worldwide. Try again shortly.`
            })
        }

        if (action === 'UPLOAD_LOGO' || action === 'UPLOAD_ASSET') {
            const { fileBase64, fileName, contentType } = payload

            try {
                const buffer = Buffer.from(fileBase64, 'base64')
                const filePath = `tenants/${tenant_id}/${Date.now()}_${fileName}`

                if ((supabaseAdmin as any).storage) {
                    const { error: uploadError } = await (supabaseAdmin as any)
                        .storage
                        .from('bebrilliant')
                        .upload(filePath, buffer, { contentType, upsert: true })

                    if (!uploadError) {
                        const { data: { publicUrl } } = (supabaseAdmin as any)
                            .storage
                            .from('bebrilliant')
                            .getPublicUrl(filePath)
                        return NextResponse.json({ success: true, url: publicUrl })
                    }
                }
            } catch (storageErr) {
                console.warn('Storage service notice, falling back to embedded URL:', storageErr)
            }

            // Reliable data URL fallback
            const dataUrl = `data:${contentType};base64,${fileBase64}`
            return NextResponse.json({ success: true, url: dataUrl })
        }

        return NextResponse.json({ error: 'Invalid settings action payload' }, { status: 400 })
    } catch (error: any) {
        console.error('Settings API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
