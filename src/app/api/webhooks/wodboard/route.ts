import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getTrialEndDate(startDate: string): string {
  const date = new Date(startDate)
  date.setDate(date.getDate() + 14)
  return date.toISOString()
}

function getMembershipType(type: string): string {
  if (!type) return 'adult'
  const t = type.toLowerCase()
  if (t.includes('kid')) return 'kids'
  if (t.includes('hyrox')) return 'hyrox'
  if (t.includes('personal')) return 'personal_training'
  return 'adult'
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const payload = await req.json()

  // Optional secret header check — set WODBOARD_WEBHOOK_SECRET in .env.local
  // and configure it in Zapier as a custom header: x-webhook-secret
  const secret = process.env.WODBOARD_WEBHOOK_SECRET
  if (secret) {
    const incoming = req.headers.get('x-webhook-secret')
    if (incoming !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const {
    event,
    first_name,
    last_name,
    email,
    phone,
    membership_type,
    start_date,
    event_date,
  } = payload

  if (!event) {
    return NextResponse.json({ error: 'Missing event field' }, { status: 400 })
  }

  // Use admin client — bypasses RLS, safe for server-to-server webhooks
  const supabase = createAdminClient()

  switch (event) {

    case 'trial_started':
      await supabase.from('contacts').upsert(
        {
          first_name,
          last_name,
          email,
          phone,
          status: 'trial',
          source: 'wodboard',
          trial_start_date: start_date,
          trial_end_date: start_date ? getTrialEndDate(start_date) : null,
          programme: getMembershipType(membership_type),
        },
        { onConflict: 'email' }
      )
      break

    case 'member_created':
      await supabase.from('contacts').upsert(
        {
          first_name,
          last_name,
          email,
          phone,
          status: 'member',
          source: 'wodboard',
          member_since: start_date,
          programme: getMembershipType(membership_type),
        },
        { onConflict: 'email' }
      )
      break

    case 'member_converted':
      await supabase
        .from('contacts')
        .update({ status: 'member', member_since: event_date })
        .eq('email', email)
      break

    case 'member_cancelled':
      await supabase
        .from('contacts')
        .update({ status: 'cancelled' })
        .eq('email', email)
      break

    case 'class_attended':
      await supabase
        .from('contacts')
        .update({ last_attendance: event_date })
        .eq('email', email)
      break

    default:
      // Unknown event — acknowledge but don't error so Zapier doesn't retry
      return NextResponse.json({ received: true, skipped: true, event })
  }

  return NextResponse.json({ received: true, event })
}
