import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'
import { getResend, FROM_EMAIL, REPLY_TO } from '@/lib/email/resend'

export async function POST(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { enquiry_id, message } = await req.json()
  if (!enquiry_id || !message?.trim()) {
    return NextResponse.json({ error: 'enquiry_id and message are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fetch the enquiry to get the recipient email
  const { data: enquiry, error: fetchErr } = await supabase
    .from('contact_enquiries')
    .select('*')
    .eq('id', enquiry_id)
    .single()

  if (fetchErr || !enquiry) {
    return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 })
  }

  // Send the reply via Resend
  const resend = getResend()
  const { error: sendErr } = await resend.emails.send({
    from: FROM_EMAIL,
    to: enquiry.email,
    replyTo: REPLY_TO,
    subject: `Re: Your ${enquiry.enquiry_type} enquiry — Northern Warrior`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; color: #333;">
        <p>Hi ${enquiry.name.split(' ')[0]},</p>
        ${message.trim().split('\n').map((line: string) => `<p>${line}</p>`).join('')}
        <br/>
        <p style="color: #666; font-size: 14px;">— The Northern Warrior Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">
          This is a reply to your enquiry submitted on ${new Date(enquiry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </p>
      </div>
    `,
  })

  if (sendErr) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  // Save the reply to the database
  const { data: reply, error: insertErr } = await supabase
    .from('enquiry_replies')
    .insert({
      enquiry_id,
      message: message.trim(),
      sent_to: enquiry.email,
    })
    .select()
    .single()

  if (insertErr) {
    // Email was sent but reply wasn't saved — still mark as replied
    console.error('[enquiry/reply] Failed to save reply:', insertErr.message)
  }

  // Auto-mark enquiry as replied
  await supabase
    .from('contact_enquiries')
    .update({ status: 'replied' })
    .eq('id', enquiry_id)

  return NextResponse.json({ ok: true, reply })
}
