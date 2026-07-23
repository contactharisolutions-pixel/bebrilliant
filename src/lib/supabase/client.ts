import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/supabase` 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://bebrilliant.in') + '/api/supabase'

  return createBrowserClient(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

