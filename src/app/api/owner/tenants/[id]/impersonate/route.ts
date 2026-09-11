import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

const PRIMARY_JWT_SECRET = process.env.JWT_SECRET || 'BeBrilliant_SuperSecret_2026_ProdKey'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    try {
        const { id } = await params

        // Fetch tenant details
        const { data: tenant, error: tenantErr } = await supabaseAdmin
            .from('tenants')
            .select('id, name, subdomain')
            .eq('id', id)
            .single()

        if (tenantErr || !tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        // Find primary tenant admin profile
        const { data: adminProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, role, is_active')
            .eq('tenant_id', id)
            .in('role', ['tenant_admin', 'admin'])
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        if (!adminProfile) {
            return NextResponse.json({ error: 'No admin user profile found for this tenant.' }, { status: 404 })
        }

        // Generate temporary impersonation token (valid 2 hours)
        const impersonationToken = jwt.sign(
            {
                id: adminProfile.id,
                email: adminProfile.email,
                role: adminProfile.role,
                tenant_id: id,
                impersonated_by: user.id
            },
            PRIMARY_JWT_SECRET,
            { expiresIn: '2h' }
        )

        const response = NextResponse.json({
            success: true,
            tenantName: tenant.name,
            subdomain: tenant.subdomain,
            adminEmail: adminProfile.email,
            redirectUrl: '/dashboard'
        })

        // Set session cookie for seamless one-click switch
        response.cookies.set('bb_token', impersonationToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7200,
            path: '/'
        })

        return response
    } catch (err: any) {
        console.error('Impersonation error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
