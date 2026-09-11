import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from './admin'

const PRIMARY_JWT_SECRET = process.env.JWT_SECRET || 'BeBrilliant_SuperSecret_2026_ProdKey'
const FALLBACK_JWT_SECRET = 'b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e'

export async function createClient() {
    const cookieStore = await cookies()
    const token = cookieStore.get('bb_token')?.value

    let user: any = null
    let error: any = new Error('Not authenticated')

    if (token) {
        try {
            let decoded: any = null
            try {
                decoded = jwt.verify(token, PRIMARY_JWT_SECRET) as any
            } catch {
                decoded = jwt.verify(token, FALLBACK_JWT_SECRET) as any
            }

            if (decoded && decoded.id) {
                user = {
                    id: decoded.id,
                    email: decoded.email
                }
                error = null
            }
        } catch (e: any) {
            error = e
        }
    }

    return {
        auth: {
            getUser: async () => {
                return { data: { user }, error }
            },
            signOut: async () => {
                cookieStore.set('bb_token', '', {
                    httpOnly: true,
                    expires: new Date(0),
                    path: '/'
                })
                return { error: null }
            }
        },
        from: (table: string) => supabaseAdmin.from(table),
        rpc: (name: string, args?: any) => supabaseAdmin.rpc(name, args)
    } as any
}

