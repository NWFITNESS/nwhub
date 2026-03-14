import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Lightweight beacon endpoint — called from the public website to record page views.
// Accepts POST with JSON body { path, referrer? } or query params for <img> pixel fallback.
// Uses service-role client to bypass RLS for inserts.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const path = body.path || '/'
    const referrer = body.referrer || req.headers.get('referer') || null
    const userAgent = req.headers.get('user-agent') || null
    const country = req.headers.get('x-vercel-ip-country') || null

    const supabase = createAdminClient()
    await supabase.from('page_views').insert({
      path,
      referrer,
      user_agent: userAgent,
      country,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 }) // fail silently — never block the user
  }
}

// Allow GET as a pixel/beacon fallback: <img src="/api/analytics/track?path=/about" />
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path') || '/'
  const referrer = req.headers.get('referer') || null
  const userAgent = req.headers.get('user-agent') || null
  const country = req.headers.get('x-vercel-ip-country') || null

  const supabase = createAdminClient()
  await supabase.from('page_views').insert({
    path,
    referrer,
    user_agent: userAgent,
    country,
  })

  // Return a 1×1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )
  return new NextResponse(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
