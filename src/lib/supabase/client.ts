import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Keep the session for ~30 days so the coach app stays signed in between visits
    { cookieOptions: { maxAge: 60 * 60 * 24 * 30 } }
  )
}
