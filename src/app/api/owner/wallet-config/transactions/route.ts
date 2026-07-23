import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

// GET /api/owner/wallet-config/transactions - Fetch transaction ledger list
export async function GET(request: NextRequest) {
    try {
        const user = await verifyPlatformAccess('payouts.manage')
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const source = searchParams.get('source') || 'all'
        const type = searchParams.get('type') || 'all' // free or paid
        const search = searchParams.get('search') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = 25
        const offset = (page - 1) * limit

        let query = supabaseAdmin
            .from('wallet_transactions')
            .select(`
                id, student_id, tenant_id, credit_type, txn_type, amount, balance_after, source, notes, created_at,
                user_profiles!wallet_transactions_student_id_fkey(first_name, last_name, email),
                tenants!wallet_transactions_tenant_id_fkey(name, type)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (source !== 'all') query = query.eq('source', source)
        if (type !== 'all') query = query.eq('credit_type', type)

        const { data: txns, error, count } = await query

        if (error) {
            console.error("Fetch transactions error:", error)
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        // Filter search on JS side (student name/email/notes)
        let filtered = txns || []
        if (search) {
            const term = search.toLowerCase()
            filtered = filtered.filter((t: any) => {
                const s = t.user_profiles || {}
                return (
                    (s.first_name || '').toLowerCase().includes(term) ||
                    (s.last_name || '').toLowerCase().includes(term) ||
                    (s.email || '').toLowerCase().includes(term) ||
                    (t.notes || '').toLowerCase().includes(term)
                )
            })
        }

        return NextResponse.json({
            transactions: filtered,
            total: count || 0
        })
    } catch (e: any) {
        console.error("GET transactions API error:", e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
