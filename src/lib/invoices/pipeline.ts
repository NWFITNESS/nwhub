import { fetchPdfAttachments } from '@/lib/gmail/attachments'
import { extractInvoiceMetadata } from '@/lib/invoices/extractor'
import { extractInvoiceFromEmailBody, wrapEmailAsHtml } from '@/lib/email/invoice-extractor'
import { storeInvoicePdf } from '@/lib/invoices/storage'
import { findMatchingXeroInvoice } from '@/lib/xero/matcher'
import { gmailFetch, extractEmailBody } from '@/lib/gmail/client'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Extract invoices from a Gmail message.
 * 1. Tries PDF attachments first
 * 2. If no PDFs, extracts invoice data from the email body itself
 *    (for receipts like Mailchimp, Vercel, Canva that come as HTML emails)
 * Stores the result in invoice_vault and matches against Xero.
 */
export async function extractInvoiceFromEmail(
  supabase: SupabaseClient,
  gmailMessageId: string,
  classificationId: string,
  emailSubject?: string,
  emailSender?: string,
): Promise<string[]> {
  const debug: string[] = []

  try {
    // 1. Try PDF attachments first
    const pdfs = await fetchPdfAttachments(gmailMessageId)
    debug.push(`Found ${pdfs.length} PDF attachment(s)`)

    if (pdfs.length > 0) {
      for (const pdf of pdfs) {
        try {
          debug.push(`Extracting: ${pdf.filename} (${pdf.data.length} bytes)`)
          const extracted = await extractInvoiceMetadata(pdf.data)

          if (!extracted?.is_invoice) {
            debug.push('Not an invoice — skipped')
            continue
          }

          const storagePath = await storeInvoicePdf(pdf.data, pdf.filename, classificationId)
          const match = await findMatchingXeroInvoice({
            supplier: extracted.supplier ?? '',
            amount_total: extracted.amount_total ?? 0,
            invoice_date: extracted.invoice_date ?? new Date().toISOString().split('T')[0],
            invoice_number: extracted.invoice_number,
          })

          await supabase.from('invoice_vault').insert({
            source: 'email',
            source_email_id: classificationId,
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

          debug.push(`Invoice saved: ${extracted.supplier} £${extracted.amount_total} | Xero: ${match.matched ? 'matched' : 'unmatched'}`)
        } catch (pdfErr) {
          debug.push(`PDF failed: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`)
        }
      }
      return debug
    }

    // 2. No PDFs — extract from the email body (HTML receipt)
    debug.push('No PDFs — trying email body extraction')

    try {
      const detailRes = await gmailFetch(`/users/me/messages/${gmailMessageId}?format=full`)
      if (!detailRes.ok) { debug.push('Could not fetch email'); return debug }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail: any = await detailRes.json()
      const htmlBody = extractEmailBody(detail.payload)

      if (!htmlBody || htmlBody.length < 50) {
        debug.push('Email body too short')
        return debug
      }

      const subject = emailSubject ?? ''
      const sender = emailSender ?? ''
      const dateStr = new Date().toISOString().split('T')[0]

      const extracted = await extractInvoiceFromEmailBody(htmlBody, subject, sender)
      debug.push(`Body result: ${JSON.stringify(extracted)}`)

      if (!extracted?.is_invoice) {
        debug.push('Not an invoice')
        return debug
      }

      // Store the email HTML as a viewable receipt
      const wrappedHtml = wrapEmailAsHtml(htmlBody, subject, sender, dateStr)
      const htmlBuffer = Buffer.from(wrappedHtml, 'utf-8')
      const filename = `receipt-${subject.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}.html`
      const storagePath = await storeInvoicePdf(htmlBuffer, filename, classificationId)

      const match = await findMatchingXeroInvoice({
        supplier: extracted.supplier ?? '',
        amount_total: extracted.amount_total ?? 0,
        invoice_date: extracted.invoice_date ?? dateStr,
        invoice_number: extracted.invoice_number,
      })

      await supabase.from('invoice_vault').insert({
        source: 'email',
        source_email_id: classificationId,
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

      debug.push(`Email receipt saved: ${extracted.supplier} £${extracted.amount_total} | Xero: ${match.matched ? 'matched' : 'unmatched'}`)
    } catch (bodyErr) {
      debug.push(`Body extraction failed: ${bodyErr instanceof Error ? bodyErr.message : String(bodyErr)}`)
    }
  } catch (err) {
    debug.push(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  return debug
}
