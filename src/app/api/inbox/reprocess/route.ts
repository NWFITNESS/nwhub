import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { outlookFetch, getOutlookTokens, ensureOutlookCategories } from '@/lib/outlook'
import { fetchPdfAttachments } from '@/lib/gmail-attachments'
import { extractInvoiceMetadata } from '@/lib/invoice-extractor'
import { storeInvoicePdf } from '@/lib/invoice-storage'
import { findMatchingXeroInvoice } from '@/lib/xero-matcher'
import { requireAuth } from '@/lib/auth-guard'

// POST — reprocess existing classified emails
// Re-applies Outlook flagging and invoice extraction to emails that were
// processed before those features were deployed.
export async function POST() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const debug: string[] = []

  // Get recent needs_attention emails that might need flagging/extraction
  const { data: emails } = await supabase
    .from('email_classifications')
    .select('*')
    .eq('category', 'needs_attention')
    .order('received_at', { ascending: false })
    .limit(20)

  if (!emails?.length) {
    return NextResponse.json({ debug: ['No needs_attention emails found'] })
  }

  debug.push(`Found ${emails.length} needs_attention emails to reprocess`)

  // ── Outlook flagging ─────────────────────────────────────────────────
  const outlookTokens = await getOutlookTokens()
  let outlookFlagged = 0

  if (outlookTokens) {
    const catMap = await ensureOutlookCategories()
    const outlookCategory = catMap['needs_attention']

    // First, fetch a batch of recent Outlook messages to match against
    let outlookMessages: Array<{ id: string; subject: string; from: { emailAddress: { address: string } }; receivedDateTime: string }> = []
    try {
      const batchRes = await outlookFetch(
        `/me/mailFolders/inbox/messages?$top=100&$select=id,subject,from,receivedDateTime&$orderby=receivedDateTime desc`
      )
      if (batchRes.ok) {
        const batchData = await batchRes.json()
        outlookMessages = batchData.value ?? []
        debug.push(`Fetched ${outlookMessages.length} Outlook messages for matching`)
      } else {
        debug.push(`Outlook fetch failed: ${batchRes.status}`)
      }
    } catch (e) {
      debug.push(`Outlook fetch error: ${e instanceof Error ? e.message : String(e)}`)
    }

    for (const email of emails) {
      let msgId = email.outlook_message_id

      // Match by sender email address
      if (!msgId && email.sender && outlookMessages.length > 0) {
        const senderLower = email.sender.toLowerCase()
        const match = outlookMessages.find(m =>
          m.from?.emailAddress?.address?.toLowerCase() === senderLower &&
          m.subject?.toLowerCase().includes((email.subject ?? '').toLowerCase().slice(0, 30))
        )
        if (match) {
          msgId = match.id
          await supabase.from('email_classifications').update({ outlook_message_id: msgId }).eq('id', email.id)
          debug.push(`Matched Outlook by sender: ${email.sender} | ${email.subject}`)
        }
      }

      if (!msgId) {
        debug.push(`No Outlook match: ${email.sender} | ${email.subject?.slice(0, 40)}`)
        continue
      }

      try {
        const patchRes = await outlookFetch(`/me/messages/${msgId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            flag: { flagStatus: 'flagged' },
            importance: 'high',
            categories: outlookCategory ? [outlookCategory] : [],
          }),
        })

        if (patchRes.ok) {
          outlookFlagged++
          debug.push(`Flagged in Outlook: ${email.sender} | ${email.subject}`)
        } else {
          const errText = await patchRes.text().catch(() => '')
          debug.push(`Outlook flag FAILED (${patchRes.status}): ${email.subject} — ${errText.slice(0, 200)}`)
        }
      } catch (e) {
        debug.push(`Outlook flag ERROR: ${email.subject} — ${e instanceof Error ? e.message : String(e)}`)
      }
    }
  } else {
    debug.push('Outlook not connected — skipping flagging')
  }

  debug.push(`Outlook: flagged ${outlookFlagged} emails`)

  // ── Invoice extraction (Gmail only) ──────────────────────────────────
  let invoicesExtracted = 0

  for (const email of emails) {
    if (!email.gmail_message_id) continue

    const subjectLower = (email.subject ?? '').toLowerCase()
    const hasInvoiceKeyword = subjectLower.includes('invoice') || subjectLower.includes('receipt') || subjectLower.includes('statement') || subjectLower.includes('payment')

    if (!hasInvoiceKeyword) continue

    // Check if already extracted
    const { count } = await supabase
      .from('invoice_vault')
      .select('id', { count: 'exact', head: true })
      .eq('source_email_id', email.id)

    if ((count ?? 0) > 0) {
      debug.push(`Already extracted: ${email.subject}`)
      continue
    }

    try {
      debug.push(`Fetching attachments for: ${email.subject} (${email.gmail_message_id})`)
      const pdfs = await fetchPdfAttachments(email.gmail_message_id)
      debug.push(`Found ${pdfs.length} PDF(s)`)

      for (const pdf of pdfs) {
        try {
          debug.push(`Extracting: ${pdf.filename} (${pdf.data.length} bytes)`)
          const extracted = await extractInvoiceMetadata(pdf.data)
          debug.push(`Result: ${JSON.stringify(extracted)}`)

          if (!extracted || !extracted.is_invoice) continue

          const storagePath = await storeInvoicePdf(pdf.data, pdf.filename, email.id)
          debug.push(`Stored at: ${storagePath}`)

          const match = await findMatchingXeroInvoice({
            supplier: extracted.supplier ?? '',
            amount_total: extracted.amount_total ?? 0,
            invoice_date: extracted.invoice_date ?? new Date().toISOString().split('T')[0],
            invoice_number: extracted.invoice_number,
          })
          debug.push(`Xero match: ${match.matched ? 'YES' : 'NO'} (score: ${match.confidence ?? 0})`)

          await supabase.from('invoice_vault').insert({
            source: 'email',
            source_email_id: email.id,
            supplier: extracted.supplier ?? null,
            invoice_number: extracted.invoice_number ?? null,
            amount: extracted.amount_total ?? null,
            currency: extracted.amount_currency ?? 'GBP',
            invoice_date: extracted.invoice_date ?? null,
            due_date: extracted.due_date ?? null,
            pdf_storage_path: storagePath,
            xero_match_status: match.matched ? 'matched' : 'unmatched',
            xero_invoice_id: match.xeroInvoiceId ?? null,
          })

          invoicesExtracted++
          debug.push(`Invoice saved to vault!`)
        } catch (pdfErr) {
          debug.push(`PDF extraction failed: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`)
        }
      }
    } catch (attErr) {
      debug.push(`Attachment fetch failed: ${attErr instanceof Error ? attErr.message : String(attErr)}`)
    }
  }

  debug.push(`Invoices extracted: ${invoicesExtracted}`)

  return NextResponse.json({
    outlook_flagged: outlookFlagged,
    invoices_extracted: invoicesExtracted,
    debug,
  })
}
