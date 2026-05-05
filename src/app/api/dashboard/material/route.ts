import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

import { verifyTenantStaff } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { tenant_id, role } = session
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const search = url.searchParams.get('search')

    try {
        let query = supabaseAdmin
            .from('study_materials')
            .select('*')
            .order('created_at', { ascending: false })

        if (tenant_id) {
            query = query.eq('tenant_id', tenant_id)
        } else if (role !== 'owner' && role !== 'student') {
            return NextResponse.json([])
        }

        if (type && type !== 'all') query = query.eq('type', type)
        if (search) query = query.ilike('title', `%${search}%`)

        const { data, error } = await query
        if (error) {
            console.error('Study Material query fail:', error.message)
            return NextResponse.json([]) // Graceful fallback
        }

        return NextResponse.json(data || [])
    } catch (e: any) {
        return NextResponse.json([]) // Critical fallback
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantStaff()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { tenant_id, user } = session
    const { action, payload } = await request.json()

    try {
        if (action === 'CREATE_ASSET') {
            const { error } = await supabaseAdmin
                .from('study_materials')
                .insert([{
                    ...payload,
                    tenant_id,
                    created_by: user.id
                }])
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        if (action === 'DELETE_ASSET') {
            const { id } = payload
            const { error } = await supabaseAdmin
                .from('study_materials')
                .delete()
                .eq('id', id)
                .eq('tenant_id', tenant_id)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
