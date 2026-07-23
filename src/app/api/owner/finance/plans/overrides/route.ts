import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** POST /api/owner/finance/plans/overrides — Manually override subscription limits for a tenant */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { tenant_id, limit_overrides } = body

        if (!tenant_id || !limit_overrides) {
            return NextResponse.json({ error: 'tenant_id and limit_overrides are required' }, { status: 400 })
        }

        // 1. Fetch active subscription
        const { data: sub, error: fetchErr } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('status', 'active')
            .maybeSingle()

        if (fetchErr) throw fetchErr

        let result
        if (sub) {
            // Update active subscription
            const { data, error } = await supabaseAdmin
                .from('tenant_subscriptions')
                .update({
                    limit_overrides,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sub.id)
                .select()
                .single()

            if (error) throw error
            result = data
        } else {
            // Create a custom default subscription node
            const { data, error } = await supabaseAdmin
                .from('tenant_subscriptions')
                .insert([{
                    tenant_id,
                    plan_name: 'Custom Contract',
                    plan_type: 'institute',
                    amount: 0.00,
                    billing_cycle: 'monthly',
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'active',
                    limit_overrides,
                    auto_renew: false
                }])
                .select()
                .single()

            if (error) throw error
            result = data
        }

        // 2. Mirror limits onto the tenant record itself for fast access/checks
        await supabaseAdmin
            .from('tenants')
            .update({
                max_students: limit_overrides.max_students || null,
                max_teachers: limit_overrides.max_teachers || null,
                is_white_label: limit_overrides.is_white_label || false,
                features: limit_overrides
            })
            .eq('id', tenant_id)

        return NextResponse.json({ success: true, subscription: result })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
