import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

// POST /api/owner/wallet-config/bulk - Bulk credit/debit wallets
export async function POST(request: NextRequest) {
    try {
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { demographic, amount, credit_type, expiry_days, notes } = body

        if (!demographic || amount === undefined || !credit_type) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 })
        }

        // Build target demographic query
        let query = supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('role', 'student')

        if (demographic.type === 'specific_tenant') {
            query = query.eq('tenant_id', demographic.value)
        }

        const { data: students, error: fetchErr } = await query
        if (fetchErr) return NextResponse.json({ error: 'Failed to fetch target demographic.' }, { status: 500 })

        if (!students || students.length === 0) {
            return NextResponse.json({ success: true, count: 0, message: 'No students matched this demographic.' })
        }

        const amt = Number(amount)
        const expiry = expiry_days ? Number(expiry_days) : null

        let successCount = 0
        for (const student of students) {
            const { data, error } = await supabaseAdmin.rpc('credit_wallet', {
                p_student_id: student.id,
                p_amount: amt,
                p_credit_type: credit_type,
                p_source: 'manual_bulk',
                p_reference: null,
                p_notes: notes || 'Manual bulk grant',
                p_expiry_days: expiry
            })

            if (!error) {
                successCount++
            }
        }

        return NextResponse.json({ success: true, count: successCount })
    } catch (e: any) {
        console.error("Bulk wallet allocation API error:", e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
