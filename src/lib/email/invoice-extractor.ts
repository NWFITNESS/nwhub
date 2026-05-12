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
 * Convert an email HTML body into a simple styled PDF-like HTML document
 * that can be stored and viewed later.
 */
export function wrapEmailAsHtml(emailBody: string, subject: string, sender: string, date: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${subject}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; color: #333; }
  .header { border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 16px; font-size: 12px; color: #888; }
</style>
</head>
<body>
<div class="header">
  <strong>From:</strong> ${sender}<br>
  <strong>Subject:</strong> ${subject}<br>
  <strong>Date:</strong> ${date}
</div>
${emailBody}
</body>
</html>`
}
