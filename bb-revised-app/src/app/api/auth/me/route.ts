import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Atomic identity fetch with robust tenant branding join
        const { data: profile, error: profileError } = await supabaseAdmin.from('user_profiles')
            .select(`
                role, first_name, last_name, tenant_id, is_first_login,
                tenants:tenant_id (*)
            `)
            .eq('id', user.id)
            .single()
            
        console.log('--- [API AUTH ME] supabaseAdmin DB result ---')
        console.log('User ID:', user.id)
        if (profileError) console.error('PROFILE ERROR:', profileError.message || profileError)
        console.log('Profile Data Found?:', !!profile)

        if (profileError || !profile) return NextResponse.json({ error: 'Profile system failure', details: profileError }, { status: 404 })

        // Handle both singular object and array returns for PostgREST joins
        const rawTenant = (profile as any).tenants
        const tenantData = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant
        
        let tenantBranding = null

        if (tenantData) {
            tenantBranding = {
                name: tenantData.name,
                logo_url: tenantData.logo_url || tenantData.logo || null,
                tenant_type: tenantData.tenant_type
            }
        } else if (profile.role === 'owner') {
            tenantBranding = {
                name: 'BrightBoard Enterprise Hub',
                logo_url: '/logo-master.png'
            }
        }

        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Unknown User'

        return NextResponse.json({
            id: user.id,
            email: user.email,
            role: profile.role,
            fullName,
            tenant_id: profile.tenant_id,
            tenant: tenantBranding,
            is_first_login: profile.is_first_login
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
