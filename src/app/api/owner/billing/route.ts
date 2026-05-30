import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: p } = await supabaseAdmin.from('user_profiles').select('role').eq('id', user.id).single()
    return (p?.role === 'owner' || p?.role === 'admin') ? user : null
}

export async function GET(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // 1. Fetch Plans
    const { data: plans } = await supabaseAdmin.from('plans').select('*').order('price', { ascending: true })

    // 2. Fetch Tenant Subscriptions
    const { data: subscriptions } = await supabaseAdmin
        .from('tenant_subscriptions')
        .select('*, tenants(name, email), plans(name, price)')
        .order('created_at', { ascending: false })

    // 3. Fetch Invoices
    const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('*, tenants(name)')
        .order('created_at', { ascending: false })

    return NextResponse.json({
        plans: plans || [],
        subscriptions: subscriptions || [],
        invoices: invoices || []
    })
}

export async function POST(request: NextRequest) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action, payload } = body

    try {
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

        if (action === 'TOGGLE_SUBSCRIPTION') {
            const { id, status } = payload
            const { data, error } = await supabaseAdmin.from('tenant_subscriptions').update({ status }).eq('id', id).select().single()
            if (error) throw error
            return NextResponse.json(data)
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
