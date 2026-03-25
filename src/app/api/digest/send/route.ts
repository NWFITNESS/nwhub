import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST() {
  const supabase = createAdminClient()

  // Get yesterday's date range
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const { data: emails } = await supabase
    .from('email_classifications')
    .select('*')
    .gte('processed_at', yesterday.toISOString())
    .lt('processed_at', todayStart.toISOString())

  const { data: openTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('completed', false)

  const allEmails = emails ?? []
  const flagged = allEmails.filter((e: { flagged: boolean }) => e.flagged)
  const newLeads = allEmails.filter((e: { category: string }) => e.category === 'new_lead')
  const archivedCount = allEmails.filter((e: { archived: boolean }) => e.archived).length
  const categorised = allEmails.filter((e: { flagged: boolean; archived: boolean }) => !e.flagged && !e.archived).length
  const openTaskCount = (openTasks ?? []).length

  const dayName = yesterday.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateStr = yesterday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { background: #111110; color: #e5e2e1; font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  .header { border-bottom: 1px solid #2a2a28; padding-bottom: 24px; margin-bottom: 24px; }
  .logo { color: #d4af37; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
  .subtitle { color: rgba(255,255,255,0.4); font-size: 13px; margin-top: 4px; }
  .stats { background: #1a1a19; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 20px; margin-bottom: 24px; }
  .stat-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: rgba(255,255,255,0.6); }
  .stat-row span { color: #f2ca50; font-weight: 700; }
  .section-title { color: #d4af37; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 8px; margin: 24px 0 16px; }
  .email-card { background: #1a1a19; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
  .email-from { font-size: 13px; font-weight: 600; color: #f2ca50; }
  .email-subject { font-size: 14px; color: #e5e2e1; margin: 4px 0; }
  .email-summary { font-size: 13px; color: rgba(255,255,255,0.55); }
  .footer { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; margin-top: 32px; font-size: 12px; color: rgba(255,255,255,0.3); }
  .cta { display: inline-block; background: #d4af37; color: #3c2f00; font-weight: 700; font-size: 13px; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">Northern Warrior</div>
    <div class="subtitle">NWHub Morning Digest — ${dayName} ${dateStr}</div>
  </div>

  <div class="stats">
    <div class="stat-row">Total emails processed <span>${allEmails.length}</span></div>
    <div class="stat-row">Spam/newsletters archived <span>${archivedCount}</span></div>
    <div class="stat-row">Needs your attention <span>${flagged.length}</span></div>
    <div class="stat-row">Categorised (no action) <span>${categorised}</span></div>
  </div>

  ${flagged.length > 0 ? `
  <div class="section-title">Needs Your Attention</div>
  ${flagged.map((e: { sender_name: string | null; sender: string; subject: string; ai_summary: string | null }) => `
  <div class="email-card">
    <div class="email-from">${e.sender_name ?? e.sender}</div>
    <div class="email-subject">${e.subject}</div>
    ${e.ai_summary ? `<div class="email-summary">${e.ai_summary}</div>` : ''}
  </div>`).join('')}` : ''}

  ${newLeads.length > 0 ? `
  <div class="section-title">New Leads (${newLeads.length})</div>
  ${newLeads.map((e: { sender_name: string | null; sender: string; subject: string; ai_summary: string | null }) => `
  <div class="email-card">
    <div class="email-from">${e.sender_name ?? e.sender}</div>
    <div class="email-subject">${e.subject}</div>
    ${e.ai_summary ? `<div class="email-summary">${e.ai_summary}</div>` : ''}
  </div>`).join('')}` : ''}

  ${openTaskCount > 0 ? `
  <div class="section-title">Open Tasks: ${openTaskCount}</div>
  <a href="https://nwhub.vercel.app/inbox" class="cta">View Inbox Intelligence →</a>` : ''}

  <div class="footer">
    This digest is sent daily at 8am.<br>
    Manage preferences in NWHub → Settings.
  </div>
</div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: 'NWHub <noreply@northernwarrior.co.uk>',
    to: 'info@northernwarrior.co.uk',
    subject: `NWHub Morning Digest — ${dayName} ${dateStr}`,
    html,
  })

  if (error) return NextResponse.json({ error: (error as { message?: string }).message ?? 'Unknown error' }, { status: 500 })

  // Log the digest
  await supabase.from('digest_log').insert({
    emails_processed: allEmails.length,
    flagged_count: flagged.length,
    archived_count: archivedCount,
    categorised_count: categorised,
  })

  return NextResponse.json({ sent: true })
}
