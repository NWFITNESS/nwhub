import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getScreens, getScreenById, getSlidesForScreen } from '@/lib/screens/queries'
import { ScreensPageClient } from './ScreensPageClient'

// ─────────────────────────────────────────────────────────────────────────────
// /screens — admin (gated). Mirrors the repo's per-page auth guard (see
// staff/page.tsx): there is no middleware, so the redirect lives here. This is
// the admin editor; the PUBLIC display lives at /screen/[token], deliberately
// OUTSIDE the (dashboard) group so it never runs this guard.
//
// Multi-screen: ?screen=<id> selects which display to edit; defaults to the
// first (Reception, the seed).
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export default async function ScreensPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const screens = await getScreens()
  const { screen: requestedId } = await searchParams

  const selected =
    (requestedId ? await getScreenById(requestedId) : null) ?? screens[0] ?? null
  const slides = selected ? await getSlidesForScreen(selected.id) : []

  return <ScreensPageClient screens={screens} screen={selected} slides={slides} />
}
