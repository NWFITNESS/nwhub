import { notFound } from 'next/navigation'
import { getScreenByToken, resolveManifest, emptyManifest } from '@/lib/screens/queries'
import { ScreenPlayer } from './ScreenPlayer'

// ─────────────────────────────────────────────────────────────────────────────
// /screen/[token]  — PUBLIC display route (NO AUTH)
//
// This route lives OUTSIDE the (dashboard) route group on purpose, so the
// dashboard's auth layout never runs. The mini PC opens it full-screen in Chrome
// kiosk on boot with no session. The only protection is the opaque token.
//
// NOTE (differs from the brief): NWHub has no middleware.ts — dashboard pages are
// gated by a per-page `if (!user) redirect('/login')`, not a middleware matcher.
// So the brief's §6a "risky middleware allowlist" doesn't apply; route-group
// separation gives the same guarantee more simply. /screens (admin) stays inside
// (dashboard) and is gated; /screen/ (display) is public by virtue of living
// outside it.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Northern Warrior — Screen' }

export default async function ScreenDisplayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const screen = await getScreenByToken(token)
  if (!screen || !screen.is_active) notFound()

  // Seed the first paint so there's content on the very first frame.
  const initial = screen.published_manifest
    ? resolveManifest(screen.published_manifest)
    : emptyManifest(screen.slug)

  return <ScreenPlayer token={token} initial={initial} />
}
