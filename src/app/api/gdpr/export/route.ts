import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/gdpr/export?email=... — Export all PII for a given email
 *
 * Searches across all tables that hold personal data and returns
 * a JSON payload suitable for a Subject Access Request (SAR).
 */
export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const email = req.nextUrl.searchParams.get('email')?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'email parameter required' }, { status: 400 })

  const admin = createAdminClient()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch from all PII tables in parallel
  const [
    contacts,
    emailSubs,
    smsSubs,
    kidsParents,
    kidsChildren,
    blockBookings,
    dropinBookings,
    trials,
    enquiries,
    chatSessions,
  ] = await Promise.all([
    admin.from('contacts').select('*').ilike('email', email),
    admin.from('email_subscribers').select('*').ilike('email', email),
    admin.from('sms_subscribers').select('*').eq('phone', email), // Also check phone
    admin.from('kids_parents').select('*').ilike('email', email),
    // Children via parent lookup
    admin.from('kids_parents').select('id').ilike('email', email).then(async (res) => {
      const parentIds = (res.data ?? []).map(p => p.id)
      if (!parentIds.length) return { data: [] }
      return admin.from('kids_children').select('*').in('parent_id', parentIds)
    }),
    admin.from('kids_parents').select('id').ilike('email', email).then(async (res) => {
      const parentIds = (res.data ?? []).map(p => p.id)
      if (!parentIds.length) return { data: [] }
      return admin.from('kids_block_bookings').select('*').in('parent_id', parentIds)
    }),
    admin.from('kids_dropin_bookings').select('*').ilike('parent_email', email),
    admin.from('kids_parents').select('id').ilike('email', email).then(async (res) => {
      const parentIds = (res.data ?? []).map(p => p.id)
      if (!parentIds.length) return { data: [] }
      return admin.from('kids_trials').select('*').in('parent_id', parentIds)
    }),
    admin.from('contact_enquiries').select('*').ilike('email', email),
    admin.from('chat_sessions').select('id, created_at, messages').ilike('contact_email', email),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    subject_email: email,
    contacts: contacts.data ?? [],
    email_subscriptions: emailSubs.data ?? [],
    sms_subscriptions: smsSubs.data ?? [],
    kids_parent_records: kidsParents.data ?? [],
    kids_children: kidsChildren.data ?? [],
    kids_block_bookings: blockBookings.data ?? [],
    kids_dropin_bookings: dropinBookings.data ?? [],
    kids_trials: trials.data ?? [],
    contact_enquiries: enquiries.data ?? [],
    chat_sessions: chatSessions.data ?? [],
  }

  // Log the export in audit trail
  await admin.from('audit_log').insert({
    action: 'data_export',
    actor: user?.email ?? 'unknown',
    target_email: email,
    details: {
      record_counts: {
        contacts: (contacts.data ?? []).length,
        email_subscriptions: (emailSubs.data ?? []).length,
        kids_parent_records: (kidsParents.data ?? []).length,
        kids_children: (kidsChildren.data ?? []).length,
        contact_enquiries: (enquiries.data ?? []).length,
      },
    },
  })

  return NextResponse.json(exportData)
}
