import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
            }
            if (error.message.toLowerCase().includes('database error') || error.message.includes('querying schema')) {
                console.error('Supabase schema cache error during login:', error.message)
                return NextResponse.json({ error: 'Service temporarily unavailable. Please try again in a moment.' }, { status: 503 })
            }
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Fetch profile using admin client since cookies aren't set yet in this request
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('role, tenant_id, is_first_login, is_active, first_name, last_name')
            .eq('id', data.user.id)
            .single()

        if (profileError || !profile) {
            console.error('Login profile lookup error:', profileError, 'for user ID:', data.user.id)
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        if (!profile.is_active) {
            // Sign out the user immediately
            await supabase.auth.signOut()
            return NextResponse.json(
                { error: 'Your account is inactive. Please contact your administrator.' },
                { status: 403 }
            )
        }

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: data.user.id,
                email: data.user.email,
                role: profile.role,
                tenant_id: profile.tenant_id,
                is_first_login: profile.is_first_login,
                first_name: profile.first_name,
                last_name: profile.last_name,
            },
            // Indicates the client should redirect to change-password first
            requires_password_change: profile.is_first_login,
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
