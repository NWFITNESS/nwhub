import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export interface ExtractedInvoice {
  is_invoice: boolean
  supplier?: string
  amount_total?: number
  amount_currency?: string
  invoice_date?: string
  due_date?: string | null
  invoice_number?: string | null
}

/**
 * Extract structured metadata from a PDF invoice/receipt using Claude.
 * Sends the PDF as a document content block (Sonnet 4 supports PDF input).
 * Returns null if extraction fails.
 */
export async function extractInvoiceMetadata(pdfBuffer: Buffer): Promise<ExtractedInvoice | null> {
  try {
    const base64 = pdfBuffer.toString('base64')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Extract the following from this invoice/receipt PDF. Return JSON only, no preamble.

{
  "supplier": "company name issuing the invoice",
  "amount_total": <number, total including tax, in GBP>,
  "amount_currency": "GBP" | "USD" | "EUR" | "other",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD" | null,
  "invoice_number": "string or null",
  "is_invoice": true | false
}

If the document is not an invoice/receipt, return {"is_invoice": false} only.`,
          },
        ],
      }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.type === 'text' ? b.text : '')
      .join('')
      .trim()

    // Parse JSON — handle markdown code blocks if Claude wraps it
    const jsonStr = text.replace(/^```json?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed: ExtractedInvoice = JSON.parse(jsonStr)
    return parsed
  } catch (e) {
    console.error('[invoice-extractor] Extraction failed:', e instanceof Error ? e.message : e)
    return null
  }
}
