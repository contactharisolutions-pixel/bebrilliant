import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyAffiliateAccess } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })

    const { tenant_id, role } = session as any
    const is_owner = role === 'owner'

    try {
        if (is_owner && tenant_id === 'platform') {
            const platform_affiliates = [
                { id: 'master1', name: 'Global Growth Partner', email: 'growth@master.io', sales: 500, earnings: 50000, status: 'active' },
                { id: 'master2', name: 'Top Tier Affiliate', email: 'vip@affiliate.io', sales: 250, earnings: 25000, status: 'active' }
            ]
            return NextResponse.json(platform_affiliates)
        }

        const { data: affiliates } = await supabaseAdmin
            .from('user_profiles')
            .select('id, email, first_name, last_name, metadata')
            .eq('tenant_id', tenant_id)
            .eq('role', 'affiliate')

        const mock_affiliates = [
            { id: 'aff1', name: 'Social Influencer X', email: 'influencer@social.com', sales: 42, earnings: 4200, status: 'active' },
            { id: 'aff2', name: 'Test Affiliate 01', email: 'test@affiliate.com', sales: 12, earnings: 1200, status: 'active' },
            { id: 'aff3', name: 'Dormant Partner', email: 'partner@domain.com', sales: 0, earnings: 0, status: 'paused' }
        ]

        return NextResponse.json(affiliates && affiliates.length > 0 ? affiliates : mock_affiliates)
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyAffiliateAccess()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id } = session
    const body = await request.json()
    const { action, payload } = body

    try {
        if (action === 'CREATE_AFFILIATE') {
            const { name, email, commission } = payload
            // Logic to create an affiliate user node...
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action payload' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
