import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Upload an invoice PDF to the invoice-pdfs Supabase Storage bucket.
 * Returns the storage path (not a full URL — use getSignedUrl for download).
 */
export async function storeInvoicePdf(
  pdfBuffer: Buffer,
  filename: string,
  emailId: string,
): Promise<string> {
  const supabase = createAdminClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  // Sanitise filename
  const sanitised = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const path = `invoices/${year}/${month}/${emailId}-${sanitised}`

  const contentType = sanitised.endsWith('.html') ? 'text/html' : 'application/pdf'

  const { error } = await supabase.storage
    .from('invoice-pdfs')
    .upload(path, pdfBuffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error('[invoice-storage] Upload failed:', error.message)
    throw new Error(`PDF upload failed: ${error.message}`)
  }

  return path
}

/**
 * Get a signed download URL for a stored invoice PDF.
 * Valid for 1 hour.
 */
export async function getInvoicePdfUrl(storagePath: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('invoice-pdfs')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (error) {
    console.error('[invoice-storage] Signed URL failed:', error.message)
    return null
  }
  return data.signedUrl
}

/**
 * Download file content directly from storage (used for HTML invoice preview).
 */
export async function getInvoiceFileContent(storagePath: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('invoice-pdfs')
    .download(storagePath)

  if (error || !data) {
    console.error('[invoice-storage] Download failed:', error?.message)
    return null
  }
  return await data.text()
}
