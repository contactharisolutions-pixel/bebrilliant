import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { password } = body

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
        }

        // Update password via the user's own session
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        // Mark is_first_login as false using admin client to bypass RLS.
        // Using the cookie-based client here can fail silently if the session
        // is not yet fully established, leaving the flag stuck on `true`.
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .update({ is_first_login: false })
            .eq('id', user.id)

        if (profileError) {
            console.error('Failed to update is_first_login:', profileError)
            // Return an error so the client knows the flag wasn't cleared
            return NextResponse.json({ error: 'Password changed but profile sync failed. Please contact support.' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Password updated successfully' })
    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
