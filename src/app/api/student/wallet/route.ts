import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// GET /api/student/wallet — returns current student's wallet (free + paid + total)
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: wallet } = await supabaseAdmin
            .from('student_wallets')
            .select('free_credits, paid_credits, total_balance, updated_at')
            .eq('student_id', user.id)
            .single()

        // Return zeroed wallet if not yet created
        return NextResponse.json(wallet ?? {
            free_credits: 0,
            paid_credits: 0,
            total_balance: 0,
            updated_at: null,
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
