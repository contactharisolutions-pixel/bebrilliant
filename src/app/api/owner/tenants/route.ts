import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const tenant_type = searchParams.get('tenant_type')
        const search = searchParams.get('search') || ''

        let query = supabaseAdmin
            .from('tenants')
            .select(`*, user_profiles!user_profiles_tenant_id_fkey(count)`, { count: 'exact' })
            .order('created_at', { ascending: false })

        if (status === 'active') query = query.eq('is_active', true)
        if (status === 'suspended') query = query.eq('is_active', false)
        if (tenant_type && tenant_type !== 'all') query = query.eq('tenant_type', tenant_type)
        if (search) {
            query = query.or(`name.ilike.%${search}%,subdomain.ilike.%${search}%,email.ilike.%${search}%`)
        }

        const { data: tenants, error, count } = await query
        if (error) throw error

        // 2. Fetch Active Plans from DB
        const { data: plansData } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true })
        const plans = plansData ?? []

        // 3. Fetch Plan Features Registry
        const { data: featData } = await supabaseAdmin
            .from('plan_features')
            .select('*')
            .order('sort_order', { ascending: true })
        const planFeatures = featData ?? []

        // 4. Enrich Tenants with user count, capacity fallbacks, and linked plan info
        const enriched = (tenants ?? []).map((t: any) => {
            const matchedPlan = plans.find((p: any) => p.id === t.current_plan_id) || 
                                plans.find((p: any) => p.name?.toLowerCase() === t.subscription_plan?.toLowerCase()) || null;
            return {
                ...t,
                total_users: t.user_profiles?.[0]?.count ?? 0,
                max_storage_gb: t.max_storage_gb ?? matchedPlan?.max_storage_gb ?? 50,
                max_ai_tokens: t.max_ai_tokens ?? matchedPlan?.max_ai_tokens ?? 25000,
                subscription_plan: t.subscription_plan || matchedPlan?.name || 'School (Basic)',
                current_plan_id: t.current_plan_id || matchedPlan?.id || null,
                current_plan: matchedPlan
            }
        })

        return NextResponse.json({
            tenants: enriched,
            total: count ?? 0,
            plans,
            planFeatures
        })
    } catch (error: any) {
        console.error('Tenant list error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'TOGGLE_STATUS') {
            const { id, is_active, status } = payload
            const { error } = await supabaseAdmin
                .from('tenants')
                .update({
                    is_active,
                    subscription_status: status || (is_active ? 'active' : 'suspended'),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'APPROVE_TENANT') {
            const { id } = payload
            const { error } = await supabaseAdmin
                .from('tenants')
                .update({
                    subscription_status: 'active',
                    is_active: true,
                    subscription_plan: 'School (Basic)'
                })
                .eq('id', id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'ASSIGN_PLAN') {
            const { tenant_id, plan_id, apply_defaults } = payload
            const { data: plan, error: planErr } = await supabaseAdmin
                .from('plans')
                .select('*')
                .eq('id', plan_id)
                .single()

            if (planErr || !plan) {
                return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
            }

            const updateData: any = {
                current_plan_id: plan.id,
                subscription_plan: plan.name,
                updated_at: new Date().toISOString()
            }

            if (apply_defaults) {
                updateData.max_students = plan.max_students || 500
                updateData.max_teachers = plan.max_teachers || 25
                updateData.max_storage_gb = plan.max_storage_gb || 50
                updateData.max_ai_tokens = plan.max_ai_tokens || 25000
                if (plan.features) {
                    updateData.features = plan.features
                }
            }

            const { error: tenantUpdateErr } = await supabaseAdmin
                .from('tenants')
                .update(updateData)
                .eq('id', tenant_id)

            if (tenantUpdateErr) throw tenantUpdateErr

            // Also synchronize active tenant_subscriptions record
            const { error: subUpsertErr } = await supabaseAdmin
                .from('tenant_subscriptions')
                .upsert({
                    tenant_id,
                    plan_id: plan.id,
                    plan_name: plan.name,
                    plan_type: plan.type,
                    amount: plan.price,
                    status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id' })

            if (subUpsertErr) {
                console.warn('Subscription upsert notice:', subUpsertErr.message)
            }

            return NextResponse.json({ success: true, plan })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (error: any) {
        console.error('API Action Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
