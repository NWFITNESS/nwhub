import { NextResponse } from 'next/server'
import { getScreenByToken, resolveManifest, emptyManifest } from '@/lib/screens/queries'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/screens/[token]/manifest  — PUBLIC, unauthenticated
//
// The reception TV boots cold with no session and polls this every 30s. It must
// NEVER be cached, or the screen will never update. Next.js defaults to caching
// route handlers, so we force it dynamic AND set no-store at every CDN layer.
//
// Reads via the service role keyed on the token (getScreenByToken); the anon key
// has no RLS access to these tables. A bad/unknown token returns a plain 404,
// not an error trace.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

const NO_STORE = {
  'Cache-Control': 'no-store, must-revalidate',
  // Belt-and-braces for the Vercel edge / any CDN in front.
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
} as const

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const screen = await getScreenByToken(token)
  if (!screen || !screen.is_active) {
    return new NextResponse('Not found', { status: 404, headers: NO_STORE })
  }

  const manifest = screen.published_manifest
    ? resolveManifest(screen.published_manifest)
    : emptyManifest(screen.slug)

  return NextResponse.json(manifest, { headers: NO_STORE })
}
