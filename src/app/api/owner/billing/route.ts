import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/billing — Fetch plans, subscriptions, invoices, addons, and feature registry */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // 1. Fetch Plans (all, including archived)
        const { data: plans, error: plansErr } = await supabaseAdmin
            .from('plans')
            .select('*')
            .order('price', { ascending: true })
        if (plansErr) throw plansErr

        // 2. Fetch Tenant Subscriptions with tenant info + plan name
        const { data: subscriptions, error: subsErr } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('*, tenants(id, name, email), plans(name, price)')
            .order('created_at', { ascending: false })
        if (subsErr) throw subsErr

        const enrichedSubscriptions = (subscriptions ?? []).map((s: any) => ({
            ...s,
            plan_name: s.plan_name || s.plans?.name || null,
            amount: s.amount ?? s.plans?.price ?? 0
        }))

        // 3. Fetch Invoices
        const { data: invoices, error: invErr } = await supabaseAdmin
            .from('invoices')
            .select('*, tenants(name)')
            .order('created_at', { ascending: false })
        if (invErr) throw invErr

        // 4. Fetch Plan Addons
        const { data: addons, error: addErr } = await supabaseAdmin
            .from('plan_addons')
            .select('*')
            .order('price', { ascending: true })
        if (addErr) throw addErr

        // 5. Fetch Feature Registry (graceful fallback if table not yet migrated)
        let features: any[] = []
        try {
            const { data: featData, error: featErr } = await supabaseAdmin
                .from('plan_features')
                .select('*')
                .order('sort_order', { ascending: true })
            if (!featErr && featData && featData.length > 0) {
                features = featData
            } else {
                features = [
                    { id: '1', key: 'ai_mentor', label: 'AI Study Assistant', description: 'Personalised AI-powered study guidance for students', icon: 'Bot', category: 'AI & Smart', is_system: true, sort_order: 1 },
                    { id: '2', key: 'adaptive_exam', label: 'Online Proctored Exams', description: 'Browser-lock + webcam proctoring for online exams', icon: 'ShieldCheck', category: 'Examinations', is_system: true, sort_order: 2 },
                    { id: '3', key: 'white_label', label: 'Custom Platform Branding', description: 'Remove BeBrilliant branding and use institute logo/domain', icon: 'Palette', category: 'Customisation', is_system: true, sort_order: 3 },
                    { id: '4', key: 'live_classes', label: 'Live Classes (Video)', description: 'Host live video sessions via integrated meeting rooms', icon: 'Video', category: 'Learning', is_system: false, sort_order: 4 },
                    { id: '5', key: 'attendance', label: 'Attendance Tracking', description: 'QR / biometric attendance system with reports', icon: 'UserCheck', category: 'Core', is_system: false, sort_order: 5 },
                    { id: '6', key: 'parent_portal', label: 'Parent Portal', description: 'Dedicated parent login to track ward progress', icon: 'Users', category: 'Core', is_system: false, sort_order: 6 },
                    { id: '7', key: 'analytics_reports', label: 'Advanced Analytics', description: 'In-depth institute analytics and downloadable reports', icon: 'TrendingUp', category: 'Reporting', is_system: false, sort_order: 7 },
                    { id: '8', key: 'custom_certs', label: 'Custom Certificates', description: 'Design and issue branded digital certificates', icon: 'Award', category: 'Customisation', is_system: false, sort_order: 8 },
                    { id: '9', key: 'bulk_sms', label: 'Bulk SMS Notifications', description: 'Send SMS alerts to students, parents, and teachers', icon: 'MessageSquare', category: 'Communication', is_system: false, sort_order: 9 },
                    { id: '10', key: 'marketplace', label: 'Course Marketplace', description: 'Publish and sell courses on the BeBrilliant marketplace', icon: 'ShoppingBag', category: 'Revenue', is_system: false, sort_order: 10 }
                ]
            }
        } catch {
            // graceful fallback
        }

        return NextResponse.json({
            plans: plans ?? [],
            subscriptions: enrichedSubscriptions,
            invoices: invoices ?? [],
            addons: addons ?? [],
            features: features ?? []
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** POST /api/owner/billing — Execute administrative billing/subscription operations */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { action, payload } = body

        // ── CREATE PLAN ──────────────────────────────────────────────────────
        if (action === 'CREATE_PLAN') {
            const { data, error } = await supabaseAdmin
                .from('plans')
                .insert([{
                    ...payload,
                    features: payload.features || {},
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
        }

        // ── UPDATE PLAN ──────────────────────────────────────────────────────
        if (action === 'UPDATE_PLAN') {
            const { id, ...updates } = payload
            const { data, error } = await supabaseAdmin
                .from('plans')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json(data)
        }

        // ── DELETE / ARCHIVE PLAN ────────────────────────────────────────────
        if (action === 'DELETE_PLAN') {
            const { id, hard_delete } = payload
            if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

            if (hard_delete) {
                // Check no active subscriptions reference this plan
                const { count } = await supabaseAdmin
                    .from('tenant_subscriptions')
                    .select('id', { count: 'exact', head: true })
                    .eq('plan_id', id)
                    .eq('status', 'active')

                if ((count ?? 0) > 0) {
                    return NextResponse.json(
                        { error: 'Cannot delete a plan with active subscriptions. Archive it instead.' },
                        { status: 409 }
                    )
                }
                const { error } = await supabaseAdmin.from('plans').delete().eq('id', id)
                if (error) throw error
                return NextResponse.json({ success: true, deleted: true })
            } else {
                // Soft archive
                const { data, error } = await supabaseAdmin
                    .from('plans')
                    .update({ is_active: false, updated_at: new Date().toISOString() })
                    .eq('id', id)
                    .select()
                    .single()
                if (error) throw error
                return NextResponse.json({ success: true, plan: data })
            }
        }

        // ── RESTORE PLAN ─────────────────────────────────────────────────────
        if (action === 'RESTORE_PLAN') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
            const { data, error } = await supabaseAdmin
                .from('plans')
                .update({ is_active: true, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ success: true, plan: data })
        }

        // ── DUPLICATE PLAN ───────────────────────────────────────────────────
        if (action === 'DUPLICATE_PLAN') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

            const { data: src, error: fetchErr } = await supabaseAdmin
                .from('plans')
                .select('*')
                .eq('id', id)
                .single()
            if (fetchErr) throw fetchErr

            const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = src
            const { data, error } = await supabaseAdmin
                .from('plans')
                .insert([{
                    ...rest,
                    name: `${src.name} (Copy)`,
                    is_active: true,
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single()
            if (error) throw error
            return NextResponse.json({ success: true, plan: data })
        }

        // ── CONFIRM PAYMENT ──────────────────────────────────────────────────
        if (action === 'CONFIRM_PAYMENT') {
            const { invoice_id } = payload
            if (!invoice_id) return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 })

            const { data: invoice, error: fetchErr } = await supabaseAdmin
                .from('invoices')
                .select('*')
                .eq('id', invoice_id)
                .single()
            if (fetchErr) throw fetchErr

            const { data: updatedInvoice, error: invErr } = await supabaseAdmin
                .from('invoices')
                .update({ status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', invoice_id)
                .select()
                .single()
            if (invErr) throw invErr

            const start = new Date().toISOString()
            const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

            const { data: subscription, error: subErr } = await supabaseAdmin
                .from('tenant_subscriptions')
                .upsert({
                    tenant_id: invoice.tenant_id,
                    status: 'active',
                    amount: invoice.total_amount || invoice.amount,
                    billing_cycle: 'monthly',
                    start_date: start,
                    end_date: end,
                    auto_renew: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'tenant_id' })
                .select()
                .single()
            if (subErr) throw subErr

            return NextResponse.json({ success: true, invoice: updatedInvoice, subscription })
        }

        // ── REVOKE SUBSCRIPTION ──────────────────────────────────────────────
        if (action === 'REVOKE_SUBSCRIPTION') {
            const { id } = payload
            if (!id) return NextResponse.json({ error: 'subscription id is required' }, { status: 400 })

            const { data, error } = await supabaseAdmin
                .from('tenant_subscriptions')
                .update({ status: 'cancelled', auto_renew: false, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error

            if (data.tenant_id) {
                await supabaseAdmin
                    .from('tenants')
                    .update({ subscription_status: 'cancelled', is_active: false })
                    .eq('id', data.tenant_id)
            }

            return NextResponse.json({ success: true, subscription: data })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
