import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getReceptionScreen, getSlidesForScreen } from '@/lib/screens/queries'
import { ScreensPageClient } from './ScreensPageClient'

// ─────────────────────────────────────────────────────────────────────────────
// /screens — admin (gated). Mirrors the repo's per-page auth guard (see
// staff/page.tsx): there is no middleware, so the redirect lives here. This is
// the admin editor; the PUBLIC display lives at /screen/[token], deliberately
// OUTSIDE the (dashboard) group so it never runs this guard.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export default async function ScreensPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const screen = await getReceptionScreen()
  const slides = screen ? await getSlidesForScreen(screen.id) : []

  return <ScreensPageClient screen={screen} slides={slides} />
}
