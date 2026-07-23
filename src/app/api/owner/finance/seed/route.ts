import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('payouts.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // Find a tenant
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .limit(1)
            .single()

        if (!tenant) {
            return NextResponse.json({ error: 'No tenants found.' }, { status: 400 })
        }

        const tenant_id = tenant.id

        // Clear existing finance data to start clean
        await supabaseAdmin.from('settlements').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabaseAdmin.from('withdrawal_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabaseAdmin.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabaseAdmin.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabaseAdmin.from('tenant_wallet').delete().neq('tenant_id', '00000000-0000-0000-0000-000000000000')
        await supabaseAdmin.from('owner_wallet').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // 1. Seed tenant wallet
        const { data: wallet, error: wErr } = await supabaseAdmin
            .from('tenant_wallet')
            .upsert({
                tenant_id,
                available_balance: 12500.0,
                pending_balance: 4500.0,
                last_updated: new Date().toISOString()
            }, { onConflict: 'tenant_id' })
            .select()
            .single()

        if (wErr) throw wErr

        // 2. Seed owner wallet
        await supabaseAdmin.from('owner_wallet').insert({
            total_balance: 75000.0,
            commission_earned: 15400.0
        })

        // 3. Seed mock payments
        const mockPayments = [
            {
                tenant_id,
                user_id: user.id,
                amount: 2999.0,
                type: 'subscription',
                status: 'success',
                created_at: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
            },
            {
                tenant_id,
                user_id: user.id,
                amount: 1500.0,
                type: 'syllabus',
                status: 'success',
                created_at: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
            },
            {
                tenant_id,
                user_id: user.id,
                amount: 500.0,
                type: 'exam',
                status: 'success',
                created_at: new Date(Date.now() - 86400000 * 1).toISOString() // 1 day ago
            },
            {
                tenant_id,
                user_id: user.id,
                amount: 1000.0,
                type: 'wallet',
                status: 'success',
                created_at: new Date().toISOString()
            }
        ]

        await supabaseAdmin.from('payments').insert(mockPayments)

        // 4. Seed mock invoices
        await supabaseAdmin.from('invoices').insert([
            {
                tenant_id,
                user_id: user.id,
                amount: 2999.0,
                status: 'paid',
                type: 'subscription',
                invoice_no: `INV-${Date.now()}-1`,
                total_amount: 2999.0
            },
            {
                tenant_id,
                user_id: user.id,
                amount: 1500.0,
                status: 'paid',
                type: 'syllabus',
                invoice_no: `INV-${Date.now()}-2`,
                total_amount: 1500.0
            }
        ])

        // 5. Seed withdrawal requests
        const { data: wr1 } = await supabaseAdmin.from('withdrawal_requests').insert({
            tenant_id,
            amount: 2000.0,
            status: 'pending',
            tenant_note: 'Requesting exam proceeds payout',
            requested_at: new Date().toISOString()
        }).select().single()

        const { data: wr2 } = await supabaseAdmin.from('withdrawal_requests').insert({
            tenant_id,
            amount: 5000.0,
            status: 'settled',
            tenant_note: 'Monthly settlements cycle',
            requested_at: new Date(Date.now() - 86400000 * 4).toISOString(),
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            admin_note: 'Settled bank transfer'
        }).select().single()

        // 6. Seed corresponding settlements
        if (wr2) {
            await supabaseAdmin.from('settlements').insert({
                tenant_id,
                withdrawal_request_id: wr2.id,
                gross_amount: 5000.0,
                tds_amount: 500.0,
                processing_fees: 100.0,
                net_paid: 4400.0,
                payment_method: 'bank_transfer',
                transaction_ref: 'UTR_SEED_9988',
                status: 'completed',
                processed_at: new Date().toISOString(),
                processed_by: user.id
            })
        }

        return NextResponse.json({
            success: true,
            seeded: { wallet: 1, payments: 4, requests: 2, settlements: 1 }
        })
    } catch (e: any) {
        console.error('Seed finance error:', e)
        return NextResponse.json({ error: e.message || 'Seed failed' }, { status: 500 })
    }
}
