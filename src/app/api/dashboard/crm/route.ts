import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyTenantAdmin() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    const { data: profile } = await supabaseAdmin.from('user_profiles').select('role, tenant_id').eq('id', user.id).single()
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
    if (!session) return NextResponse.json({ error: 'Unauthorized to view CRM' }, { status: 403 })

    const { tenant_id, is_owner } = session as any

    try {
        let leads: any[] = []
        if (is_owner && tenant_id === 'platform') {
            const { data } = await supabaseAdmin.from('owner_leads').select('*').order('created_at', { ascending: false })
            leads = data || []
        } else {
            const { data } = await supabaseAdmin.from('leads').select('*').eq('tenant_id', tenant_id).order('created_at', { ascending: false })
            leads = data || []
        }

        return NextResponse.json(leads)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const session = await verifyTenantAdmin()
    if (!session) return NextResponse.json({ error: 'Unauthorized Action' }, { status: 403 })

    const { tenant_id, is_owner } = session as any
    const body = await request.json()
    const { action, payload } = body

    const tableName = (is_owner && tenant_id === 'platform') ? 'owner_leads' : 'leads'

    try {
        if (action === 'UPDATE_STATUS') {
            const { id, status } = payload
            const { data, error } = await supabaseAdmin
                .from(tableName)
                .update({ status })
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            return NextResponse.json({ success: true, lead: data })
        }

        if (action === 'CREATE_LEAD') {
            const { name, email, phone, organization, source } = payload
            const leadData: any = { name, email, phone, status: 'lead' }

            if (tableName === 'leads') {
                leadData.tenant_id = tenant_id
                leadData.lead_score = 10
            } else {
                leadData.organization = organization || 'Direct Inquiry'
            }

            const { data, error } = await supabaseAdmin.from(tableName).insert([leadData]).select().single()
            if (error) throw error
            return NextResponse.json({ success: true, lead: data })
        }

        if (action === 'BULK_CREATE_LEADS') {
            const leadsPayload = payload
            const formatted = leadsPayload.map((l: any) => {
                const item: any = { name: l.name, email: l.email, phone: l.phone, status: 'lead' }
                if (tableName === 'leads') {
                    item.tenant_id = tenant_id
                    item.lead_score = 10
                } else {
                    item.organization = l.organization || 'Imported'
                }
                return item
            })

            const { error } = await supabaseAdmin.from(tableName).insert(formatted)
            if (error) throw error
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid logic payload' }, { status: 400 })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
