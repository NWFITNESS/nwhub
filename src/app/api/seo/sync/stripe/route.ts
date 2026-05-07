import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyCronSecret, logSyncStart, logSyncEnd } from '@/lib/seo-sync'

export async function GET(req: Request) { return handler(req) }
export async function POST(req: Request) { return handler(req) }

async function handler(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ skipped: true, reason: 'STRIPE_SECRET_KEY not configured' })
  }

  const logId = await logSyncStart('stripe-attribution')
  let rowsWritten = 0

  try {
    const stripe = new Stripe(stripeKey)
    const supabase = createAdminClient()

    const { data: pages } = await supabase.from('seo_pages').select('id, url_path')
    const pageMap = new Map((pages ?? []).map(p => [p.url_path, p.id]))

    // Pull checkout sessions from last 90 minutes (overlap window)
    const since = Math.floor((Date.now() - 90 * 60 * 1000) / 1000)

    const sessions = await stripe.checkout.sessions.list({
      created: { gte: since },
      limit: 100,
      expand: ['data.line_items'],
    })

    const upsertRows: Array<{
      page_id: string
      stripe_session_id: string
      amount_pence: number
      product: string | null
      created_at: string
    }> = []

    for (const session of sessions.data) {
      // landing_url is set in metadata by the public site checkout flow
      // TODO: Ensure northernwarrior-v2 passes metadata.landing_url on checkout creation
      const landingUrl = session.metadata?.landing_url
      if (!landingUrl) continue

      // Strip domain to get path
      let urlPath: string
      try {
        urlPath = new URL(landingUrl).pathname
      } catch {
        // If it's already a path
        urlPath = landingUrl.startsWith('/') ? landingUrl : `/${landingUrl}`
      }

      const pageId = pageMap.get(urlPath)
      if (!pageId) continue

      const product = session.line_items?.data?.[0]?.description ?? null

      upsertRows.push({
        page_id: pageId,
        stripe_session_id: session.id,
        amount_pence: session.amount_total ?? 0,
        product,
        created_at: new Date(session.created * 1000).toISOString(),
      })
    }

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from('seo_stripe_conversions')
        .upsert(upsertRows, { onConflict: 'stripe_session_id' })
      if (error) console.error('[seo/sync/stripe] Upsert error:', error.message)
      else rowsWritten = upsertRows.length
    }

    await logSyncEnd(logId, rowsWritten)
    return NextResponse.json({ success: true, rows_written: rowsWritten })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[seo/sync/stripe]', message)
    await logSyncEnd(logId, rowsWritten, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
