import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/student/profile/lookup-parent?email=...
// Looks up a parent account by email within the student's tenant
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
        if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

        // Get student's tenant_id
        const { data: studentProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!studentProfile?.tenant_id) {
            return NextResponse.json({ error: 'Student tenant not found' }, { status: 404 })
        }

        // Look up parent within same tenant
        const { data: parentProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('id, first_name, last_name, email, phone')
            .eq('email', email)
            .eq('role', 'parent')
            .eq('tenant_id', studentProfile.tenant_id)
            .single()

        if (!parentProfile) {
            return NextResponse.json({ found: false }, { status: 200 })
        }

        return NextResponse.json({
            id: parentProfile.id,
            full_name: `${parentProfile.first_name || ''} ${parentProfile.last_name || ''}`.trim(),
            email: parentProfile.email,
            phone: parentProfile.phone,
            found: true,
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
