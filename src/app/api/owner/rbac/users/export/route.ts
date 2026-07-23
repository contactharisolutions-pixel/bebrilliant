import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPlatformAccess } from '@/lib/platform-auth'

/** GET /api/owner/rbac/users/export — Export filtered users as CSV */
export async function GET(request: NextRequest) {
    const user = await verifyPlatformAccess('settings.manage')
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role') || 'all'
    const tenantFilter = searchParams.get('tenant') || 'all'
    const search = searchParams.get('search') || ''

    let q = supabaseAdmin
        .from('user_profiles')
        .select('id, first_name, last_name, email, role, tenant_id, is_active, created_at, department, last_login_at')
        .order('created_at', { ascending: false })

    if (roleFilter !== 'all') q = q.eq('role', roleFilter)
    if (tenantFilter !== 'all') q = q.eq('tenant_id', tenantFilter)
    if (search) q = q.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)

    const { data: users } = await q

    const header = ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Tenant ID', 'Status', 'Department', 'Last Login', 'Joined']
    const rows = (users ?? []).map(u => [
        u.id,
        u.first_name ?? '',
        u.last_name ?? '',
        u.email ?? '',
        u.role,
        u.tenant_id ?? '',
        u.is_active ? 'Active' : 'Suspended',
        (u as any).department ?? '',
        (u as any).last_login_at ?? '',
        u.created_at,
    ])

    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="users-export-${Date.now()}.csv"`,
        }
    })
}
