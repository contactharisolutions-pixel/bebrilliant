import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()
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

function sanitizePlanName(name: string): string {
    if (!name) return 'Standard Plan'
    if (name.toLowerCase().includes('institue') || name.toLowerCase().includes('coating')) {
        return 'Institute / Coaching'
    }
    return name
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        // 1. Fetch ALL available plans
        const { data: dbPlans } = await supabaseAdmin
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('price', { ascending: true })

        const available_plans = (dbPlans || []).map((p: any) => ({
            id: p.id,
            name: sanitizePlanName(p.name),
            raw_name: p.name,
            price: Number(p.price),
            annual_price: Math.round(Number(p.price) * 12 * 0.8), // 20% discount on annual
            max_students: p.max_students || 100,
            max_teachers: p.max_teachers || 10,
            max_storage_gb: p.max_storage_gb || 50,
            max_ai_tokens: p.max_ai_tokens || 1000000,
            features: [
                `${p.max_students?.toLocaleString()} Student Nodes Capacity`,
                `${p.max_teachers?.toLocaleString()} Faculty Slots`,
                `${p.max_storage_gb || 50} GB Cloud Storage`,
                `${((p.max_ai_tokens || 1000000) / 1000).toLocaleString()}k Monthly AI Generation Tokens`,
                ...(p.features?.ai_mentor ? ['Dynamic AI Mentor & Question Gen'] : []),
                ...(p.features?.white_label ? ['White-label Custom Domain & Branding'] : ['Standard Institutional Portal']),
                '256-Bit SSL Encrypted Database',
                'Priority SLA Email & Phone Support'
            ]
        }))

        // 2. Special Case: Owner operating at platform level
        if (is_owner && tenant_id === 'platform') {
            const masterPlan = {
                id: 'platform-master',
                name: 'Global Master Hub',
                raw_name: 'Global Master Hub',
                price: 0,
                annual_price: 0,
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
                    auto_renew: true,
                    billing_cycle: 'annual'
                },
                plans: [masterPlan, ...available_plans],
                usage: {
                   students: 4500, max_students: 10000,
                   teachers: 240, max_teachers: 500,
                   storage: 85, max_storage: 100,
                   ai_tokens: 2450000, max_ai_tokens: 10000000
                },
                invoices: [],
                billing_settings: {
                    legal_name: 'BeBrilliant Platform Technologies',
                    gstin: '08AAAAA0000A1Z5',
                    pan: 'AAAAA0000A',
                    billing_email: 'billing@bebrilliant.in',
                    billing_phone: '+91 98765 43210',
                    address: 'Level 5, Innovation Hub',
                    city: 'Jaipur',
                    state: 'Rajasthan',
                    pincode: '302020',
                    auto_renew: true
                },
                executive_summary: {
                    current_tier: 'Global Master Hub',
                    mrr_inr: 0,
                    renewal_date: 'Perpetual',
                    resource_health_pct: 45,
                    total_invoices_settled: 0,
                    total_paid_inr: 0
                }
            })
        }

        // 3. Fetch Tenant & Subscription Data
        const [tenantRes, subRes] = await Promise.all([
            supabaseAdmin.from('tenants').select('id, name, email, settings, max_students, max_teachers, max_storage_gb, max_ai_tokens, current_plan_id, subscription_plan').eq('id', tenant_id).single(),
            supabaseAdmin.from('tenant_subscriptions').select('*').eq('tenant_id', tenant_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
        ])

        const tenantData = tenantRes.data
        const subscription = subRes.data

        // 4. Fetch Tenant Invoices from PostgreSQL invoices table
        let invoices: any[] = []
        try {
            const { data: invData } = await supabaseAdmin
                .from('invoices')
                .select('*')
                .eq('tenant_id', tenant_id)
                .order('created_at', { ascending: false })
            invoices = invData || []
        } catch {
            invoices = []
        }

        // 5. Load Purchased Addons safely
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
                const addonIds = purchasedAddons.map((pa: any) => pa.addon_id).filter(Boolean)
                if (addonIds.length > 0) {
                    const { data: addonsList } = await supabaseAdmin
                        .from('plan_addons')
                        .select('*')
                        .in('id', addonIds)

                    const addonsMap = new Map((addonsList || []).map((a: any) => [a.id, a]))
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

        // 6. Fetch actual live usages from user_profiles
        let studentCount = 0
        let teacherCount = 0
        try {
            const [studentCountRes, teacherCountRes] = await Promise.all([
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('role', 'student'),
                supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('role', 'teacher'),
            ])
            studentCount = studentCountRes.count ?? 0
            teacherCount = teacherCountRes.count ?? 0
        } catch {
            studentCount = 0
            teacherCount = 0
        }

        const currentPlanId = subscription?.plan_id || tenantData?.current_plan_id || available_plans[0]?.id || 'starter'
        const planDetails = available_plans.find((p: any) => p.id === currentPlanId) || available_plans[0] || {
            id: 'starter',
            name: 'Starter Plan',
            price: 4999,
            annual_price: 47990,
            max_students: 100,
            max_teachers: 10,
            max_storage_gb: 50,
            max_ai_tokens: 1000000
        }

        const overrides = subscription?.limit_overrides || {}
        const maxStudents = overrides.max_students !== undefined ? overrides.max_students : (tenantData?.max_students || planDetails?.max_students || 100) + extraStudents
        const maxTeachers = overrides.max_teachers !== undefined ? overrides.max_teachers : (tenantData?.max_teachers || planDetails?.max_teachers || 10) + extraTeachers
        const maxStorage = overrides.max_storage_gb !== undefined ? overrides.max_storage_gb : (tenantData?.max_storage_gb || planDetails?.max_storage_gb || 50) + extraStorage
        const maxAiTokens = overrides.max_ai_tokens !== undefined ? overrides.max_ai_tokens : (tenantData?.max_ai_tokens || planDetails?.max_ai_tokens || 1000000) + extraAiTokens

        // 7. Load or default billing settings
        const tenantSettings = tenantData?.settings || {}
        const billingSettings = tenantSettings.billing || {
            legal_name: tenantData?.name || 'Institutional Academy',
            gstin: '08AABCS1234F1Z8',
            pan: 'AABCS1234F',
            billing_email: tenantData?.email || 'accounts@academy.edu',
            billing_phone: '+91 94140 12345',
            address: 'Main Campus, Institutional Area, Mansarovar',
            city: 'Jaipur',
            state: 'Rajasthan',
            pincode: '302020',
            auto_renew: subscription?.auto_renew ?? true
        }

        // 8. Executive KPI calculations
        const studentPct = Math.round((studentCount / (maxStudents || 1)) * 100)
        const teacherPct = Math.round((teacherCount / (maxTeachers || 1)) * 100)
        const resourceHealthPct = Math.max(studentPct, teacherPct)

        const totalPaidInr = invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + Number(inv.total_amount || inv.amount || 0), 0)

        const currentMonthlyPrice = Number(subscription?.amount || planDetails.price || 0)

        return NextResponse.json({
            current: {
                plan_id: currentPlanId,
                plan_name: sanitizePlanName(subscription?.plan_name || planDetails.name),
                status: subscription?.status || 'active',
                renewal: subscription?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                start_date: subscription?.start_date || new Date().toISOString(),
                auto_renew: subscription?.auto_renew ?? true,
                billing_cycle: subscription?.billing_cycle || 'monthly',
                amount: currentMonthlyPrice
            },
            plans: available_plans.length > 0 ? available_plans : [planDetails],
            usage: {
                students: studentCount,
                max_students: maxStudents,
                teachers: teacherCount,
                max_teachers: maxTeachers,
                storage: 15,
                max_storage: maxStorage,
                ai_tokens: 34500,
                max_ai_tokens: maxAiTokens
            },
            invoices: invoices.map(inv => ({
                id: inv.id,
                invoice_no: inv.invoice_no || `INV-${inv.id.substring(0, 8).toUpperCase()}`,
                plan_name: sanitizePlanName(planDetails.name),
                base_amount: Number(inv.base_amount || (inv.amount ? (inv.amount / 1.18).toFixed(2) : 0)),
                gst_amount: Number(inv.gst_amount || (inv.amount ? (inv.amount - (inv.amount / 1.18)).toFixed(2) : 0)),
                total_amount: Number(inv.total_amount || inv.amount || 0),
                gst_percent: Number(inv.gst_percent || 18.0),
                status: inv.status || 'paid',
                type: inv.type || 'subscription',
                promo_code: inv.promo_code || null,
                discount_amount: Number(inv.discount_amount || 0),
                created_at: inv.created_at,
                pdf_url: inv.pdf_url || null
            })),
            billing_settings: billingSettings,
            executive_summary: {
                current_tier: sanitizePlanName(subscription?.plan_name || planDetails.name),
                mrr_inr: currentMonthlyPrice,
                renewal_date: subscription?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                resource_health_pct: resourceHealthPct,
                total_invoices_settled: invoices.filter(i => i.status === 'paid').length,
                total_paid_inr: totalPaidInr
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

    const { tenant_id, is_owner, user } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'UPGRADE_PLAN') {
            const { plan_id, promo_code, billing_cycle = 'monthly' } = payload
            if (is_owner && tenant_id === 'platform') {
                return NextResponse.json({ success: true, message: 'Platform Master remains on Global Plan.' })
            }

            // 1. Load details of selected plan
            const { data: plan, error: planErr } = await supabaseAdmin
                .from('plans')
                .select('*')
                .eq('id', plan_id)
                .single()
            if (planErr || !plan) return NextResponse.json({ error: 'Selected plan not found' }, { status: 404 })

            // 2. Compute pricing, promo code discounts and GST
            let rawPrice = Number(plan.price)
            if (billing_cycle === 'annual') {
                rawPrice = Math.round(rawPrice * 12 * 0.8) // 20% discount on annual
            }

            let discountAmount = 0
            if (promo_code) {
                const code = promo_code.trim().toUpperCase()
                if (code === 'WELCOME30') {
                    discountAmount = Math.round(rawPrice * 0.3)
                } else if (code === 'FESTIVE50') {
                    discountAmount = Math.round(rawPrice * 0.5)
                } else if (code === 'ANNUAL20') {
                    discountAmount = Math.round(rawPrice * 0.2)
                }
            }

            const baseAmount = Math.max(0, rawPrice - discountAmount)
            const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100
            const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100

            // 3. Load active subscription (if any)
            const { data: activeSub } = await supabaseAdmin
                .from('tenant_subscriptions')
                .select('id')
                .eq('tenant_id', tenant_id)
                .eq('status', 'active')
                .maybeSingle()

            const cycleDays = billing_cycle === 'annual' ? 365 : 30
            const startDate = new Date().toISOString()
            const endDate = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000).toISOString()

            let subId = activeSub?.id

            if (activeSub) {
                const { error: updErr } = await supabaseAdmin
                    .from('tenant_subscriptions')
                    .update({
                        plan_id: plan.id,
                        plan_name: plan.name,
                        plan_type: plan.type || 'school',
                        amount: baseAmount,
                        billing_cycle: billing_cycle,
                        start_date: startDate,
                        end_date: endDate,
                        auto_renew: true,
                        status: 'active',
                        promo_code: promo_code ? promo_code.toUpperCase() : null,
                        discount_applied: discountAmount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', activeSub.id)
                if (updErr) throw updErr
            } else {
                const { data: insertedSub, error: insErr } = await supabaseAdmin
                    .from('tenant_subscriptions')
                    .insert([{
                        tenant_id: tenant_id,
                        plan_id: plan.id,
                        plan_name: plan.name,
                        plan_type: plan.type || 'school',
                        amount: baseAmount,
                        billing_cycle: billing_cycle,
                        status: 'active',
                        start_date: startDate,
                        end_date: endDate,
                        auto_renew: true,
                        promo_code: promo_code ? promo_code.toUpperCase() : null,
                        discount_applied: discountAmount
                    }])
                    .select('id')
                    .single()
                if (insErr) throw insErr
                subId = insertedSub?.id
            }

            // 4. Mirror capacity onto the tenant profile
            await supabaseAdmin
                .from('tenants')
                .update({
                    is_active: true,
                    current_plan_id: plan.id,
                    subscription_plan: plan.name,
                    max_students: plan.max_students,
                    max_teachers: plan.max_teachers,
                    max_storage_gb: plan.max_storage_gb || 50,
                    max_ai_tokens: plan.max_ai_tokens || 1000000,
                    is_white_label: plan.features?.white_label || false
                })
                .eq('id', tenant_id)

            // 5. Generate and insert real invoice record in PostgreSQL invoices table
            const invoiceDate = new Date()
            const year = invoiceDate.getFullYear()
            const month = String(invoiceDate.getMonth() + 1).padStart(2, '0')
            const day = String(invoiceDate.getDate()).padStart(2, '0')
            const randHex = Math.floor(Math.random() * 9000 + 1000)
            const generatedInvoiceNo = `INV-${year}${month}${day}-${randHex}`

            const { error: invErr } = await supabaseAdmin
                .from('invoices')
                .insert([{
                    tenant_id: tenant_id,
                    subscription_id: subId,
                    user_id: user?.id || null,
                    invoice_no: generatedInvoiceNo,
                    base_amount: baseAmount,
                    gst_amount: gstAmount,
                    total_amount: totalAmount,
                    amount: totalAmount,
                    gst_percent: 18.0,
                    status: 'paid',
                    type: 'subscription',
                    promo_code: promo_code ? promo_code.toUpperCase() : null,
                    discount_amount: discountAmount,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])

            if (invErr) {
                console.error('Invoice recording notice:', invErr)
            }

            return NextResponse.json({
                success: true,
                invoice_no: generatedInvoiceNo,
                total_amount: totalAmount,
                message: `Plan upgraded successfully to ${sanitizePlanName(plan.name)}!`
            })
        }

        if (action === 'CANCEL_SUBSCRIPTION') {
            if (is_owner && tenant_id === 'platform') {
                return NextResponse.json({ error: 'Global platform master sequence cannot be halted.' }, { status: 400 })
            }

            const { reason = 'Not specified' } = payload || {}

            const { error } = await supabaseAdmin
                .from('tenant_subscriptions')
                .update({
                    auto_renew: false,
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('tenant_id', tenant_id)
                .eq('status', 'active')

            if (error) throw error

            // Record cancellation in tenant settings
            const { data: currentTenant } = await supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single()
            const settings = currentTenant?.settings || {}
            settings.cancellation_audit = {
                cancelled_at: new Date().toISOString(),
                cancelled_by: user?.id,
                reason: reason
            }
            await supabaseAdmin.from('tenants').update({ settings }).eq('id', tenant_id)

            return NextResponse.json({ success: true, message: 'Subscription auto-renew deactivated.' })
        }

        if (action === 'TOPUP_ADDON') {
            const { resource_type, amount, price } = payload
            if (!resource_type || !amount) {
                return NextResponse.json({ error: 'Invalid top-up resource parameters' }, { status: 400 })
            }

            // Fetch tenant's current limits
            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('max_students, max_teachers, max_storage_gb, max_ai_tokens')
                .eq('id', tenant_id)
                .single()

            const updates: any = {}
            if (resource_type === 'students') {
                updates.max_students = (tenant?.max_students || 1000) + amount
            } else if (resource_type === 'teachers') {
                updates.max_teachers = (tenant?.max_teachers || 60) + amount
            } else if (resource_type === 'ai_tokens') {
                updates.max_ai_tokens = (tenant?.max_ai_tokens || 50000) + amount
            } else if (resource_type === 'storage_gb') {
                updates.max_storage_gb = (tenant?.max_storage_gb || 250) + amount
            }

            await supabaseAdmin.from('tenants').update(updates).eq('id', tenant_id)

            // Record invoice for top-up
            const baseAmount = Number(price || 999)
            const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100
            const totalAmount = Math.round((baseAmount + gstAmount) * 100) / 100
            const generatedInvoiceNo = `TOP-${Date.now().toString().slice(-6)}`

            await supabaseAdmin.from('invoices').insert([{
                tenant_id: tenant_id,
                user_id: user?.id || null,
                invoice_no: generatedInvoiceNo,
                base_amount: baseAmount,
                gst_amount: gstAmount,
                total_amount: totalAmount,
                amount: totalAmount,
                gst_percent: 18.0,
                status: 'paid',
                type: 'manual',
                created_at: new Date().toISOString()
            }])

            return NextResponse.json({
                success: true,
                message: `Successfully allocated +${amount.toLocaleString()} to ${resource_type}!`,
                invoice_no: generatedInvoiceNo
            })
        }

        if (action === 'SAVE_BILLING_SETTINGS') {
            const { billing_settings } = payload
            if (!billing_settings) return NextResponse.json({ error: 'Missing billing payload' }, { status: 400 })

            // Load current tenant settings
            const { data: tenant } = await supabaseAdmin.from('tenants').select('settings').eq('id', tenant_id).single()
            const settings = tenant?.settings || {}
            settings.billing = billing_settings

            const { error: tenantErr } = await supabaseAdmin
                .from('tenants')
                .update({ settings })
                .eq('id', tenant_id)
            if (tenantErr) throw tenantErr

            // Also synchronize auto_renew in tenant_subscriptions
            if (typeof billing_settings.auto_renew === 'boolean') {
                await supabaseAdmin
                    .from('tenant_subscriptions')
                    .update({ auto_renew: billing_settings.auto_renew, updated_at: new Date().toISOString() })
                    .eq('tenant_id', tenant_id)
                    .eq('status', 'active')
            }

            return NextResponse.json({ success: true, message: 'Billing & GST preferences saved successfully.' })
        }

        return NextResponse.json({ error: 'Invalid logic payload action' }, { status: 400 })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
