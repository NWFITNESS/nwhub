import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processGmailEmails } from '@/lib/gmail-processor'

// Vercel crons fire GET — UI button fires POST — both use the same handler
export async function GET(request: Request) { return handler(request) }
export async function POST(request: Request) { return handler(request) }

async function handler(request: Request) {
  const supabase = createAdminClient()

  // ── Mutex: prevent concurrent runs ────────────────────────────────────
  const LOCK_KEY = 'inbox_processing_lock'
  const LOCK_TTL = 3 * 60 * 1000
  const { data: lockData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', LOCK_KEY)
    .single()
  const lockTime = lockData?.value ? new Date(lockData.value).getTime() : 0
  if (lockTime && (Date.now() - lockTime) < LOCK_TTL) {
    return NextResponse.json({ skipped: true, reason: 'Another processing run is in progress' })
  }
  await supabase.from('global_settings').upsert(
    { key: LOCK_KEY, value: new Date().toISOString() },
    { onConflict: 'key' },
  )

  try {
    return await processEmails(request, supabase)
  } finally {
    try {
      await supabase.from('global_settings').upsert(
        { key: LOCK_KEY, value: '' },
        { onConflict: 'key' },
      )
    } catch { /* swallow */ }
  }
}

async function processEmails(request: Request, supabase: ReturnType<typeof createAdminClient>) {
  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'

  // Interval throttle (skip if too recent, unless ?force=true)
  if (!force) {
    const { data: lastProcessed } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'inbox_last_processed')
      .single()
    const { data: intervalSetting } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'inbox_process_interval')
      .single()
    const intervalMs = parseInt(String(intervalSetting?.value ?? '300000'))
    const lastTime = lastProcessed?.value ? new Date(lastProcessed.value).getTime() : 0
    if (lastTime && (Date.now() - lastTime) < intervalMs) {
      return NextResponse.json({ skipped: true, reason: 'Too soon since last run' })
    }
  }

  // Record run time
  await supabase.from('global_settings').upsert(
    { key: 'inbox_last_processed', value: new Date().toISOString() },
    { onConflict: 'key' },
  )

  // Configurable lookback — default 1d, ?lookback=7d for catch-up
  const lookback = url.searchParams.get('lookback') ?? '1d'
  const validLookback = /^\d+d$/.test(lookback) ? lookback : '1d'

  // ── Process Gmail ─────────────────────────────────────────────────────
  const result = await processGmailEmails(supabase, validLookback)

  // ── Outlook: skipped (linked Gmail account) ───────────────────────────
  result.debug.push('Outlook: skipped (linked Gmail account — all processing via Gmail)')

  return NextResponse.json({
    processed: result.processed,
    tasks_created: result.tasks_created,
    archived: result.archived,
    debug: result.debug,
  })
}
