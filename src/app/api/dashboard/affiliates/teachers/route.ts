import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyAffiliateAccess } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
        .from('affiliate_teachers')
        .select('*')
        .eq('tenant_id', (session as any).tenant_id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ teachers: data })
}

export async function POST(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { tenant_id } = session as any
    const body = await request.json()
    const { name, mobile, email, pan_details, aadhar_details, bank_details } = body

    // Create the affiliate teacher record
    const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('affiliate_teachers')
        .insert({
            tenant_id,
            name,
            mobile,
            email,
            pan_details,
            aadhar_details,
            bank_details,
            kyc_status: 'pending',
            status: 'active'
        })
        .select()
        .single()

    if (teacherError) return NextResponse.json({ error: teacherError.message }, { status: 500 })

    // Create a wallet for the teacher
    await supabaseAdmin
        .from('affiliate_wallets')
        .insert({
            affiliate_id: teacher.id,
            affiliate_type: 'teacher',
            balance: 0,
            withdrawable: 0
        })

    return NextResponse.json({ teacher })
}

export async function PATCH(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { tenant_id } = session as any
    const body = await request.json()
    const { id, kyc_status, status } = body

    const { data, error } = await supabaseAdmin
        .from('affiliate_teachers')
        .update({ kyc_status, status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('tenant_id', tenant_id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ teacher: data })
}
