import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        // Direct postgres query to fetch auth.users
        const { rows: userRows } = await query(
            'SELECT id, email, encrypted_password FROM auth.users WHERE LOWER(email) = LOWER($1)',
            [email]
        )

        if (userRows.length === 0) {
            return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
        }

        const user = userRows[0]

        // Compare bcrypt password
        const isMatch = await bcrypt.compare(password, user.encrypted_password)
        if (!isMatch) {
            return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
        }

        // Fetch user profile
        const { rows: profileRows } = await query(
            'SELECT role, tenant_id, is_first_login, is_active, first_name, last_name FROM public.user_profiles WHERE id = $1',
            [user.id]
        )

        if (profileRows.length === 0) {
            console.error('Login profile lookup error: profile not found for user ID:', user.id)
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        const profile = profileRows[0]

        if (!profile.is_active) {
            return NextResponse.json(
                { error: 'Your account is inactive. Please contact your administrator.' },
                { status: 403 }
            )
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: profile.role, tenant_id: profile.tenant_id },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        // Set JWT HTTP-only cookie
        const cookieStore = await cookies()
        cookieStore.set('bb_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
        })

        return NextResponse.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: profile.role,
                tenant_id: profile.tenant_id,
                is_first_login: profile.is_first_login,
                first_name: profile.first_name,
                last_name: profile.last_name,
            },
            requires_password_change: profile.is_first_login,
        })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

