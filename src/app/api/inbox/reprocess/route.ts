import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gmailFetch } from '@/lib/gmail'
import { fetchPdfAttachments } from '@/lib/gmail-attachments'
import { extractInvoiceMetadata } from '@/lib/invoice-extractor'
import { storeInvoicePdf } from '@/lib/invoice-storage'
import { findMatchingXeroInvoice } from '@/lib/xero-matcher'
import { requireAuth } from '@/lib/auth-guard'

// POST — reprocess existing classified emails
// Stars in Gmail (shows as flagged in Outlook linked view) and extracts invoices
export async function POST() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const debug: string[] = []

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

  // ── Gmail starring (shows as flagged in Outlook linked view) ──────────
  let starred = 0

  for (const email of emails) {
    if (!email.gmail_message_id) continue

    try {
      const starRes = await gmailFetch(`/users/me/messages/${email.gmail_message_id}/modify`, {
        method: 'POST',
        body: JSON.stringify({
          addLabelIds: ['STARRED'],
        }),
      })

      if (starRes.ok) {
        starred++
        debug.push(`Starred in Gmail: ${email.sender} | ${email.subject}`)
      } else {
        debug.push(`Star FAILED (${starRes.status}): ${email.subject}`)
      }
    } catch (e) {
      debug.push(`Star ERROR: ${email.subject} — ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  debug.push(`Gmail: starred ${starred} emails (shows as flagged in Outlook)`)

  // ── Invoice extraction (Gmail only) ──────────────────────────────────
  let invoicesExtracted = 0

  for (const email of emails) {
    if (!email.gmail_message_id) continue

    const subjectLower = (email.subject ?? '').toLowerCase()
    const hasInvoiceKeyword = subjectLower.includes('invoice') || subjectLower.includes('receipt') || subjectLower.includes('statement') || subjectLower.includes('payment')

    if (!hasInvoiceKeyword) continue

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

          const match = await findMatchingXeroInvoice({
            supplier: extracted.supplier ?? '',
            amount_total: extracted.amount_total ?? 0,
            invoice_date: extracted.invoice_date ?? new Date().toISOString().split('T')[0],
            invoice_number: extracted.invoice_number,
          })

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

  return NextResponse.json({ starred, invoices_extracted: invoicesExtracted, debug })
}
