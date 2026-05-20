import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  // Category breakdown + daily stats for last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [{ data: recentEmails }, { data: ruleMatches }, { data: processingRuns }] = await Promise.all([
    supabase
      .from('email_classifications')
      .select('category, processed_at, rule_matched_id, archived')
      .gte('processed_at', sevenDaysAgo),
    supabase
      .from('email_classifications')
      .select('rule_matched_id, inbox_rules(name)')
      .not('rule_matched_id', 'is', null)
      .gte('processed_at', sevenDaysAgo),
    supabase
      .from('processing_log')
      .select('*')
      .order('run_at', { ascending: false })
      .limit(20),
  ])

  const emails = recentEmails ?? []

  // Daily breakdown for sparkline
  const daily: Record<string, { total: number; needs_attention: number; new_lead: number; spam: number; archived: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = d.toISOString().split('T')[0]
    daily[key] = { total: 0, needs_attention: 0, new_lead: 0, spam: 0, archived: 0 }
  }

  for (const e of emails) {
    const day = e.processed_at?.split('T')[0]
    if (day && daily[day]) {
      daily[day].total++
      if (e.category === 'needs_attention') daily[day].needs_attention++
      if (e.category === 'new_lead') daily[day].new_lead++
      if (e.category === 'spam') daily[day].spam++
      if (e.archived) daily[day].archived++
    }
  }

  // Top rule matches
  const ruleCounts: Record<string, { name: string; count: number }> = {}
  for (const r of (ruleMatches ?? [])) {
    const id = r.rule_matched_id
    if (!id) continue
    if (!ruleCounts[id]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ruleName = (r as any).inbox_rules?.name ?? 'Unknown'
      ruleCounts[id] = { name: ruleName, count: 0 }
    }
    ruleCounts[id].count++
  }

  return NextResponse.json({
    daily: Object.entries(daily).map(([date, counts]) => ({ date, ...counts })),
    ruleCounts: Object.entries(ruleCounts).map(([id, v]) => ({ ruleId: id, ...v })),
    processingRuns: processingRuns ?? [],
    totals: {
      processed: emails.length,
      needs_attention: emails.filter(e => e.category === 'needs_attention').length,
      new_lead: emails.filter(e => e.category === 'new_lead').length,
      archived: emails.filter(e => e.archived).length,
      spam: emails.filter(e => e.category === 'spam').length,
    },
  })
}
