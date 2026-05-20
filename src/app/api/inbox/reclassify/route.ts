import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'
import { classifyEmail } from '@/lib/email/classifier'
import { applyRules, type NormalizedEmail } from '@/lib/email/rules-engine'
import { gmailFetch, extractEmailBody } from '@/lib/gmail/client'
import { extractInvoiceFromEmail } from '@/lib/invoices/pipeline'

// POST — reclassify a single email by its classification ID
// Body: { email_id: string }
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { email_id } = await req.json()
  if (!email_id) return NextResponse.json({ error: 'email_id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: email } = await supabase
    .from('email_classifications')
    .select('*')
    .eq('id', email_id)
    .single()

  if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 })

  const debug: string[] = []

  // Re-fetch email body from Gmail if possible
  let preview = email.preview ?? ''
  let hasAttachment = false
  let attachmentTypes: string[] = []

  if (email.gmail_message_id) {
    try {
      const detailRes = await gmailFetch(`/users/me/messages/${email.gmail_message_id}?format=full`)
      if (detailRes.ok) {
        const detail = await detailRes.json()
        const body = extractEmailBody(detail.payload)
        preview = (body || detail.snippet || '').slice(0, 500)
        const parts = detail.payload?.parts ?? []
        hasAttachment = parts.some((p: { mimeType?: string; filename?: string }) =>
          p.mimeType === 'application/pdf' || p.filename?.toLowerCase().endsWith('.pdf')
        )
        attachmentTypes = parts
          .filter((p: { mimeType?: string }) => p.mimeType && !p.mimeType.startsWith('text/') && !p.mimeType.startsWith('multipart/'))
          .map((p: { mimeType: string }) => p.mimeType)
        debug.push('Fetched fresh email body from Gmail')
      }
    } catch {
      debug.push('Could not fetch from Gmail — using stored preview')
    }
  }

  // Re-classify with AI
  const aiResult = await classifyEmail({
    from: `${email.sender_name ?? ''} <${email.sender}>`,
    subject: email.subject ?? '',
    preview,
  })

  if (!aiResult) return NextResponse.json({ error: 'Classification failed' }, { status: 500 })

  // Apply rules
  const normalized: NormalizedEmail = {
    from: email.sender ?? '',
    from_domain: email.sender?.includes('@') ? email.sender.split('@')[1] : '',
    subject: email.subject ?? '',
    body: preview,
    has_attachment: hasAttachment,
    attachment_types: attachmentTypes,
  }
  const { classification: result, matchedRuleId } = await applyRules(normalized, aiResult)

  debug.push(`Old: ${email.category} → New: ${result.category}`)

  // Update classification
  const isArchived = result.category === 'spam' || result.category === 'newsletter' || result.category === 'receipt_notification'
  await supabase.from('email_classifications').update({
    category: result.category,
    ai_summary: result.ai_summary || email.ai_summary,
    flagged: result.flagged ?? false,
    archived: isArchived,
    rule_matched_id: matchedRuleId,
  }).eq('id', email_id)

  // Create task if needed and no task exists
  if (result.create_task && result.task_title && !email.task_created) {
    const { data: task } = await supabase.from('tasks').insert({
      title: result.task_title,
      notes: result.task_detail || null,
      source: 'email',
      email_id: email.gmail_message_id ?? email.outlook_message_id,
      due_date: result.task_due_date || null,
      priority: result.task_priority ?? 'medium',
    }).select('id').single()

    if (task) {
      await supabase.from('email_classifications').update({ task_created: true, task_id: task.id }).eq('id', email_id)
      debug.push(`Task created: ${result.task_title}`)
    }
  }

  // Star in Gmail if needs_attention or new_lead
  if (email.gmail_message_id && (result.category === 'needs_attention' || result.category === 'new_lead')) {
    try {
      await gmailFetch(`/users/me/messages/${email.gmail_message_id}/modify`, {
        method: 'POST',
        body: JSON.stringify({ addLabelIds: ['STARRED'] }),
      })
      debug.push('Starred in Gmail')
    } catch { /* non-critical */ }
  }

  // Extract invoices if applicable
  // Extract invoices (PDF attachments or email body)
  if (email.gmail_message_id) {
    const subjectLower = (email.subject ?? '').toLowerCase()
    const hasInvoiceKeyword = subjectLower.includes('invoice') || subjectLower.includes('receipt') || subjectLower.includes('statement') || subjectLower.includes('payment') || subjectLower.includes('order')

    if (hasInvoiceKeyword || result.extract_invoice) {
      const { count } = await supabase
        .from('invoice_vault')
        .select('id', { count: 'exact', head: true })
        .eq('source_email_id', email_id)

      if ((count ?? 0) === 0) {
        const extractDebug = await extractInvoiceFromEmail(supabase, email.gmail_message_id, email_id, email.subject, email.sender)
        debug.push(...extractDebug)
      } else {
        debug.push('Invoice already extracted')
      }
    }
  }

  return NextResponse.json({
    old_category: email.category,
    new_category: result.category,
    debug,
  })
}
