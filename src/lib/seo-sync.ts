import { createAdminClient } from '@/lib/supabase/admin'

/** Log the start of a sync worker run. Returns the row ID. */
export async function logSyncStart(worker: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('seo_sync_log')
    .insert({ worker, started_at: new Date().toISOString() })
    .select('id')
    .single()
  return data?.id ?? null
}

/** Log the end of a sync worker run. */
export async function logSyncEnd(logId: number | null, rowsWritten: number, error?: string) {
  if (!logId) return
  const supabase = createAdminClient()
  await supabase
    .from('seo_sync_log')
    .update({ finished_at: new Date().toISOString(), rows_written: rowsWritten, error: error ?? null })
    .eq('id', logId)
}

/** Verify cron secret. Returns true if valid. */
export function verifyCronSecret(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return secret === (process.env.CRON_SECRET ?? 'nw-cron-2026')
}
