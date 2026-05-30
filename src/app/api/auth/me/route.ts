import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Optimized: single query with only needed columns (no SELECT *)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('role, first_name, last_name, tenant_id, is_first_login, tenants:tenant_id(name, logo, tenant_type)')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('Profile Fetch Error:', profileError)
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const rawTenant = (profile as any).tenants
        const tenantData = Array.isArray(rawTenant) ? rawTenant[0] : rawTenant
        
        let tenantBranding = null
        if (tenantData) {
            tenantBranding = {
                name: tenantData.name,
                logo_url: tenantData.logo || null,
                tenant_type: tenantData.tenant_type
            }
        } else if (profile.role === 'owner') {
            tenantBranding = { name: 'BrightBoard Enterprise Hub', logo_url: '/logo-master.png' }
        }

        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Unknown User'

        const response = NextResponse.json({
            id: user.id,
            email: user.email,
            role: profile.role,
            fullName,
            tenant_id: profile.tenant_id,
            tenant: tenantBranding,
            is_first_login: profile.is_first_login
        })
        return response
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
