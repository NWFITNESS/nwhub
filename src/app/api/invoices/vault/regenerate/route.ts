import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { generateInvoiceHtml } from '@/lib/email/invoice-extractor'

/**
 * POST — Regenerate all email-sourced invoice HTML files in storage
 * using the new professional template. One-off migration endpoint.
 */
export async function POST() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  // Fetch all email-sourced vault entries with HTML files
  const { data: invoices, error } = await supabase
    .from('invoice_vault')
    .select('*')
    .eq('source', 'email')
    .eq('status', 'active')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!invoices?.length) return NextResponse.json({ message: 'No email invoices to regenerate', count: 0 })

  const htmlInvoices = invoices.filter(inv => inv.pdf_storage_path?.endsWith('.html'))

  let updated = 0
  let failed = 0
  const errors: string[] = []

  for (const inv of htmlInvoices) {
    try {
      const invoiceHtml = generateInvoiceHtml(
        {
          supplier: inv.supplier,
          amount_total: inv.amount,
          amount_currency: inv.currency ?? 'GBP',
          invoice_date: inv.invoice_date,
          due_date: inv.due_date,
          invoice_number: inv.invoice_number,
          is_invoice: true,
        },
        inv.invoice_number ? `Invoice ${inv.invoice_number}` : `Payment to ${inv.supplier ?? 'supplier'}`,
        inv.supplier ?? '',
        inv.invoice_date ?? inv.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      )

      const htmlBuffer = Buffer.from(invoiceHtml, 'utf-8')

      const { error: uploadError } = await supabase.storage
        .from('invoice-pdfs')
        .upload(inv.pdf_storage_path, htmlBuffer, {
          contentType: 'text/html',
          upsert: true,
        })

      if (uploadError) {
        errors.push(`${inv.supplier}: ${uploadError.message}`)
        failed++
      } else {
        updated++
      }
    } catch (e) {
      errors.push(`${inv.supplier}: ${e instanceof Error ? e.message : String(e)}`)
      failed++
    }
  }

  return NextResponse.json({
    message: `Regenerated ${updated} invoice(s)`,
    total_html: htmlInvoices.length,
    updated,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  })
}
