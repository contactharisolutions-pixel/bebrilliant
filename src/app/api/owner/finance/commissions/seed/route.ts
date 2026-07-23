import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        // Clear all current rules
        await supabaseAdmin.from('commission_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // Fetch a tenant
        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .limit(1)
            .single()

        const tenant_id = tenant?.id || null

        // Seed Global defaults
        const seedData: any[] = [
            {
                type: 'global',
                percentage: 15.0,
                category: 'default',
                is_override: false,
                description: 'Global standard fallback commission rate'
            },
            {
                type: 'subscription',
                percentage: 100.0,
                category: 'default',
                is_override: false,
                description: 'Licenses fees are fully owned by the platform'
            },
            {
                type: 'exam',
                percentage: 12.0,
                category: 'default',
                is_override: false,
                description: 'Standard base mock exam sales commission rate'
            }
        ]

        if (tenant_id) {
            seedData.push({
                type: 'exam',
                percentage: 8.0,
                tenant_id,
                category: 'custom_deal',
                is_override: true,
                description: 'Discounted rate override for strategic partners'
            })
        }

        const { data, error } = await supabaseAdmin
            .from('commission_rules')
            .insert(seedData)
            .select()

        if (error) throw error

        return NextResponse.json({
            success: true,
            seeded: data.length
        })
    } catch (e: any) {
        console.error('Seed commissions error:', e)
        return NextResponse.json({ error: e.message || 'Seed failed' }, { status: 500 })
    }
}
