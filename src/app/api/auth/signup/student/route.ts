import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { studentSignupSchema } from '@/lib/validations/auth'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const result = studentSignupSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { first_name, last_name, email, phone } = result.data
        const { tenant_id } = body

        if (!tenant_id) {
            return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
        }

        // Verify tenant exists and is active
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .select('id, is_active')
            .eq('id', tenant_id)
            .single()

        if (tenantError || !tenant) {
            return NextResponse.json({ error: 'Invalid tenant' }, { status: 400 })
        }

        if (!tenant.is_active) {
            return NextResponse.json({ error: 'This institution is not active' }, { status: 403 })
        }

        // Check for duplicate email
        const { data: existingUser } = await supabaseAdmin
            .from('user_profiles')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            )
        }

        // Create auth user — password is phone number (temporary)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: phone,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                role: 'student',
                tenant_id,
            },
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        const userId = authData.user.id

        // Create user profile
        const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
            id: userId,
            first_name,
            last_name,
            email,
            phone,
            role: 'student',
            tenant_id,
            is_active: true,
            is_first_login: true,
        })

        if (profileError) {
            // Rollback auth user creation
            await supabaseAdmin.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
        }

        // Send email asynchronously (don't block the response loop if it takes a moment)
        sendWelcomeEmail({
            email,
            firstName: first_name,
            password: phone,
            role: 'student',
        }).catch(err => console.error('Failed to send student welcome email:', err))

        return NextResponse.json(
            {
                message: 'Student account created successfully',
                user_id: userId,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Student signup error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
