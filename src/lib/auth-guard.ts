import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Verifies the caller has an active Supabase session.
 * Use at the top of every admin API route handler.
 *
 * Returns `null` if authorised, or a pre-built 401 NextResponse if not.
 *
 * Example:
 *   const unauth = await requireAuth()
 *   if (unauth) return unauth
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // read-only in API routes
      },
    }
  )

  // getUser() validates the JWT server-side — safer than getSession()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  return null
}
