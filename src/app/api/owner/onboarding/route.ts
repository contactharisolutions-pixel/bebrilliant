import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data: checklists, error } = await supabaseAdmin
            .from('onboarding_checklists')
            .select('*')
            .order('updated_at', { ascending: false })

        if (error) {
            console.error("Fetch onboarding checklists error:", error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        // Fetch tenants and staff profiles in memory
        const tenantIds = [...new Set(checklists.map(c => c.tenant_id).filter(Boolean))]
        const staffIds = [...new Set(checklists.map(c => c.assigned_staff_id).filter(Boolean))]

        let tenantMap: any = {}
        let staffMap: any = {}

        if (tenantIds.length > 0) {
            const { data: tenants } = await supabaseAdmin
                .from('tenants')
                .select('id, name, type, tenant_type, email, is_active')
                .in('id', tenantIds)
            if (tenants) {
                tenantMap = Object.fromEntries(tenants.map(t => [t.id, t]))
            }
        }

        if (staffIds.length > 0) {
            const { data: staff } = await supabaseAdmin
                .from('user_profiles')
                .select('id, first_name, last_name, email, role')
                .in('id', staffIds)
            if (staff) {
                staffMap = Object.fromEntries(staff.map(s => [s.id, s]))
            }
        }

        const formatted = checklists.map(c => ({
            ...c,
            tenant: tenantMap[c.tenant_id] || null,
            assigned_staff: staffMap[c.assigned_staff_id] || null
        }))

        return NextResponse.json(formatted)
    } catch (err: any) {
        console.error("GET onboarding API crashed:", err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
