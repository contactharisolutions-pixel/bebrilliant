import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/leads - List all owner leads with demos */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const classification = searchParams.get('classification')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
        .from('owner_leads')
        .select(`
      id, name, organization, email, phone, source, status, type,
      assigned_to, allocated_at, tenant_id,
      created_at, updated_at,
      demos(id, scheduled_at, status, notes)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status && status !== 'all') query = query.eq('status', status)
    if (classification && classification !== 'all') {
        const type = classification === 'institutional' ? 'INSTITUTE' : 'PERSONAL_TEACHER'
        query = query.eq('type', type)
    }
    if (priority && priority !== 'all') query = query.eq('priority', priority)
    if (search) query = query.or(`name.ilike.%${search}%,organization.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, error, count } = await query

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })

    return NextResponse.json({ leads: data ?? [], total: count ?? 0, page, pageSize: limit })
}

/** POST /api/owner/crm/leads - Create new lead */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { name, organization, email, phone, source, status, type, assigned_to } = body

    if (!name || !organization || !email) {
        return NextResponse.json({ error: 'name, organization and email are required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
        .from('owner_leads')
        .insert({ 
            name, organization, email, phone, 
            source: source || 'Manual', 
            status: status || 'new',
            type: type || 'INSTITUTE',
            assigned_to: assigned_to || null,
            allocated_at: assigned_to ? new Date().toISOString() : null
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    return NextResponse.json({ lead: data }, { status: 201 })
}
