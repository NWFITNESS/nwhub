import { gmailFetch } from '@/lib/gmail'

interface PdfAttachment {
  filename: string
  data: Buffer
  mimeType: string
}

/**
 * Fetch all PDF attachments from a Gmail message.
 * Walks payload.parts recursively, downloads each PDF attachment by ID.
 */
export async function fetchPdfAttachments(messageId: string): Promise<PdfAttachment[]> {
  // Fetch full message to get attachment metadata
  const msgRes = await gmailFetch(`/users/me/messages/${messageId}?format=full`)
  if (!msgRes.ok) return []

  const msg = await msgRes.json()
  const attachments: PdfAttachment[] = []

  // Recursively find PDF parts
  function walkParts(parts: Array<{ mimeType?: string; filename?: string; body?: { attachmentId?: string; size?: number }; parts?: unknown[] }>) {
    for (const part of parts) {
      if (part.mimeType === 'application/pdf' && part.body?.attachmentId && part.filename) {
        attachments.push({
          filename: part.filename,
          data: Buffer.alloc(0), // placeholder — will be filled below
          mimeType: 'application/pdf',
        })
        // Store the attachment ID for download
        ;(attachments[attachments.length - 1] as { _attachmentId?: string })._attachmentId = part.body.attachmentId
      }
      if (part.parts) {
        walkParts(part.parts as typeof parts)
      }
    }
  }

  if (msg.payload?.parts) {
    walkParts(msg.payload.parts)
  } else if (msg.payload?.body?.attachmentId && msg.payload?.mimeType === 'application/pdf') {
    attachments.push({
      filename: msg.payload.filename || 'attachment.pdf',
      data: Buffer.alloc(0),
      mimeType: 'application/pdf',
    })
    ;(attachments[0] as { _attachmentId?: string })._attachmentId = msg.payload.body.attachmentId
  }

  // Download each attachment
  for (const att of attachments) {
    const attachmentId = (att as { _attachmentId?: string })._attachmentId
    if (!attachmentId) continue

    try {
      const attRes = await gmailFetch(
        `/users/me/messages/${messageId}/attachments/${attachmentId}`
      )
      if (attRes.ok) {
        const attData = await attRes.json()
        if (attData.data) {
          // Gmail returns base64url-encoded data
          att.data = Buffer.from(attData.data, 'base64url')
        }
      }
    } catch (e) {
      console.error(`[gmail-attachments] Failed to download attachment ${attachmentId}:`, e)
    }

    // Clean up internal field
    delete (att as { _attachmentId?: string })._attachmentId
  }

  // Filter out any that failed to download
  return attachments.filter(a => a.data.length > 0)
}
