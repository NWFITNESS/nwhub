import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_EMAIL } from '@/lib/resend'
import { CATEGORY_LABEL, CATEGORY_TIME } from '@/lib/kids/constants'
import type { KidsCategory } from '@/lib/kids/types'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/kids-reminders
//
// Called by pg_cron every Sunday at 08:00 UTC (07:00 or 08:00 UK time
// depending on BST/GMT). Finds all paid block bookings for sessions
// happening today, groups by parent, and sends one reminder email per
// parent with their children's session times.
//
// Protected by x-cron-secret header to prevent public access.
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KIDS_ADMIN_EMAIL = 'info@nwfitnesskids.co.uk'
const CRON_SECRET = process.env.CRON_SECRET ?? 'nw-cron-2026'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret')
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Get today's date in YYYY-MM-DD format (UTC)
  const today = new Date().toISOString().slice(0, 10)

  // Find sessions happening today
  const { data: todaySessions } = await admin
    .from('kids_sessions')
    .select('id, block_id, session_date, is_break')
    .eq('session_date', today)
    .eq('is_break', false)

  if (!todaySessions?.length) {
    return NextResponse.json({ sent: 0, message: 'No sessions today' })
  }

  const blockIds = [...new Set(todaySessions.map((s) => s.block_id))]

  // Find all paid bookings for these blocks
  const { data: bookings } = await admin
    .from('kids_block_bookings')
    .select('id, child_id, parent_id, category, block_id')
    .in('block_id', blockIds)
    .eq('payment_status', 'paid')

  if (!bookings?.length) {
    return NextResponse.json({ sent: 0, message: 'No paid bookings for today\'s sessions' })
  }

  // Fetch parents and children
  const parentIds = [...new Set(bookings.map((b) => b.parent_id))]
  const childIds = [...new Set(bookings.map((b) => b.child_id))]

  const [parentsRes, childrenRes, blocksRes] = await Promise.all([
    admin.from('kids_parents').select('id, email, name').in('id', parentIds),
    admin.from('kids_children').select('id, child_name').in('id', childIds),
    admin.from('kids_blocks').select('id, name').in('id', blockIds),
  ])

  const parentById = new Map((parentsRes.data ?? []).map((p) => [p.id, p]))
  const childById = new Map((childrenRes.data ?? []).map((c) => [c.id, c.child_name]))
  const blockById = new Map((blocksRes.data ?? []).map((b) => [b.id, b.name]))

  // Group bookings by parent
  const byParent = new Map<string, typeof bookings>()
  for (const b of bookings) {
    const arr = byParent.get(b.parent_id) ?? []
    arr.push(b)
    byParent.set(b.parent_id, arr)
  }

  // Send one email per parent
  const resend = getResend()
  let sent = 0
  const errors: string[] = []

  for (const [parentId, parentBookings] of byParent) {
    const parent = parentById.get(parentId)
    if (!parent?.email) continue

    const children = parentBookings.map((b) => ({
      name: childById.get(b.child_id) ?? 'Your child',
      category: b.category as KidsCategory,
      time: CATEGORY_TIME[b.category as KidsCategory],
      label: CATEGORY_LABEL[b.category as KidsCategory],
    }))

    const blockName = blockById.get(parentBookings[0].block_id) ?? 'Kids & Teens'

    const todayFormatted = new Date(today + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    const html = renderReminderEmail({
      parentName: parent.name,
      children,
      blockName,
      dateStr: todayFormatted,
    })

    try {
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: parent.email,
        bcc: KIDS_ADMIN_EMAIL,
        replyTo: KIDS_ADMIN_EMAIL,
        subject: `Today's session reminder — ${todayFormatted}`,
        html,
      })
      if (error) throw new Error((error as { message?: string }).message ?? 'unknown')
      sent++
    } catch (e) {
      errors.push(`${parent.email}: ${(e as Error).message}`)
      console.error(`[kids-reminders] failed for ${parent.email}:`, (e as Error).message)
    }
  }

  return NextResponse.json({ sent, errors: errors.length ? errors : undefined })
}

// ─── Email template ─────────────────────────────────────────────────────────

function renderReminderEmail(args: {
  parentName: string
  children: { name: string; category: KidsCategory; time: string; label: string }[]
  blockName: string
  dateStr: string
}): string {
  const childRows = args.children
    .map(
      (c) =>
        `<tr>
          <td style="padding:8px 0;color:#fff;font-size:14px;font-weight:600;">${escapeHtml(c.name)}</td>
          <td style="padding:8px 0;color:#f2cb55;font-size:13px;text-align:right;">${c.label} &middot; ${c.time}</td>
        </tr>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Session reminder</title></head>
<body style="margin:0;padding:0;background:#0b0e14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;padding:32px 16px;"><tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width:520px;background:#161c2a;border:1px solid rgba(212,160,23,0.18);border-radius:12px;overflow:hidden;">

      <tr><td style="padding:28px 32px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#d4a017;margin-bottom:8px;">Northern Warrior Kids</div>
        <h1 style="margin:0;font-size:22px;line-height:1.25;color:#fff;font-weight:700;">Today&rsquo;s the day!</h1>
      </td></tr>

      <tr><td style="padding:20px 32px 0;color:#cdd5e3;font-size:14px;line-height:1.55;">
        Hi ${escapeHtml(args.parentName.split(' ')[0])} &mdash; just a reminder that ${args.children.length === 1 ? `${escapeHtml(args.children[0].name)} has a` : 'your children have'} session${args.children.length > 1 ? 's' : ''} today.
      </td></tr>

      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0b0e14;border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
          <tr><td style="padding:14px 18px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8a93a5;margin-bottom:8px;">${escapeHtml(args.dateStr)}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              ${childRows}
            </table>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:24px 32px 0;color:#cdd5e3;font-size:13px;line-height:1.55;">
        <strong style="color:#fff;">Don&rsquo;t forget:</strong> trainers, water, and comfortable kit.
      </td></tr>

      <tr><td style="padding:20px 32px 0;">
        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:14px 18px;">
          <div style="font-size:13px;color:#f59e0b;font-weight:600;margin-bottom:4px;">Can&rsquo;t make it?</div>
          <div style="font-size:13px;color:#cdd5e3;line-height:1.5;">
            Please let us know as early as you can:<br>
            <a href="mailto:info@nwfitnesskids.co.uk" style="color:#d4a017;text-decoration:none;">info@nwfitnesskids.co.uk</a><br>
            <a href="https://wa.me/447905321589" style="color:#d4a017;text-decoration:none;">WhatsApp 07905 321589</a>
          </div>
        </div>
      </td></tr>

      <tr><td style="padding:24px 32px 28px;">
        <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:18px;color:#8a93a5;font-size:12px;line-height:1.6;">See you there! &mdash; Northern Warrior Kids</div>
      </td></tr>

    </table>
  </td></tr></table>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
