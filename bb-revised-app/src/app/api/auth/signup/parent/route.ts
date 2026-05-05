import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { parentSignupSchema } from '@/lib/validations/auth'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const result = parentSignupSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: result.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { first_name, last_name, email, phone, password } = result.data
        const { tenant_id } = body

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

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
                role: 'parent',
                tenant_id: tenant_id || null,
            },
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        const userId = authData.user.id

        const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
            id: userId,
            first_name,
            last_name,
            email,
            phone,
            role: 'parent',
            tenant_id: tenant_id || null,
            is_active: true,
            is_first_login: false,
        })

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(userId)
            return NextResponse.json({ error: 'Failed to create parent profile' }, { status: 500 })
        }

        sendWelcomeEmail({
            email,
            firstName: first_name,
            role: 'parent',
        }).catch(err => console.error('Failed to send parent welcome email:', err))

        return NextResponse.json(
            {
                message: 'Parent account created successfully',
                user_id: userId,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Parent signup error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
