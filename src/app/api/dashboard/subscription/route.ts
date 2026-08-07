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
            max_storage_gb: p.max_storage_gb || 50,
            max_ai_tokens: p.max_ai_tokens || 1000000,
            features: [
                `${p.max_students} Students`,
                `${p.max_teachers} Teachers`,
                `${p.max_storage_gb} GB Storage`,
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
                max_students: 1000000,
                max_teachers: 100000,
                max_storage_gb: 100000,
                max_ai_tokens: 1000000000,
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
                   storage: 85, max_storage: 100,
                   ai_tokens: 2450000, max_ai_tokens: 10000000
                }
            })
        }

        // 3. Fetch Standard Tenant Subscription
        const { data: subscription, error: subError } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (subError) throw subError

        // 4. Load Purchased Addons safely
        let extraStudents = 0
        let extraTeachers = 0
        let extraStorage = 0
        let extraAiTokens = 0

        try {
            const { data: purchasedAddons } = await supabaseAdmin
                .from('tenant_purchased_addons')
                .select('*')
                .eq('tenant_id', tenant_id)
                .eq('status', 'active')

            if (purchasedAddons && purchasedAddons.length > 0) {
                const addonIds = purchasedAddons.map(pa => pa.addon_id).filter(Boolean)
                if (addonIds.length > 0) {
                    const { data: addonsList } = await supabaseAdmin
                        .from('plan_addons')
                        .select('*')
                        .in('id', addonIds)

                    const addonsMap = new Map((addonsList || []).map(a => [a.id, a]))
                    purchasedAddons.forEach((pa: any) => {
                        const addon: any = addonsMap.get(pa.addon_id)
                        if (!addon) return
                        const val = (addon.resource_value || 0) * (pa.quantity || 1)
                        if (addon.resource_type === 'students') extraStudents += val
                        if (addon.resource_type === 'teachers') extraTeachers += val
                        if (addon.resource_type === 'storage_gb') extraStorage += val
                        if (addon.resource_type === 'ai_tokens') extraAiTokens += val
                    })
                }
            }
        } catch {
            // Fallback gracefully on schema variances
        }

        // 5. Fetch actual usages from real tables
        const [studentCountRes, teacherCountRes] = await Promise.all([
            supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('role', 'student'),
            supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('role', 'teacher'),
        ])

        const currentPlanId = subscription?.plan_id || available_plans[0]?.id
        const planDetails = available_plans.find(p => p.id === currentPlanId) || available_plans[0]

        const overrides = subscription?.limit_overrides || {}
        const maxStudents = overrides.max_students !== undefined ? overrides.max_students : (planDetails?.max_students || 100) + extraStudents
        const maxTeachers = overrides.max_teachers !== undefined ? overrides.max_teachers : (planDetails?.max_teachers || 10) + extraTeachers
        const maxStorage = overrides.max_storage_gb !== undefined ? overrides.max_storage_gb : (planDetails?.max_storage_gb || 50) + extraStorage
        const maxAiTokens = overrides.max_ai_tokens !== undefined ? overrides.max_ai_tokens : (planDetails?.max_ai_tokens || 1000000) + extraAiTokens

        return NextResponse.json({
            current: {
                plan_id: currentPlanId,
                status: subscription?.status || 'active',
                renewal: subscription?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            plans: available_plans,
            usage: {
                students: studentCountRes.count ?? 0,
                max_students: maxStudents,
                teachers: teacherCountRes.count ?? 0,
                max_teachers: maxTeachers,
                storage: 15, // Mock storage in GB
                max_storage: maxStorage,
                ai_tokens: 34500,
                max_ai_tokens: maxAiTokens
            }
        })
    } catch (error: any) {
        console.error('Subscription API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

            // 1. Load details of selected plan
            const { data: plan, error: planErr } = await supabaseAdmin
                .from('plans')
                .select('*')
                .eq('id', plan_id)
                .single()
            if (planErr || !plan) return NextResponse.json({ error: 'Selected plan not found' }, { status: 404 })

            // 2. Load active subscription (if any) to check conflict
            const { data: activeSub } = await supabaseAdmin
                .from('tenant_subscriptions')
                .select('id')
                .eq('tenant_id', tenant_id)
                .eq('status', 'active')
                .maybeSingle()

            let subError
            if (activeSub) {
                const { error } = await supabaseAdmin
                    .from('tenant_subscriptions')
                    .update({
                        plan_id: plan.id,
                        plan_name: plan.name,
                        plan_type: plan.type,
                        amount: plan.price,
                        billing_cycle: plan.billing_cycle,
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        auto_renew: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', activeSub.id)
                subError = error
            } else {
                const { error } = await supabaseAdmin
                    .from('tenant_subscriptions')
                    .insert([{
                        tenant_id: tenant_id,
                        plan_id: plan.id,
                        plan_name: plan.name,
                        plan_type: plan.type,
                        amount: plan.price,
                        billing_cycle: plan.billing_cycle,
                        status: 'active',
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        auto_renew: true
                    }])
                subError = error
            }

            if (subError) throw subError

            // 3. Mirror caps onto the tenant profile
            await supabaseAdmin
                .from('tenants')
                .update({
                    is_active: true,
                    current_plan_id: plan.id,
                    subscription_plan: plan.name,
                    max_students: plan.max_students,
                    max_teachers: plan.max_teachers,
                    is_white_label: plan.features?.white_label || false
                })
                .eq('id', tenant_id)

            return NextResponse.json({ success: true })
        }

        if (action === 'CANCEL_SUBSCRIPTION') {
            if (is_owner && tenant_id === 'platform') return NextResponse.json({ error: 'Global platform sequence cannot be halted.' }, { status: 400 })

            const { error } = await supabaseAdmin
                .from('tenant_subscriptions')
                .update({ auto_renew: false, status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('tenant_id', tenant_id)
                .eq('status', 'active')

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid logic payload' }, { status: 400 })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
