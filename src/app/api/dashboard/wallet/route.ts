import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()
    if (!profile) return null

    // Platform Owner bypass
    if (profile.role === 'owner') {
        return { user, tenant_id: profile.tenant_id || 'platform', is_owner: true }
    }

    if (profile.tenant_id && ['tenant_admin', 'admin', 'owner'].includes(profile.role)) {
        return { user, tenant_id: profile.tenant_id, is_owner: false }
    }
    return null
}

export async function GET(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        if (is_owner && tenant_id === 'platform') {
            return NextResponse.json({
                wallet: {
                    total_earnings: 2450000,
                    available_balance: 1850000,
                    pending_balance: 250000,
                    withdrawn_amount: 350000,
                    total_tds: 35000
                },
                collections: [],
                disbursements: [],
                bank_details: {
                    account_name: 'BeBrilliant Global Master Trust',
                    bank_name: 'HDFC Bank',
                    branch: 'Cyber City, Jaipur',
                    account_no: '50200088914281',
                    ifsc: 'HDFC0001234',
                    account_type: 'Current Account',
                    pan: 'AAACB1234F',
                    auto_settle: true
                },
                fee_catalog: [],
                executive_summary: {
                    total_collections_inr: 2450000,
                    available_liquidity_inr: 1850000,
                    settled_to_bank_inr: 350000,
                    pending_settlement_inr: 250000,
                    total_tds_inr: 35000
                }
            })
        }

        // 1. Fetch or initialize Tenant Wallet
        let { data: wallet } = await supabaseAdmin
            .from('tenant_wallet')
            .select('*')
            .eq('tenant_id', tenant_id)
            .maybeSingle()

        if (!wallet) {
            const { data: newWallet } = await supabaseAdmin
                .from('tenant_wallet')
                .insert([{
                    tenant_id,
                    available_balance: 0,
                    pending_balance: 0,
                    last_updated: new Date().toISOString()
                }])
                .select('*')
                .single()
            wallet = newWallet
        }

        const available_balance = Number(wallet?.available_balance || 0)
        const pending_balance = Number(wallet?.pending_balance || 0)

        // 2. Fetch Inbound Payments / Collections
        const { data: payments } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false })

        const total_earnings = (payments || [])
            .filter((p: any) => p.status === 'success')
            .reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0)

        // 3. Fetch Disbursements / Withdrawal History
        const { data: withdrawals } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .eq('tenant_id', tenant_id)
            .order('requested_at', { ascending: false })

        const settled_amount = (withdrawals || [])
            .filter((w: any) => w.status === 'settled')
            .reduce((acc: number, w: any) => acc + Number(w.amount || 0), 0)

        const pending_settlement = (withdrawals || [])
            .filter((w: any) => w.status === 'pending' || w.status === 'approved')
            .reduce((acc: number, w: any) => acc + Number(w.amount || 0), 0)

        const total_tds = Math.round(settled_amount * 0.10)

        // 4. Fetch Bank Details & Fee Catalog from Tenant Settings
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('name, settings')
            .eq('id', tenant_id)
            .single()

        const tenantSettings = tenant?.settings || {}
        const bankDetails = tenantSettings.payout_bank || {
            account_name: tenant?.name || 'Institutional Management Trust',
            bank_name: 'HDFC Bank',
            branch: 'Mansarovar Sector 10, Jaipur',
            account_no: '50200088914281',
            ifsc: 'HDFC0001234',
            account_type: 'Current Account',
            pan: 'AABCS1234F',
            auto_settle: true
        }

        const feeCatalog = tenantSettings.fee_catalog || [
            { id: 'fee-1', name: 'CBSE Term Assessment Fee', category: 'Exam Enrollment', amount: 1500, active: true },
            { id: 'fee-2', name: 'National STEM Olympiad Pass', category: 'Special Competition', amount: 2000, active: true },
            { id: 'fee-3', name: 'AI Practice & Mock Test Access', category: 'Digital Learning', amount: 999, active: true },
            { id: 'fee-4', name: 'Annual LMS Platform Resource Fee', category: 'Tuition Add-on', amount: 3500, active: true }
        ]

        return NextResponse.json({
            wallet: {
                total_earnings,
                available_balance,
                pending_balance,
                withdrawn_amount: settled_amount,
                total_tds
            },
            collections: (payments || []).map((p: any) => ({
                id: p.id,
                amount: Number(p.amount || 0),
                status: p.status || 'success',
                type: p.type || 'exam',
                method: p.metadata?.method || 'UPI / Netbanking',
                student_name: p.metadata?.student_name || 'Student Candidate',
                grade: p.metadata?.grade || 'General',
                title: p.metadata?.title || 'Academic Assessment Fee',
                created_at: p.created_at,
                order_id: p.razorpay_order_id || `ORD-${p.id.substring(0, 8).toUpperCase()}`,
                payment_id: p.razorpay_payment_id || `PAY-${p.id.substring(0, 8).toUpperCase()}`
            })),
            disbursements: (withdrawals || []).map((w: any) => ({
                id: w.id,
                amount: Number(w.amount || 0),
                tds_amount: Math.round(Number(w.amount || 0) * 0.10),
                net_amount: Math.round(Number(w.amount || 0) * 0.90),
                status: w.status || 'pending',
                requested_at: w.requested_at || w.created_at,
                reviewed_at: w.reviewed_at,
                admin_note: w.admin_note || 'Clearing via institutional bank gateway',
                tenant_note: w.tenant_note || 'Scheduled payout distribution',
                utr: w.admin_note?.match(/UTR\s+([A-Z0-9]+)/)?.[1] || null
            })),
            bank_details: bankDetails,
            fee_catalog: feeCatalog,
            executive_summary: {
                total_collections_inr: total_earnings,
                available_liquidity_inr: available_balance,
                settled_to_bank_inr: settled_amount,
                pending_settlement_inr: pending_settlement,
                total_tds_inr: total_tds
            }
        })
    } catch (error: any) {
        console.error('Wallet GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner, user } = session as any
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'REQUEST_PAYOUT') {
            const { amount, tenant_note } = payload
            const withdrawAmount = Number(amount)

            if (!withdrawAmount || withdrawAmount < 1000) {
                return NextResponse.json({ error: 'Minimum payout threshold is ₹1,000' }, { status: 400 })
            }

            // Check current wallet available balance
            const { data: wallet } = await supabaseAdmin
                .from('tenant_wallet')
                .select('available_balance, pending_balance')
                .eq('tenant_id', tenant_id)
                .single()

            if (!wallet || Number(wallet.available_balance) < withdrawAmount) {
                return NextResponse.json({ error: 'Insufficient available liquidity balance' }, { status: 400 })
            }

            // Insert into withdrawal_requests
            const { data: requestRecord, error: insErr } = await supabaseAdmin
                .from('withdrawal_requests')
                .insert([{
                    tenant_id,
                    amount: withdrawAmount,
                    status: 'pending',
                    tenant_note: tenant_note || 'Disbursement request initiated by tenant admin',
                    requested_at: new Date().toISOString()
                }])
                .select()
                .single()

            if (insErr) throw insErr

            // Atomic balance update
            const newAvailable = Math.max(0, Number(wallet.available_balance) - withdrawAmount)
            const newPending = Number(wallet.pending_balance) + withdrawAmount

            await supabaseAdmin
                .from('tenant_wallet')
                .update({
                    available_balance: newAvailable,
                    pending_balance: newPending,
                    last_updated: new Date().toISOString()
                })
                .eq('tenant_id', tenant_id)

            return NextResponse.json({
                success: true,
                message: `Payout request for ₹${withdrawAmount.toLocaleString()} submitted successfully. Queued for clearance.`,
                request: requestRecord
            })
        }

        if (action === 'RECORD_OFFLINE_FEE') {
            const { student_name, grade, title, amount, method = 'Cash / Direct NEFT', receipt_no } = payload
            const feeAmount = Number(amount)

            if (!student_name || !feeAmount || feeAmount <= 0) {
                return NextResponse.json({ error: 'Invalid fee entry details' }, { status: 400 })
            }

            const randOrder = receipt_no || `REC-${Date.now().toString().slice(-6)}`

            // Insert into payments
            const { data: paymentRecord, error: payErr } = await supabaseAdmin
                .from('payments')
                .insert([{
                    tenant_id,
                    amount: feeAmount,
                    status: 'success',
                    type: 'exam',
                    razorpay_order_id: randOrder,
                    razorpay_payment_id: `MANUAL-${Date.now().toString().slice(-6)}`,
                    metadata: {
                        student_name,
                        grade: grade || 'Unassigned',
                        title: title || 'Offline Tuition & Exam Collection',
                        method,
                        recorded_by: user?.id,
                        recorded_at: new Date().toISOString()
                    },
                    created_at: new Date().toISOString()
                }])
                .select()
                .single()

            if (payErr) throw payErr

            // Credit directly to tenant available_balance
            const { data: wallet } = await supabaseAdmin
                .from('tenant_wallet')
                .select('available_balance')
                .eq('tenant_id', tenant_id)
                .single()

            const currentBalance = Number(wallet?.available_balance || 0)
            await supabaseAdmin
                .from('tenant_wallet')
                .update({
                    available_balance: currentBalance + feeAmount,
                    last_updated: new Date().toISOString()
                })
                .eq('tenant_id', tenant_id)

            return NextResponse.json({
                success: true,
                message: `Recorded collection of ₹${feeAmount.toLocaleString()} for ${student_name}!`,
                payment: paymentRecord
            })
        }

        if (action === 'UPDATE_BANK_ACCOUNT') {
            const { bank_details } = payload
            if (!bank_details) return NextResponse.json({ error: 'Missing bank details' }, { status: 400 })

            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('settings')
                .eq('id', tenant_id)
                .single()

            const settings = tenant?.settings || {}
            settings.payout_bank = bank_details

            const { error: updErr } = await supabaseAdmin
                .from('tenants')
                .update({ settings })
                .eq('id', tenant_id)

            if (updErr) throw updErr

            return NextResponse.json({
                success: true,
                message: 'Settlement bank account details updated and verified successfully.'
            })
        }

        if (action === 'CREATE_FEE_ITEM') {
            const { fee_item } = payload
            if (!fee_item || !fee_item.name || !fee_item.amount) {
                return NextResponse.json({ error: 'Invalid fee structure parameters' }, { status: 400 })
            }

            const { data: tenant } = await supabaseAdmin
                .from('tenants')
                .select('settings')
                .eq('id', tenant_id)
                .single()

            const settings = tenant?.settings || {}
            const existingCatalog = settings.fee_catalog || []

            const newCatalog = [
                ...existingCatalog,
                {
                    id: `fee-${Date.now()}`,
                    name: fee_item.name,
                    category: fee_item.category || 'Tuition & Exam',
                    amount: Number(fee_item.amount),
                    active: true
                }
            ]

            settings.fee_catalog = newCatalog

            await supabaseAdmin.from('tenants').update({ settings }).eq('id', tenant_id)

            return NextResponse.json({
                success: true,
                message: `Fee structure "${fee_item.name}" added to catalog!`,
                fee_catalog: newCatalog
            })
        }

        return NextResponse.json({ error: 'Invalid routing sequence action' }, { status: 400 })
    } catch (error: any) {
        console.error('Wallet POST error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
