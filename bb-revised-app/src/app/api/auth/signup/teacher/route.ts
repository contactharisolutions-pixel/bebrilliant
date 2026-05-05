import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { teacherSignupSchema } from '@/lib/validations/auth'
import { sendTeacherApplicationReceivedEmail } from '@/lib/email'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const result = teacherSignupSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { first_name, last_name, email, phone, password, tenant_id } = result.data

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

        // Check for duplicate
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

        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                role: 'teacher_pending',
                tenant_id,
            },
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        const userId = authData.user.id

        // Create profile with teacher_pending role (requires approval)
        const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
            id: userId,
            first_name,
            last_name,
            email,
            phone,
            role: 'teacher_pending',
            tenant_id,
            is_active: false, // Inactive until approved
            is_first_login: false,
        })

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: 'Failed to create teacher profile' }, { status: 500 })
        }

        sendTeacherApplicationReceivedEmail({
            email,
            firstName: first_name,
        }).catch(err => console.error('Failed to send teacher application email:', err))

        return NextResponse.json(
            {
                message: 'Teacher application submitted. Awaiting approval from your institution admin.',
                user_id: userId,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Teacher signup error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
