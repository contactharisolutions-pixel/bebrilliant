import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/leads/[id]/timeline — Full lifecycle timeline for a lead */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const { data: events, error } = await supabaseAdmin
            .from('lifecycle_timeline')
            .select('*, staff:staff_id(first_name, last_name, email, role)')
            .eq('lead_id', params.id)
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: 'Failed to load timeline.' }, { status: 500 })
        return NextResponse.json({ timeline: events ?? [] })

    } catch (err) {
        console.error('GET /timeline error:', err)
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
    }
}

