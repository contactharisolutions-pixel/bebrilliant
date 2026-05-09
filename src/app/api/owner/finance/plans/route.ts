import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyOwner() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    const { data: profile } = await supabaseAdmin
        .from('user_profiles').select('role').eq('id', user.id).single()
    return (profile?.role === 'owner' || profile?.role === 'admin') ? user : null
}

export async function GET() {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data, error } = await supabaseAdmin
            .from('plans')
            .select('*')
            .order('price', { ascending: true })

        if (error) throw error

        return NextResponse.json({ plans: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

export async function POST(request: Request) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { name, type, price, billing_cycle, max_students, max_teachers, features, is_active } = body

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
                features: features || { ai_mentor: false, adaptive_exam: false, white_label: false },
                is_active: is_active ?? true,
                updated_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ plan: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

export async function PATCH(request: Request) {
    const user = await verifyOwner()
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
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}
