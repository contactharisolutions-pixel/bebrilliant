import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
    if (!profile) return null

    // Platform Owner bypass
    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true }
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        // 1. Fetch ALL available plans
        const { data: dbPlans } = await supabaseAdmin.from('plans').select('*').eq('is_active', true)
        const available_plans = (dbPlans || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            max_students: p.max_students || 100,
            max_teachers: p.max_teachers || 10,
            tokens: (p.max_students || 100) * 1000,
            features: [
                `${p.max_students} Students`,
                `${p.max_teachers} Teachers`,
                ...(p.features?.ai_mentor ? ['AI Mentor Access'] : []),
                ...(p.features?.white_label ? ['Whitelabeling'] : [])
            ]
        }))

        // 2. Special Case: Owner operating at platform level
        if (is_owner && tenant_id === 'platform') {
            const masterPlan = {
                id: 'platform-master',
                name: 'Global Master Hub',
                price: 0,
                tokens: 1000000000,
                features: ['Full Multi-Tenant Access', 'Super Admin Control', 'Global Analytics', 'Sub-Instance Provisioning']
            }
            return NextResponse.json({
                current: {
                    plan_id: 'platform-master',
                    status: 'active',
                    renewal: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                },
                plans: [masterPlan, ...available_plans],
                usage: {
                   students: 4500, max_students: 10000,
                   teachers: 240, max_teachers: 500,
                   storage: 85, max_storage: 100
                }
            })
        }

        // 3. Fetch Standard Tenant Subscription (Fixed: No join to avoid "Desynchronization Error")
        const { data: subscription, error: subError } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (subError) throw subError

        // 4. Manually reconcile plan details
        const currentPlanId = subscription?.plan_id || 'starter-node'
        const planDetails = available_plans.find(p => p.id === currentPlanId)

        return NextResponse.json({
            current: {
                plan_id: currentPlanId,
                status: subscription?.status || 'active',
                renewal: subscription?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            plans: available_plans,
            usage: {
                students: Math.floor(Math.random() * (planDetails?.max_students || 100)),
                max_students: planDetails?.max_students || 100,
                teachers: Math.floor(Math.random() * (planDetails?.max_teachers || 10)),
                max_teachers: planDetails?.max_teachers || 10,
                storage: 14,
                max_storage: 50
            }
        })
    } catch (error: any) {
        console.error('Subscription API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'UPGRADE_PLAN') {
            const { plan_id } = payload
            if (is_owner && tenant_id === 'platform') return NextResponse.json({ success: true, message: 'Platform Master remains on Global Plan.' })

            const { error: subError } = await supabaseAdmin
                .from('tenant_subscriptions')
                .upsert({
                    tenant_id: tenant_id,
                    plan_id: plan_id,
                    status: 'active',
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    auto_renew: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id' })

            if (subError) throw subError
            await supabaseAdmin.from('tenants').update({ is_active: true, current_plan_id: plan_id }).eq('id', tenant_id)

            return NextResponse.json({ success: true })
        }

        if (action === 'CANCEL_SUBSCRIPTION') {
            if (is_owner && tenant_id === 'platform') return NextResponse.json({ error: 'Global platform sequence cannot be halted.' }, { status: 400 })

            const { error } = await supabaseAdmin
                .from('tenant_subscriptions')
                .update({ auto_renew: false, status: 'cancelled' })
                .eq('tenant_id', tenant_id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid logic payload' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
