import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'
import { pool } from '@/lib/db'

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
            query = query.or(`name.ilike.%${search}%,subdomain.ilike.%${search}%,email.ilike.%${search}%,domain.ilike.%${search}%`)
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

        // 4. Fetch Tenant Subscriptions
        const { data: allSubscriptions } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('*')
            .order('created_at', { ascending: false })

        // 5. Enrich Tenants with active subscription, real-time capacities, and plan info
        const enriched = (tenants ?? []).map((t: any) => {
            // Locate active subscription for tenant
            const activeSub = (allSubscriptions ?? []).find(
                (s: any) => s.tenant_id === t.id && s.status === 'active'
            ) || (allSubscriptions ?? []).find(
                (s: any) => s.tenant_id === t.id
            ) || null

            // Match active plan by subscription plan_id or current_plan_id or name
            const matchedPlan = (activeSub?.plan_id ? plans.find((p: any) => p.id === activeSub.plan_id) : null) ||
                                plans.find((p: any) => p.id === t.current_plan_id) || 
                                plans.find((p: any) => p.name?.toLowerCase() === (activeSub?.plan_name || t.subscription_plan)?.toLowerCase()) || null

            const overrides = activeSub?.limit_overrides || {}

            // Effective capacities dynamically resolved from active subscription plan
            const effectiveMaxStudents = overrides.max_students ?? matchedPlan?.max_students ?? t.max_students ?? 1000
            const effectiveMaxTeachers = overrides.max_teachers ?? matchedPlan?.max_teachers ?? t.max_teachers ?? 60
            const effectiveMaxStorageGb = overrides.max_storage_gb ?? matchedPlan?.max_storage_gb ?? t.max_storage_gb ?? 250
            const effectiveMaxAiTokens = overrides.max_ai_tokens ?? matchedPlan?.max_ai_tokens ?? t.max_ai_tokens ?? 50000

            const effectivePlanName = activeSub?.plan_name || matchedPlan?.name || t.subscription_plan || 'School (Standard)'
            const effectiveSubStatus = activeSub?.status || t.subscription_status || 'active'

            return {
                ...t,
                total_users: t.user_profiles?.[0]?.count ?? 0,
                max_students: effectiveMaxStudents,
                max_teachers: effectiveMaxTeachers,
                max_storage_gb: effectiveMaxStorageGb,
                max_ai_tokens: effectiveMaxAiTokens,
                subscription_plan: effectivePlanName,
                subscription_status: effectiveSubStatus,
                current_plan_id: matchedPlan?.id || t.current_plan_id || null,
                current_plan: matchedPlan,
                active_subscription: activeSub
            }
        })

        // 6. Calculate live platform KPI metrics
        let schoolsCount = 0
        let institutesCount = 0
        let educatorsCount = 0
        let activeCount = 0
        let suspendedCount = 0
        let totalStudentCapacity = 0
        let totalTeacherCapacity = 0
        let totalStorageGb = 0

        enriched.forEach((t: any) => {
            const type = (t.tenant_type || t.type || '').toLowerCase()
            if (type.includes('school')) schoolsCount++
            else if (type.includes('institute')) institutesCount++
            else educatorsCount++

            if (t.is_active && t.subscription_status !== 'suspended') activeCount++
            else suspendedCount++

            totalStudentCapacity += Number(t.max_students || 0)
            totalTeacherCapacity += Number(t.max_teachers || 0)
            totalStorageGb += Number(t.max_storage_gb || 0)
        })

        // 6. Check for completed onboarding/training institutions not yet provisioned as tenants
        let unprovisionedCandidates: any[] = []
        try {
            const { rows: candidateRows } = await pool.query(`
                SELECT oc.id as onboarding_case_id, oc.organization_name, oc.lead_id, oc.completed_at,
                       tc.id as training_case_id, tc.status as training_status
                FROM public.onboarding_cases oc
                LEFT JOIN public.training_cases tc ON tc.onboarding_case_id = oc.id
                WHERE (oc.tenant_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = oc.tenant_id))
                ORDER BY oc.updated_at DESC
                LIMIT 10
            `)
            unprovisionedCandidates = candidateRows
        } catch (candidateErr) {
            console.warn('Unable to query candidate tenants:', candidateErr)
        }

        return NextResponse.json({
            tenants: enriched,
            total: count ?? 0,
            plans,
            planFeatures,
            metrics: {
                total: enriched.length,
                schoolsCount,
                institutesCount,
                educatorsCount,
                activeCount,
                suspendedCount,
                totalStudentCapacity,
                totalTeacherCapacity,
                totalStorageGb,
                activePlansCount: plans.length,
                featureModulesCount: planFeatures.length
            },
            unprovisionedCandidates
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
                    billing_cycle: plan.billing_cycle || 'monthly',
                    start_date: new Date().toISOString(),
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'active',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id' })

            if (subUpsertErr) {
                console.warn('Subscription upsert notice:', subUpsertErr.message)
            }

            return NextResponse.json({ success: true, plan })
        }

        if (action === 'RESET_PASSWORD') {
            const { tenant_id, new_password } = payload
            if (!tenant_id || !new_password) {
                return NextResponse.json({ error: 'Tenant ID and new password are required.' }, { status: 400 })
            }

            // Find primary tenant admin profile
            const { data: adminProfile } = await supabaseAdmin
                .from('user_profiles')
                .select('id, email')
                .eq('tenant_id', tenant_id)
                .in('role', ['tenant_admin', 'admin'])
                .order('created_at', { ascending: true })
                .limit(1)
                .single()

            if (!adminProfile) {
                return NextResponse.json({ error: 'No tenant admin found for this account.' }, { status: 404 })
            }

            const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(
                adminProfile.id,
                { password: new_password }
            )

            if (updateAuthErr) {
                return NextResponse.json({ error: 'Failed to update auth password: ' + updateAuthErr.message }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                message: 'Admin password updated successfully.',
                email: adminProfile.email
            })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (error: any) {
        console.error('API Action Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
