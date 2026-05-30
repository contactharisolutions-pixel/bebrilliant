import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/student/wallet/transactions?page=1&limit=20&type=free|paid
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(req.url)
        const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
        const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
        const type  = searchParams.get('type') // 'free' | 'paid' | null

        let query = supabaseAdmin
            .from('wallet_transactions')
            .select('*', { count: 'exact' })
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1)

        if (type === 'free' || type === 'paid') {
            query = query.eq('credit_type', type)
        }

        const { data, error: txnErr, count } = await query

        if (txnErr) return NextResponse.json({ error: txnErr.message }, { status: 500 })

        return NextResponse.json({
            transactions: data ?? [],
            total: count ?? 0,
            page,
            limit,
            total_pages: Math.ceil((count ?? 0) / limit),
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
