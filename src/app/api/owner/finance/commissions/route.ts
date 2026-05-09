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
            .from('commission_rules')
            .select('*, tenants(name)')
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({ rules: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

export async function POST(request: Request) {
    const user = await verifyOwner()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { type, tenant_id, category, percentage } = body

        if (!type || percentage === undefined) {
            return NextResponse.json({ error: 'Type and percentage are required' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('commission_rules')
            .insert([{
                type,
                tenant_id: tenant_id || null,
                category: category || 'default',
                percentage
            }])
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ rule: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 400 })
    }
}

export async function DELETE(request: Request) {
    const user = await verifyOwner()
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
