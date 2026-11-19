import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { maxAge: 60 * 60 * 24 * 30 },  // ~30-day rolling sessions
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'

  // Auth pages — no session required
  const isAuthPage =
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/auth/')

  // Public blog pages — no auth required
  const isPublicBlog =
    pathname === '/blog' ||
    (pathname.startsWith('/blog/') && !pathname.startsWith('/blog/manage'))

  // Coach app — self-authenticating (magic link); renders its own login when
  // logged out, so it must NOT be bounced to the admin /login page. The PWA
  // manifest is fetched by the browser while logged out, so it must stay public
  // too — otherwise it 307s to /login, the browser discards it, and falls back
  // to the admin manifest (installs the wrong app).
  const isCoachApp =
    pathname === '/coach' ||
    pathname.startsWith('/coach/') ||
    pathname === '/coach.webmanifest'

  // Vercel cron / internal routes — protected by CRON_SECRET header, no session needed
  const cronSecret = process.env.CRON_SECRET
  const isCronRequest =
    (pathname === '/api/digest/send' || pathname === '/api/inbox/process' || pathname === '/api/coach-rota/reminders/send') &&
    cronSecret &&
    request.headers.get('authorization') === `Bearer ${cronSecret}`

  // Public API routes — no auth required
  const isPublicApi =
    pathname === '/api/chat' ||
    pathname.startsWith('/api/chat/') ||
    pathname === '/api/analytics/track' ||   // public tracking beacon from public website
    pathname === '/api/email/unsubscribe' || // token-based unsubscribe, no session needed
    pathname === '/api/gcal/connect' ||      // OAuth initiation — browser redirect, no body
    pathname === '/api/gcal/callback' ||     // OAuth callback from Google — no session cookie sent back
    pathname === '/api/gmail/webhook' ||     // Google push notification (validated separately)
    pathname.startsWith('/api/webhooks/') || // external inbound webhooks (e.g. WodBoard)
    pathname === '/api/branding/schedule/process' || // cron job (uses CRON_SECRET)
    !!isCronRequest                          // internal cron routes with valid secret

  if (!user && !isLoginPage && !isAuthPage && !isPublicBlog && !isPublicApi && !isCoachApp) {
    // API consumers must receive 401 JSON — never redirect them to /login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)'],
}
