import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { data } = await supabaseAdmin.from('cart_items').select('*').eq('student_id', user.id)
    return NextResponse.json({ items: data || [] })
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { item_id, type, price, tenant_id } = await request.json()

    try {
        const { data, error: cErr } = await supabaseAdmin
            .from('cart_items')
            .insert({
                student_id: user.id,
                tenant_id,
                item_type: type, // 'exam' or 'syllabus'
                item_id,
                price
            })
            .select()
            .single()
        
        if (cErr) throw cErr
        return NextResponse.json({ success: true, item: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const { error: dErr } = await supabaseAdmin.from('cart_items').delete().eq('id', id).eq('student_id', user.id)
    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 })
    
    return NextResponse.json({ success: true })
}
