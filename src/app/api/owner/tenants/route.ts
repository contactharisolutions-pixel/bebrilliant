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
        if (search) query = query.ilike('name', `%${search}%`)

        const { data: tenants, error, count } = await query
        if (error) throw error

        // Enrich with user counts
        const enriched = (tenants ?? []).map((t: any) => ({
            ...t,
            total_users: t.user_profiles?.[0]?.count ?? 0,
        }))

        return NextResponse.json({ tenants: enriched, total: count ?? 0 })
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
                    subscription_status: status,
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
                    subscription_plan: 'starter'
                })
                .eq('id', id)

            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (error: any) {
        console.error('API Action Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
