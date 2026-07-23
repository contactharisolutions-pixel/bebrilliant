import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/crm/leads/export — Export leads as CSV */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    let q = supabaseAdmin
        .from('owner_leads')
        .select('id, name, organization, email, phone, source, status, type, lead_score, priority, expected_value, expected_close_date, tags, created_at, updated_at')
        .order('created_at', { ascending: false })

    if (status && status !== 'all') q = q.eq('status', status)
    if (search) q = q.or(`name.ilike.%${search}%,organization.ilike.%${search}%,email.ilike.%${search}%`)

    const { data: leads } = await q

    const header = ['ID', 'Name', 'Organization', 'Email', 'Phone', 'Source', 'Status', 'Type', 'Score', 'Priority', 'Expected Value', 'Close Date', 'Tags', 'Created']
    const rows = (leads ?? []).map(l => [
        l.id, l.name, l.organization, l.email, l.phone ?? '', l.source ?? '', l.status, l.type,
        l.lead_score, l.priority, l.expected_value ?? '', l.expected_close_date ?? '',
        (l.tags as any[] ?? []).join('; '), l.created_at,
    ])

    const csv = [header, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="crm-leads-export-${Date.now()}.csv"`,
        }
    })
}

/** POST /api/owner/crm/leads/export — Import leads from CSV with duplicate detection */
export async function POST(request: NextRequest) {
    const user = await verifyPlatformAccess('crm.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { leads: rawLeads } = body  // Array of lead objects from parsed CSV

        if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
            return NextResponse.json({ error: 'leads array is required' }, { status: 400 })
        }

        // Fetch all existing emails and orgs for duplicate detection
        const { data: existingLeads } = await supabaseAdmin
            .from('owner_leads')
            .select('email, organization')

        const existingEmails = new Set((existingLeads ?? []).map(l => l.email.toLowerCase()))
        const existingOrgs = new Set((existingLeads ?? []).map(l => l.organization.toLowerCase()))

        const results = { imported: 0, skipped: 0, duplicates: [] as any[] }

        for (const raw of rawLeads) {
            const email = (raw.email || '').toLowerCase().trim()
            const org = (raw.organization || '').toLowerCase().trim()

            // Detect duplicates by email OR organization name
            if (existingEmails.has(email) || (org && existingOrgs.has(org))) {
                results.skipped++
                results.duplicates.push({ email: raw.email, organization: raw.organization, reason: existingEmails.has(email) ? 'Duplicate email' : 'Duplicate organization' })
                continue
            }

            const { error } = await supabaseAdmin.from('owner_leads').insert({
                name: raw.name || 'Unknown',
                organization: raw.organization || '',
                email: raw.email || '',
                phone: raw.phone || null,
                source: raw.source || 'Import',
                status: raw.status || 'new',
                type: raw.type || 'INSTITUTE',
                priority: raw.priority || 'medium',
                lead_score: parseInt(raw.lead_score) || 0,
                expected_value: parseFloat(raw.expected_value) || null,
            })

            if (!error) {
                results.imported++
                existingEmails.add(email)
                if (org) existingOrgs.add(org)
            } else {
                results.skipped++
            }
        }

        return NextResponse.json(results, { status: 201 })
    } catch (err: any) {
        console.error('POST /crm/leads/export error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
