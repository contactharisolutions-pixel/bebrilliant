import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/finance/plans/addons — List all plan addons */
export async function GET() {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data, error } = await supabaseAdmin
            .from('plan_addons')
            .select('*')
            .order('price', { ascending: true })

        if (error) throw error

        return NextResponse.json({ addons: data ?? [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** POST /api/owner/finance/plans/addons — Create a new plan addon */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { name, price, billing_cycle, resource_type, resource_value, is_active } = body

        if (!name || price === undefined || !resource_type || resource_value === undefined) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('plan_addons')
            .insert([{
                name,
                price,
                billing_cycle: billing_cycle || 'monthly',
                resource_type,
                resource_value,
                is_active: is_active ?? true
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ addon: data }, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** PATCH /api/owner/finance/plans/addons — Edit/toggle plan addon */
export async function PATCH(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

        const { data, error } = await supabaseAdmin
            .from('plan_addons')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ addon: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
