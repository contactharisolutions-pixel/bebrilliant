import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // Find a tenant
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .limit(1)
            .single()

        if (!tenant) {
            return NextResponse.json({ error: 'No tenants found. Create a tenant first.' }, { status: 400 })
        }

        const tenant_id = tenant.id

        // Clear existing mock data first (clean seed)
        // Keep it safe: we only clear mock records or delete all if needed
        await supabaseAdmin.from('affiliate_withdrawals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabaseAdmin.from('affiliate_wallets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabaseAdmin.from('affiliate_teachers').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // 1. Seed Teacher 1: Rajesh Kumar (Pending KYC)
        const { data: t1, error: e1 } = await supabaseAdmin.from('affiliate_teachers').insert({
            tenant_id,
            name: 'Rajesh Kumar',
            mobile: '+919876543210',
            email: 'rajesh.kumar@gmail.com',
            kyc_status: 'pending',
            status: 'active',
            pan_details: { pan: 'ABCDE1234F', name: 'RAJESH KUMAR', status: 'verified' },
            aadhar_details: { uid: '123456789012', name: 'Rajesh Kumar' },
            bank_details: { bank_name: 'State Bank of India', account_number: '100020003000', ifsc: 'SBIN0001234' }
        }).select().single()

        if (e1) throw e1

        // 2. Seed Teacher 2: Sunita Sharma (Approved KYC)
        const { data: t2, error: e2 } = await supabaseAdmin.from('affiliate_teachers').insert({
            tenant_id,
            name: 'Sunita Sharma',
            mobile: '+919876543211',
            email: 'sunita.sharma@gmail.com',
            kyc_status: 'approved',
            status: 'active',
            pan_details: { pan: 'FGHIJ5678K', name: 'SUNITA SHARMA', status: 'verified' },
            aadhar_details: { uid: '987654321098', name: 'Sunita Sharma' },
            bank_details: { bank_name: 'HDFC Bank', account_number: '987654321012', ifsc: 'HDFC0000456' }
        }).select().single()

        if (e2) throw e2

        // 3. Seed wallets for both
        await supabaseAdmin.from('affiliate_wallets').insert([
            {
                affiliate_id: t1.id,
                affiliate_type: 'teacher',
                balance: 2500,
                withdrawable: 2000
            },
            {
                affiliate_id: t2.id,
                affiliate_type: 'teacher',
                balance: 5000,
                withdrawable: 3500
            }
        ])

        // 4. Seed Withdrawal requests
        // Pending withdrawal for Rajesh
        await supabaseAdmin.from('affiliate_withdrawals').insert({
            teacher_id: t1.id,
            amount_requested: 500,
            tds_deducted: 25,
            amount_payable: 475,
            status: 'pending',
            requested_at: new Date().toISOString()
        })

        // Paid/processed withdrawal for Sunita
        await supabaseAdmin.from('affiliate_withdrawals').insert({
            teacher_id: t2.id,
            amount_requested: 1500,
            tds_deducted: 75,
            amount_payable: 1425,
            status: 'paid',
            bank_reference: 'UTR123456789',
            requested_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            processed_at: new Date().toISOString()
        })

        return NextResponse.json({
            success: true,
            seeded: { teachers: 2, wallets: 2, withdrawals: 2 }
        })
    } catch (e: any) {
        console.error('Seed affiliates error:', e)
        return NextResponse.json({ error: e.message || 'Seed failed' }, { status: 500 })
    }
}
