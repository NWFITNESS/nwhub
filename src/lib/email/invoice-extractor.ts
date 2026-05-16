import Anthropic from '@anthropic-ai/sdk'
import type { ExtractedInvoice } from '@/lib/invoices/extractor'

const anthropic = new Anthropic()

/**
 * Extract invoice data from an email body (HTML or plain text).
 * Used when the email IS the invoice (no PDF attachment) — e.g. Mailchimp,
 * Vercel, Canva receipts that come as formatted HTML emails.
 */
export async function extractInvoiceFromEmailBody(
  emailBody: string,
  subject: string,
  sender: string,
): Promise<ExtractedInvoice | null> {
  try {
    // Strip HTML tags for a cleaner text representation
    const text = emailBody
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000) // limit to avoid token waste

    if (text.length < 20) return null

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract invoice/receipt data from this email. Return JSON only, no preamble.

From: ${sender}
Subject: ${subject}

Email body:
${text}

Return this exact JSON structure:
{
  "supplier": "company name issuing the invoice/receipt",
  "amount_total": <number, total amount paid including tax, in original currency>,
  "amount_currency": "GBP" | "USD" | "EUR" | "other",
  "invoice_date": "YYYY-MM-DD",
  "due_date": null,
  "invoice_number": "order/invoice number or null",
  "is_invoice": true | false
}

If this email is not an invoice, receipt, or order confirmation, return {"is_invoice": false} only.
Note: if it has been paid already (receipt), set due_date to null — it's already settled.`,
      }],
    })

    const responseText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.type === 'text' ? b.text : '')
      .join('')
      .trim()

    const jsonStr = responseText.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('[email-invoice-extractor] Failed:', e instanceof Error ? e.message : e)
    return null
  }
}

/**
 * Generate a professional invoice-style HTML document from extracted data.
 * Used when an email contains a payment/receipt but no PDF attachment.
 */
export function generateInvoiceHtml(
  extracted: ExtractedInvoice,
  subject: string,
  sender: string,
  date: string,
): string {
  const supplier = extracted.supplier ?? 'Unknown Supplier'
  const amount = extracted.amount_total ?? 0
  const currency = extracted.amount_currency ?? 'GBP'
  const invoiceNumber = extracted.invoice_number ?? '\u2014'
  const invoiceDate = extracted.invoice_date ?? date
  const dueDate = extracted.due_date

  const currencySymbol = currency === 'GBP' ? '\u00a3' : currency === 'USD' ? '$' : currency === 'EUR' ? '\u20ac' : currency + ' '
  const formattedAmount = currencySymbol + amount.toFixed(2)
  const formattedDate = formatDate(invoiceDate)
  const formattedDueDate = dueDate ? formatDate(dueDate) : null

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice - ${escapeHtml(supplier)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
  .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #111; }
  .invoice-title { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; color: #111; }
  .invoice-badge { background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; display: inline-block; }
  .supplier-block { margin-bottom: 40px; }
  .supplier-name { font-size: 20px; font-weight: 600; color: #111; margin-bottom: 4px; }
  .supplier-email { font-size: 13px; color: #666; }
  .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 24px; margin-bottom: 48px; padding: 20px 24px; background: #f8f9fa; border-radius: 8px; }
  .meta-item label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 4px; }
  .meta-item span { font-size: 14px; font-weight: 500; color: #222; }
  .line-items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .line-items th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
  .line-items th:last-child { text-align: right; }
  .line-items td { padding: 16px; font-size: 14px; color: #333; border-bottom: 1px solid #f0f0f0; }
  .line-items td:last-child { text-align: right; font-weight: 500; }
  .totals { display: flex; justify-content: flex-end; margin-top: 8px; }
  .totals-table { width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #555; }
  .totals-row.total { border-top: 2px solid #111; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 700; color: #111; }
  .footer { margin-top: 64px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; text-align: center; }
  .paid-stamp { color: #166534; font-weight: 700; font-size: 14px; }
</style>
</head>
<body>
  <div class="invoice-header">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-badge">Paid</div>
    </div>
    <div style="text-align: right; font-size: 13px; color: #666;">
      <div style="font-weight: 600; color: #111; margin-bottom: 4px;">Northern Warrior</div>
      <div>Billed To</div>
    </div>
  </div>

  <div class="supplier-block">
    <div class="supplier-name">${escapeHtml(supplier)}</div>
    <div class="supplier-email">${escapeHtml(sender)}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <label>Invoice Number</label>
      <span>${escapeHtml(invoiceNumber)}</span>
    </div>
    <div class="meta-item">
      <label>Invoice Date</label>
      <span>${formattedDate}</span>
    </div>
    ${formattedDueDate ? `<div class="meta-item">
      <label>Due Date</label>
      <span>${formattedDueDate}</span>
    </div>` : ''}
    <div class="meta-item">
      <label>Status</label>
      <span class="paid-stamp">Paid</span>
    </div>
  </div>

  <table class="line-items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(subject || 'Payment to ' + supplier)}</td>
        <td>${formattedAmount}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row total">
        <span>Total Paid</span>
        <span>${formattedAmount}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    Generated from email receipt &bull; ${escapeHtml(sender)} &bull; ${formattedDate}
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}
