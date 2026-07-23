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

        const PLATFORM_ROLES = ['owner', 'sales_exec', 'demo_exec', 'onboarding_spec']
        if (!callerProfile || !PLATFORM_ROLES.includes(callerProfile.role)) {
            return NextResponse.json({ error: 'Level 1 Clearance Required' }, { status: 403 })
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
        const tenant_type = (body.tenant_type as string) || 'institute'
        const rawSubdomain = (body.subdomain as string) || name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        // Clean subdomain to keep alphanumeric and dashes only
        const subdomain = rawSubdomain.replace(/[^a-z0-9-]/g, '')
        const lead_id = body.lead_id || null

        // Create the tenant record first with subdomain and plan limits config
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .insert({
                name,
                type,
                email,
                tenant_type,
                subdomain,
                is_active: true,
                subscription_status: 'active',
                max_students: body.max_students || 100,
                max_teachers: body.max_teachers || 10,
                is_white_label: body.is_white_label || false
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

        if (adminAuthError || !adminAuth?.user) {
            // Rollback tenant
            await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
            return NextResponse.json({ error: adminAuthError?.message || 'Failed to create admin user' }, { status: 400 })
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

        // Handle CRM Lead conversion and create Onboarding Checklist
        try {
            let assignedStaffId = null
            if (lead_id) {
                const { data: leadData } = await supabaseAdmin
                    .from('owner_leads')
                    .select('assigned_to')
                    .eq('id', lead_id)
                    .single()
                if (leadData?.assigned_to) {
                    assignedStaffId = leadData.assigned_to
                }

                // Update Lead Status to converted
                await supabaseAdmin
                    .from('owner_leads')
                    .update({ 
                        tenant_id: tenant.id, 
                        status: 'converted',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', lead_id)
            }

            // Create Onboarding Checklist
            await supabaseAdmin
                .from('onboarding_checklists')
                .insert({
                    tenant_id: tenant.id,
                    assigned_staff_id: assignedStaffId || user.id,
                    tasks: [
                        { title: "DNS & Domain Mapping Setup", completed: false },
                        { title: "Institute Logo & Theme Selection", completed: false },
                        { title: "Subscription/Billing Plan Configuration", completed: false },
                        { title: "First Academic Year & Master Syllabus Initialization", completed: false },
                        { title: "Payment Gateway Credentials Set", completed: false },
                        { title: "Final Verification and Handover", completed: false }
                    ],
                    notes: lead_id ? `Provisioned from CRM lead: ${lead_id}` : 'Manually provisioned'
                })
        } catch (onboardingErr) {
            console.error("Failed to execute onboarding lifecycle steps:", onboardingErr)
        }

        sendTenantCreatedEmail({
            adminEmail: email,
            adminFirstName: admin_first_name,
            password: admin_password,
            tenantName: name,
            subdomain: subdomain,
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
