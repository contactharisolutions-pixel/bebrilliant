import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data: staff, error } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, role, is_active')
            .in('role', ['owner', 'sales_exec', 'demo_exec', 'onboarding_spec'])
            .eq('tenant_id', null)
            .order('first_name', { ascending: true })

        if (error) {
            console.error("Fetch staff error:", error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        // Map into simple structures
        const formattedStaff = (staff || []).map((s: any) => ({
            id: s.id,
            email: s.email,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || s.email,
            role: s.role,
            is_active: s.is_active
        }))

        return NextResponse.json(formattedStaff)
    } catch (err: any) {
        console.error("GET staff API crashed:", err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
