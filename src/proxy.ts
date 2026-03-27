import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  // Vercel cron / internal routes — protected by CRON_SECRET header, no session needed
  const cronSecret = process.env.CRON_SECRET
  const isCronRequest =
    (pathname === '/api/digest/send' || pathname === '/api/inbox/process') &&
    cronSecret &&
    request.headers.get('authorization') === `Bearer ${cronSecret}`

  // Public API routes — no auth required
  const isPublicApi =
    pathname === '/api/chat' ||
    pathname.startsWith('/api/chat/') ||
    pathname === '/api/analytics/track' ||  // public tracking beacon from public website
    pathname === '/api/email/unsubscribe' || // token-based unsubscribe, no session needed
    !!isCronRequest                          // internal cron routes with valid secret

  if (!user && !isLoginPage && !isAuthPage && !isPublicBlog && !isPublicApi) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)'],
}
