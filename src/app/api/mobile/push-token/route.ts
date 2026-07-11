import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { query } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('bb_token')?.value || request.headers.get('authorization')?.split(' ')[1]
        
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }
        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { token: pushToken, platform } = body

        if (!pushToken) {
            return NextResponse.json({ error: 'Push token required' }, { status: 400 })
        }

        // Upsert push token into mobile_push_tokens table
        await query(
            `INSERT INTO public.mobile_push_tokens (user_id, token, platform)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, token) 
             DO UPDATE SET platform = EXCLUDED.platform`,
            [decoded.id, pushToken, platform || null]
        )

        return NextResponse.json({ success: true, message: 'Push token registered successfully' })
    } catch (e: any) {
        console.error('API /mobile/push-token error:', e)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
