import { fetchPdfAttachments } from '@/lib/gmail-attachments'
import { extractInvoiceMetadata } from '@/lib/invoice-extractor'
import { storeInvoicePdf } from '@/lib/invoice-storage'
import { findMatchingXeroInvoice } from '@/lib/xero-matcher'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Extract invoice PDFs from a Gmail message, store them, and match to Xero.
 * Returns debug lines for visibility.
 */
export async function extractInvoiceFromEmail(
  supabase: SupabaseClient,
  gmailMessageId: string,
  classificationId: string,
): Promise<string[]> {
  const debug: string[] = []

  try {
    const pdfs = await fetchPdfAttachments(gmailMessageId)
    debug.push(`Found ${pdfs.length} PDF(s)`)

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
  } catch (attErr) {
    debug.push(`Attachment fetch failed: ${attErr instanceof Error ? attErr.message : String(attErr)}`)
  }

  return debug
}
