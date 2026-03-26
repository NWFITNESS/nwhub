import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const supabase = createAdminClient()

  // Get yesterday's date range
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const [{ data: emails }, { data: openTasks }, { data: digestSettings }] = await Promise.all([
    supabase
      .from('email_classifications')
      .select('*')
      .gte('processed_at', yesterday.toISOString())
      .lt('processed_at', todayStart.toISOString()),
    supabase
      .from('tasks')
      .select('*')
      .eq('completed', false),
    supabase
      .from('global_settings')
      .select('key, value')
      .in('key', ['digest_recipient', 'digest_enabled', 'digest_send_hour']),
  ])

  const settingsMap = Object.fromEntries((digestSettings ?? []).map(s => [s.key, s.value]))
  const digestEnabled = settingsMap['digest_enabled'] !== 'false'
  const recipient = settingsMap['digest_recipient'] ?? 'info@northernwarrior.co.uk'
  const sendHour = parseInt(settingsMap['digest_send_hour'] ?? '8', 10)
  const currentHour = new Date().getUTCHours()

  if (!digestEnabled) return NextResponse.json({ sent: false, reason: 'Digest disabled in preferences' })
  // Cron runs every hour — only send at the configured hour unless ?force=true (UI test button)
  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'
  if (!force && currentHour !== sendHour) {
    return NextResponse.json({ sent: false, reason: `Not send time (current ${currentHour}:00 UTC, configured ${sendHour}:00 UTC)` })
  }

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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  * { box-sizing: border-box; }
  body { background: #0e0e0d; color: #e5e2e1; font-family: 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  /* Hero header — SVG as CSS background so text is always on top */
  .hero { background: linear-gradient(150deg, #0e1628 0%, #060a12 60%, #080c10 100%), url(https://nwhub.vercel.app/icons/NWHub-Icon.svg) no-repeat center center / 160px 160px; border-radius: 14px; padding: 32px 32px 28px; text-align: center; margin-bottom: 24px; border: 1px solid rgba(201,168,76,0.12); }
  .hero-eyebrow { color: rgba(201,168,76,0.55); font-size: 10px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; margin: 0 0 8px; }
  .hero-title { color: #f2ca50; font-size: 26px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0; line-height: 1; }
  .hero-sub { color: rgba(255,255,255,0.4); font-size: 12px; margin: 6px 0 0; }
  .hero-date { display: inline-block; margin-top: 12px; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.2); border-radius: 20px; padding: 4px 14px; color: #d4af37; font-size: 11px; font-weight: 600; }
  /* Stats grid */
  .stats { display: table; width: 100%; border-collapse: separate; border-spacing: 0; background: #141413; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-bottom: 28px; overflow: hidden; }
  .stat-cell { display: table-cell; padding: 18px 20px; border-right: 1px solid rgba(255,255,255,0.05); width: 25%; text-align: center; vertical-align: middle; }
  .stat-cell:last-child { border-right: none; }
  .stat-num { color: #f2ca50; font-size: 26px; font-weight: 800; line-height: 1; margin: 0 0 4px; }
  .stat-label { color: rgba(255,255,255,0.35); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
  /* Section */
  .section-title { color: #d4af37; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(212,175,55,0.15); }
  .email-card { background: #141413; border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; }
  .email-from { font-size: 12px; font-weight: 700; color: #f2ca50; margin: 0 0 3px; }
  .email-subject { font-size: 14px; color: #e5e2e1; font-weight: 500; margin: 0 0 5px; }
  .email-summary { font-size: 12px; color: rgba(255,255,255,0.45); margin: 0; line-height: 1.5; }
  /* CTA */
  .cta { display: inline-block; background: #c9980c; color: #1a0f00 !important; font-weight: 800; font-size: 13px; padding: 12px 28px; border-radius: 8px; text-decoration: none; letter-spacing: 0.5px; mso-padding-alt: 0; }
  /* Footer */
  .footer { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; margin-top: 8px; font-size: 11px; color: rgba(255,255,255,0.25); text-align: center; line-height: 1.8; }
  .footer a { color: rgba(201,168,76,0.5); text-decoration: none; }
  .footer a:hover { color: #d4af37; }
</style></head>
<body>
<div class="wrap">

  <!-- Hero Header -->
  <div class="hero">
    <p class="hero-eyebrow">Northern Warrior</p>
    <h1 class="hero-title">NWHub</h1>
    <p class="hero-sub">Morning Digest</p>
    <span class="hero-date">${dayName} · ${dateStr}</span>
  </div>

  <!-- Stats -->
  <div class="stats">
    <div class="stat-cell">
      <p class="stat-num">${allEmails.length}</p>
      <p class="stat-label">Processed</p>
    </div>
    <div class="stat-cell">
      <p class="stat-num" style="color:${flagged.length > 0 ? '#f87171' : '#f2ca50'}">${flagged.length}</p>
      <p class="stat-label">Action needed</p>
    </div>
    <div class="stat-cell">
      <p class="stat-num" style="color:${newLeads.length > 0 ? '#34d399' : '#f2ca50'}">${newLeads.length}</p>
      <p class="stat-label">New leads</p>
    </div>
    <div class="stat-cell">
      <p class="stat-num">${openTaskCount}</p>
      <p class="stat-label">Open tasks</p>
    </div>
  </div>

  ${flagged.length > 0 ? `
  <p class="section-title">Needs Your Attention</p>
  ${flagged.map((e: { sender_name: string | null; sender: string; subject: string; ai_summary: string | null }) => `
  <div class="email-card">
    <p class="email-from">${e.sender_name ?? e.sender}</p>
    <p class="email-subject">${e.subject}</p>
    ${e.ai_summary ? `<p class="email-summary">${e.ai_summary}</p>` : ''}
  </div>`).join('')}` : ''}

  ${newLeads.length > 0 ? `
  <p class="section-title" style="margin-top:24px">New Leads (${newLeads.length})</p>
  ${newLeads.map((e: { sender_name: string | null; sender: string; subject: string; ai_summary: string | null }) => `
  <div class="email-card">
    <p class="email-from">${e.sender_name ?? e.sender}</p>
    <p class="email-subject">${e.subject}</p>
    ${e.ai_summary ? `<p class="email-summary">${e.ai_summary}</p>` : ''}
  </div>`).join('')}` : ''}

  <!-- CTA — table layout for desktop email client compatibility -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
    <tr>
      <td align="center">
        <a href="https://nwhub.vercel.app/inbox" class="cta">Open Inbox Intelligence →</a>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <div class="footer">
    Sent daily at 8am · NWHub Morning Digest<br>
    <a href="https://nwhub.vercel.app/settings#digest-preferences">Manage digest preferences</a>
  </div>

</div>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: 'NWHub <noreply@northernwarrior.co.uk>',
    to: recipient,
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
