import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
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
                name: 'BrightBoard Enterprise Hub',
                subdomain: 'platform',
                logo_url: '/logo-master.png',
                primary_color: '#004B93',
                subscription_plan: 'enterprise_master',
                settings: {
                    auth: { allow_registration: true, allow_social_login: true, mfa_required: true },
                    workflows: { notify_on_login: true, auto_archive_exams: true },
                    domains: [{ host: 'portal.brightboard.in', status: 'active' }]
                }
            })
        }

        const { data: tenant, error } = await supabaseAdmin
            .from('tenants')
            .select('*')
            .eq('id', tenant_id)
            .single()

        if (error) throw error

        // Aggregating settings from multiple potential containers (tenants.settings, tenants.metadata, tenant_theme.custom_config)
        // This ensures the contact details are retrieved even if they were stored in a fallback location
        let aggregatedSettings = tenant.settings || tenant.metadata || {}
        
        if (!aggregatedSettings.contact) {
            const { data: theme } = await supabaseAdmin.from('tenant_theme').select('custom_config').eq('tenant_id', tenant_id).single()
            if (theme?.custom_config?.contact) {
                aggregatedSettings.contact = theme.custom_config.contact
            }
        }

        return NextResponse.json({
            ...tenant,
            logo_url: tenant.logo_url || tenant.logo || '',
            primary_color: tenant.primary_color || '#004B93',
            settings: aggregatedSettings
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'UPDATE_BRANDING') {
            const { name, logo_url, primary_color, subdomain, contact } = payload

            if (is_owner && tenant_id === 'platform') {
                return NextResponse.json({ success: true, message: 'Platform Branding Locked' })
            }

            const { data: tenant } = await supabaseAdmin.from('tenants').select('*').eq('id', tenant_id).single()

            const desired: any = {
                name,
                logo: logo_url,
                logo_url,
                primary_color,
                subdomain,
                updated_at: new Date().toISOString()
            }

            const updatePayload: any = {}
            if (tenant) {
                Object.keys(desired).forEach(key => {
                    if (key in tenant) updatePayload[key] = desired[key]
                })

                // PRIMARY STORAGE: tenants.settings or tenants.metadata
                if ('settings' in tenant) {
                    updatePayload.settings = { ...(tenant.settings || {}), contact }
                    await supabaseAdmin.from('tenants').update(updatePayload).eq('id', tenant_id)
                } else if ('metadata' in tenant) {
                    updatePayload.metadata = { ...(tenant.metadata || {}), contact }
                    await supabaseAdmin.from('tenants').update(updatePayload).eq('id', tenant_id)
                } else {
                    // SECONDARY STORAGE FALLBACK: If tenants table is locked/legacy, use tenant_theme.custom_config (JSONB)
                    // This creates a failsafe for storing Institutional Contact Details
                    await supabaseAdmin.from('tenants').update(updatePayload).eq('id', tenant_id)
                    
                    const { data: theme } = await supabaseAdmin.from('tenant_theme').select('custom_config').eq('tenant_id', tenant_id).single()
                    await supabaseAdmin.from('tenant_theme').upsert({ 
                        tenant_id, 
                        custom_config: { ...(theme?.custom_config || {}), contact } 
                    })
                }
            }

            return NextResponse.json({ success: true })
        }

        if (action === 'UPDATE_SETTINGS') {
            const { section, data: sectionData } = payload

            if (is_owner && tenant_id === 'platform') {
                return NextResponse.json({ success: true })
            }

            const { data: tenant } = await supabaseAdmin.from('tenants').select('*').eq('id', tenant_id).single()
            
            const updatePayload: any = {}
            if (tenant) {
                if ('settings' in tenant) {
                    updatePayload.settings = { ...(tenant.settings || {}), [section]: sectionData }
                    await supabaseAdmin.from('tenants').update(updatePayload).eq('id', tenant_id)
                } else if ('metadata' in tenant) {
                    updatePayload.metadata = { ...(tenant.metadata || {}), [section]: sectionData }
                    await supabaseAdmin.from('tenants').update(updatePayload).eq('id', tenant_id)
                } else {
                    const { data: theme } = await supabaseAdmin.from('tenant_theme').select('custom_config').eq('tenant_id', tenant_id).single()
                    await supabaseAdmin.from('tenant_theme').upsert({ 
                        tenant_id, 
                        custom_config: { ...(theme?.custom_config || {}), [section]: sectionData } 
                    })
                }
            }

            return NextResponse.json({ success: true })
        }

        if (action === 'UPLOAD_LOGO') {
            const { fileBase64, fileName, contentType } = payload
            const buffer = Buffer.from(fileBase64, 'base64')
            
            await supabaseAdmin.storage.from('bebrilliant').upload(fileName, buffer, { contentType, upsert: true })
            
            const { data: { publicUrl } } = supabaseAdmin.storage.from('bebrilliant').getPublicUrl(fileName)
            return NextResponse.json({ success: true, url: publicUrl })
        }

        return NextResponse.json({ error: 'Invalid routing sequence' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
