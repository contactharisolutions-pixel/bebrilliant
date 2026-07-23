import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/finance/plans — List all plans sorted by price */
export async function GET() {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data, error } = await supabaseAdmin
            .from('plans')
            .select('*')
            .order('price', { ascending: true })

        if (error) throw error

        return NextResponse.json({ plans: data ?? [] })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** POST /api/owner/finance/plans — Create a new plan tier with quotas */
export async function POST(request: Request) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { name, type, price, billing_cycle, max_students, max_teachers, max_storage_gb, max_ai_tokens, features, is_active } = body

        if (!name || price === undefined) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('plans')
            .insert([{
                name,
                type: type || 'institute',
                price,
                billing_cycle: billing_cycle || 'monthly',
                max_students: max_students || 0,
                max_teachers: max_teachers || 0,
                max_storage_gb: max_storage_gb || 50,
                max_ai_tokens: max_ai_tokens || 1000000,
                features: features || { ai_mentor: false, adaptive_exam: false, white_label: false },
                is_active: is_active ?? true,
                updated_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ plan: data }, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

/** PATCH /api/owner/finance/plans — Update plan config */
export async function PATCH(request: Request) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const { data, error } = await supabaseAdmin
            .from('plans')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ plan: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
