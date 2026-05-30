import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createTenantSchema } from '@/lib/validations/auth'
import { sendTenantCreatedEmail } from '@/lib/email'

/**
 * Tenant Creation — Owner Only
 * No public signup. Only authenticated owners can call this.
 */
export async function POST(request: Request) {
    try {
        // Auth check — only 'owner' role can create tenants
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (callerProfile?.role !== 'owner') {
            return NextResponse.json({ error: 'Only owners can create tenants' }, { status: 403 })
        }

        const body = await request.json()
        const result = createTenantSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { name, type, email, admin_first_name, admin_last_name, admin_password } = result.data
        // tenant_type from body (not in Zod schema — pass through directly)
        const tenant_type = (body.tenant_type as string) || 'institute'

        // Create the tenant record first
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .insert({
                name,
                type,
                email,
                tenant_type,
                is_active: true,
                subscription_status: 'active',
            })
            .select()
            .single()

        if (tenantError) {
            return NextResponse.json({ error: 'Failed to create tenant: ' + tenantError.message }, { status: 500 })
        }

        // Create the tenant admin auth user
        const { data: adminAuth, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: admin_password,
            email_confirm: true,
            user_metadata: {
                first_name: admin_first_name,
                last_name: admin_last_name,
                role: 'tenant_admin',
                tenant_id: tenant.id,
            },
        })

        if (adminAuthError) {
            // Rollback tenant
            await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
            return NextResponse.json({ error: adminAuthError.message }, { status: 400 })
        }

        // Create tenant admin profile
        const { error: adminProfileError } = await supabaseAdmin.from('user_profiles').insert({
            id: adminAuth.user.id,
            first_name: admin_first_name,
            last_name: admin_last_name,
            email,
            role: 'tenant_admin',
            tenant_id: tenant.id,
            is_active: true,
            is_first_login: true,
        })

        if (adminProfileError) {
            // Rollback
            await supabaseAdmin.auth.admin.deleteUser(adminAuth.user.id)
            await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
            return NextResponse.json({ error: 'Failed to create admin profile' }, { status: 500 })
        }

        sendTenantCreatedEmail({
            adminEmail: email,
            adminFirstName: admin_first_name,
            password: admin_password,
            tenantName: name,
        }).catch(err => console.error('Failed to send tenant created email:', err))

        return NextResponse.json(
            {
                message: 'Tenant created successfully',
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    type: tenant.type,
                },
                admin: {
                    id: adminAuth.user.id,
                    email,
                },
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Create tenant error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET() {
    try {
        // Anyone can list active tenants (for signup forms)
        const { data, error } = await supabaseAdmin
            .from('tenants')
            .select('id, name, type')
            .eq('is_active', true)
            .order('name')

        if (error) {
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        return NextResponse.json({ tenants: data })
    } catch (error) {
        console.error('Get tenants error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
