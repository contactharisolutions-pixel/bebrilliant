import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/billing — Fetch plans, active tenant subscriptions, and invoices for Super Admin panel */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // 1. Fetch Plans
        const { data: plans, error: plansErr } = await supabaseAdmin
            .from('plans')
            .select('*')
            .order('price', { ascending: true })
        if (plansErr) throw plansErr

        // 2. Fetch Tenant Subscriptions with dynamic plans mapping resolved
        const { data: subscriptions, error: subsErr } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('*, tenants(id, name, email)')
            .order('created_at', { ascending: false })
        if (subsErr) throw subsErr

        // 3. Fetch Invoices
        const { data: invoices, error: invErr } = await supabaseAdmin
            .from('invoices')
            .select('*, tenants(name)')
            .order('created_at', { ascending: false })
        if (invErr) throw invErr

        // 4. Fetch plan addons
        const { data: addons, error: addErr } = await supabaseAdmin
            .from('plan_addons')
            .select('*')
            .order('price', { ascending: true })
        if (addErr) throw addErr

        return NextResponse.json({
            plans: plans ?? [],
            subscriptions: subscriptions ?? [],
            invoices: invoices ?? [],
            addons: addons ?? []
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

        if (action === 'CREATE_PLAN') {
            const { data, error } = await supabaseAdmin.from('plans').insert([payload]).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'UPDATE_PLAN') {
            const { id, ...updates } = payload
            const { data, error } = await supabaseAdmin.from('plans').update(updates).eq('id', id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        if (action === 'CONFIRM_PAYMENT') {
            const { invoice_id } = payload
            if (!invoice_id) return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 })

            // 1. Fetch the invoice
            const { data: invoice, error: fetchErr } = await supabaseAdmin
                .from('invoices')
                .select('*')
                .eq('id', invoice_id)
                .single()
            if (fetchErr) throw fetchErr

            // 2. Mark invoice as paid
            const { data: updatedInvoice, error: invErr } = await supabaseAdmin
                .from('invoices')
                .update({ status: 'paid', updated_at: new Date().toISOString() })
                .eq('id', invoice_id)
                .select()
                .single()
            if (invErr) throw invErr

            // 3. Create or extend the active tenant subscription
            const start = new Date().toISOString()
            const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days default
            
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

            // Mirror status to tenant record
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
