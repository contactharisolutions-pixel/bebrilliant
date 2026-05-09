import { createClient } from '@supabase/supabase-js'

/**
 * Admin client — bypasses RLS.
 * NEVER import this in client components or expose to the browser.
 * Only use in server-side API routes or server actions.
 */
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
)
