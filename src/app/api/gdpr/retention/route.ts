import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/gdpr/retention — Data retention cleanup (cron job)
 *
 * Purges data past its retention period:
 * - Chat sessions older than 90 days
 * - Stale pending bookings older than 7 days
 * - Archived email triage older than 180 days
 * - Page view analytics older than 365 days
 * - Audit log entries older than 2 years (keep minimum for compliance)
 *
 * Protected by CRON_SECRET for automated runs.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const stats: Record<string, number> = {}

  // Chat sessions > 90 days
  const chatCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: delChat } = await admin.from('chat_sessions').delete().lt('created_at', chatCutoff).select('id')
  stats.chat_sessions = delChat?.length ?? 0

  // Stale pending kids block bookings > 7 days (abandoned checkouts)
  const pendingCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: delPending } = await admin
    .from('kids_block_bookings')
    .delete()
    .eq('payment_status', 'pending')
    .lt('created_at', pendingCutoff)
    .select('id')
  stats.stale_pending_bookings = delPending?.length ?? 0

  // Archived email triage > 180 days
  const triageCutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()
  const { data: delTriage } = await admin
    .from('email_triage')
    .delete()
    .eq('status', 'archived')
    .lt('received_at', triageCutoff)
    .select('id')
  stats.archived_email_triage = delTriage?.length ?? 0

  // Page views > 365 days
  const analyticsCutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const { data: delViews } = await admin.from('page_views').delete().lt('created_at', analyticsCutoff).select('id')
  stats.old_page_views = delViews?.length ?? 0

  // Audit log > 2 years (GDPR says keep evidence of compliance, 2 years is reasonable)
  const auditCutoff = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString()
  const { data: delAudit } = await admin.from('audit_log').delete().lt('created_at', auditCutoff).select('id')
  stats.old_audit_entries = delAudit?.length ?? 0

  // Log this retention run
  await admin.from('audit_log').insert({
    action: 'data_retention',
    actor: 'system',
    details: { stats, ran_at: now.toISOString() },
  })

  return NextResponse.json({ success: true, stats })
}
