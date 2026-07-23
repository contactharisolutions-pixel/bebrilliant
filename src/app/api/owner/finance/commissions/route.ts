import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function GET() {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data, error } = await supabaseAdmin
            .from('commission_rules')
            .select('*, tenants(name)')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ rules: data || [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

export async function POST(request: Request) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { type, tenant_id, category, percentage, is_override, description } = body

        if (!type || percentage === undefined) {
            return NextResponse.json({ error: 'Type and percentage are required' }, { status: 400 })
        }

        // Validate duplicates
        const formattedTenantId = tenant_id || null
        const formattedCategory = category || 'default'

        let query = supabaseAdmin
            .from('commission_rules')
            .select('id')
            .eq('type', type)
            .eq('category', formattedCategory)

        if (formattedTenantId) {
            query = query.eq('tenant_id', formattedTenantId)
        } else {
            query = query.is('tenant_id', null)
        }

        const { data: existing } = await query.maybeSingle()

        if (existing) {
            return NextResponse.json({ error: 'A rule configuration already exists for this tenant, type, and category.' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('commission_rules')
            .insert([{
                type,
                tenant_id: formattedTenantId,
                category: formattedCategory,
                percentage,
                is_override: !!is_override,
                description: description || null
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ rule: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

export async function PUT(request: Request) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { id, type, tenant_id, category, percentage, is_override, description } = body

        if (!id || !type || percentage === undefined) {
            return NextResponse.json({ error: 'ID, type, and percentage are required' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('commission_rules')
            .update({
                type,
                tenant_id: tenant_id || null,
                category: category || 'default',
                percentage,
                is_override: !!is_override,
                description: description || null
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ rule: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

export async function DELETE(request: Request) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const { error } = await supabaseAdmin
            .from('commission_rules')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ message: 'Rule deleted successfully' })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
