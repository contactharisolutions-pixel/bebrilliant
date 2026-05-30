import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyAffiliateAccess } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('affiliate_students')
        .select(`
            id,
            status,
            created_at,
            student:user_profiles!student_id(id, first_name, last_name, email, metadata)
        `)
        .eq('tenant_id', (session as any).tenant_id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ affiliates: data })
}

export async function POST(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { student_id } = await request.json()
    const tenant_id = (session as any).tenant_id

    // 1. Activate student as affiliate
    const { data: affiliate, error: affError } = await supabaseAdmin
        .from('affiliate_students')
        .insert({
            student_id,
            tenant_id,
            status: 'active'
        })
        .select()
        .single()

    if (affError) return NextResponse.json({ error: affError.message }, { status: 500 })

    // 2. Create student affiliate wallet (locked credits)
    await supabaseAdmin
        .from('affiliate_wallets')
        .insert({
            affiliate_id: student_id,
            affiliate_type: 'student',
            balance: 0,
            withdrawable: 0 // Students cannot withdraw
        })

    return NextResponse.json({ affiliate })
}
