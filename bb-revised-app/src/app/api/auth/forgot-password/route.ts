import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        const supabase = await createClient()

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Always return success (don't reveal if email exists or not — security best practice)
        return NextResponse.json({
            message: 'If an account exists with this email, a password reset link has been sent.',
        })
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
