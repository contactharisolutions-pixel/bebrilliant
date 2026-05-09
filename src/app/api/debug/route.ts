import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
    try {
        const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
        const { data: profiles, error: profileError } = await supabaseAdmin.from('user_profiles').select('*')

        return NextResponse.json({
            users: users?.users.map(u => ({ id: u.id, email: u.email })),
            userError,
            profiles,
            profileError
        })
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
