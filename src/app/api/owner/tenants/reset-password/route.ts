import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/**
 * POST /api/owner/tenants/reset-password
 * Sends a Supabase Auth password reset email to a tenant admin.
 * Only callable by platform owner/staff.
 */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
        }

        // Verify that this email belongs to a tenant admin (safety check)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('id, role, is_active')
            .eq('email', email)
            .in('role', ['tenant_admin', 'admin'])
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'No tenant account found with this email' }, { status: 404 })
        }

        if (!profile.is_active) {
            return NextResponse.json({ error: 'This account is suspended. Reactivate it before resetting the password.' }, { status: 400 })
        }

        // Trigger Supabase Auth password reset email
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://app.bebrilliant.in'}/auth/update-password`,
        })

        if (resetError) {
            console.error('Password reset error:', resetError)
            return NextResponse.json({ error: 'Failed to send reset email. Please try again.' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: `Password reset link sent to ${email}` })
    } catch (err: any) {
        console.error('Reset password API error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
