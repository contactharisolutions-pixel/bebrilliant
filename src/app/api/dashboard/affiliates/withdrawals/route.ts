import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyAffiliateAccess } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { role, tenant_id } = session as any
    const { searchParams } = new URL(request.url)
    const teacher_id = searchParams.get('teacher_id')

    if (['tenant_admin', 'owner'].includes(role)) {
        // Admins can see all withdrawals for their tenant
        const { data, error } = await supabaseAdmin
            .from('affiliate_withdrawals')
            .select(`
                *,
                teacher:affiliate_teachers(id, name, email, bank_details)
            `)
            .eq('teacher:affiliate_teachers.tenant_id', tenant_id)

        if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        return NextResponse.json({ withdrawals: data })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: Request) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // In a real scenario, we'd check if the user is linked to an affiliate_teacher record
    // For this POC/Update, let's allow Admin to trigger a mock request for testing or handle actual logic
    
    const body = await request.json()
    const { teacher_id, amount } = body

    // 1. Check balance
    const { data: wallet } = await supabaseAdmin
        .from('affiliate_wallets')
        .select('*')
        .eq('affiliate_id', teacher_id)
        .eq('affiliate_type', 'teacher')
        .single()

    if (!wallet || (wallet.withdrawable || 0) < amount) {
        return NextResponse.json({ error: 'Insufficient withdrawable balance' }, { status: 400 })
    }

    // 2. Fetch TDS settings
    const { data: settings } = await supabaseAdmin
        .from('affiliate_settings')
        .select('teacher_tds_percentage')
        .eq('tenant_id', wallet.tenant_id) // We'd need to link wallet to tenant or teacher
        .single()

    const tds_pct = settings?.teacher_tds_percentage || 5.0
    const tds_amt = (amount * tds_pct) / 100
    const payable = amount - tds_amt

    // 3. Create Request
    const { data: wreq, error } = await supabaseAdmin
        .from('affiliate_withdrawals')
        .insert({
            teacher_id,
            amount_requested: amount,
            tds_deducted: tds_amt,
            amount_payable: payable,
            status: 'pending'
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    // 4. Update Withdrawable Balance (Lock it)
    await supabaseAdmin
        .from('affiliate_wallets')
        .update({
            withdrawable: wallet.withdrawable - amount,
            updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id)

    return NextResponse.json({ withdrawal: wreq })
}

export async function PATCH(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session || !['tenant_admin', 'owner'].includes((session as any).role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { tenant_id } = session as any

    const body = await request.json()
    const { id, status, bank_reference } = body // approved | rejected | paid

    const { data, error } = await supabaseAdmin
        .from('affiliate_withdrawals')
        .update({
            status,
            bank_reference,
            processed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    // If rejected, refund the wallet
    if (status === 'rejected') {
        const { data: wallet } = await supabaseAdmin
            .from('affiliate_wallets')
            .select('*')
            .eq('affiliate_id', data.teacher_id)
            .eq('affiliate_type', 'teacher')
            .single()
            
        if (wallet) {
            await supabaseAdmin.from('affiliate_wallets').update({
                withdrawable: (wallet.withdrawable || 0) + data.amount_requested
            }).eq('id', wallet.id)
        }
    }

    return NextResponse.json({ withdrawal: data })
}
