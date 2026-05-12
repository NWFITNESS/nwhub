import { gmailFetch, extractEmailBody, ensureGmailLabels } from '@/lib/gmail/client'
import { classifyEmail } from '@/lib/email/classifier'
import { applyRules, type NormalizedEmail } from '@/lib/email/rules-engine'
import { extractInvoiceFromEmail } from '@/lib/invoices/pipeline'
import type { SupabaseClient } from '@supabase/supabase-js'

// In-memory label cache
let labelCache: { map: Record<string, string>; fetchedAt: number } | null = null
const LABEL_CACHE_TTL = 5 * 60 * 1000

async function getCachedLabels(): Promise<Record<string, string>> {
  if (labelCache && (Date.now() - labelCache.fetchedAt) < LABEL_CACHE_TTL) {
    return labelCache.map
  }
  const map = await ensureGmailLabels(gmailFetch)
  labelCache = { map, fetchedAt: Date.now() }
  return map
}

export interface ProcessResult {
  processed: number
  tasks_created: number
  archived: number
  debug: string[]
}

export async function processGmailEmails(
  supabase: SupabaseClient,
  lookback: string,
): Promise<ProcessResult> {
  const debug: string[] = []
  let processed = 0, tasks_created = 0, archived = 0

  // Fetch recent emails
  const listRes = await gmailFetch(`/users/me/messages?maxResults=50&q=newer_than:${lookback}+in:inbox`)
  if (!listRes.ok) {
    const text = await listRes.text()
    throw new Error(`Gmail fetch failed: ${text}`)
  }

  const listData = await listRes.json()
  const messages: Array<{ id: string }> = listData.messages ?? []

  // Get already-processed IDs
  const { data: existing } = await supabase
    .from('email_classifications')
    .select('gmail_message_id')
  const existingIds = new Set((existing ?? []).map((r: { gmail_message_id: string }) => r.gmail_message_id))

  const newMessages = messages.filter(m => !existingIds.has(m.id))
  debug.push(`Gmail: ${messages.length} found, ${newMessages.length} new`)

  const labelMap = await getCachedLabels()

  for (const msg of newMessages) {
    try {
      const detailRes = await gmailFetch(`/users/me/messages/${msg.id}?format=full`)
      if (!detailRes.ok) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail: any = await detailRes.json()
      const headers: Array<{ name: string; value: string }> = detail.payload?.headers ?? []
      const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const dateStr = getHeader('Date')
      const received_at = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()

      const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/)
      const sender_name = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, '') : from
      const sender = fromMatch ? fromMatch[2] : from

      const body = extractEmailBody(detail.payload)
      const preview = (body || detail.snippet || '').slice(0, 500)

      // Classify
      const aiResult = await classifyEmail({ from, subject, preview })
      if (!aiResult) continue

      // Apply rules
      const senderDomain = sender.includes('@') ? sender.split('@')[1] : ''
      const normalized: NormalizedEmail = {
        from: sender,
        from_domain: senderDomain,
        subject,
        body: preview,
        has_attachment: (detail.payload?.parts ?? []).some((p: { mimeType?: string; filename?: string }) =>
          p.mimeType === 'application/pdf' || p.filename?.toLowerCase().endsWith('.pdf')
        ),
        attachment_types: (detail.payload?.parts ?? [])
          .filter((p: { mimeType?: string }) => p.mimeType && !p.mimeType.startsWith('text/') && !p.mimeType.startsWith('multipart/'))
          .map((p: { mimeType: string }) => p.mimeType),
      }
      const result = await applyRules(normalized, aiResult)
      const category = result.category

      // Create task
      let task_id: string | undefined
      if (result.create_task && result.task_title) {
        const { data: task } = await supabase.from('tasks').insert({
          title: result.task_title,
          notes: result.task_detail || null,
          source: 'email',
          email_id: msg.id,
          due_date: result.task_due_date || null,
          priority: result.task_priority ?? (category === 'needs_attention' ? 'high' : 'medium'),
        }).select('id').single()
        if (task) { task_id = task.id; tasks_created++ }
      }

      // Store classification
      const { data: classRow } = await supabase.from('email_classifications').insert({
        gmail_message_id: msg.id,
        thread_id: detail.threadId,
        sender, sender_name, subject,
        preview: detail.snippet ?? preview.slice(0, 200),
        received_at, category,
        ai_summary: result.ai_summary || null,
        flagged: result.flagged ?? false,
        archived: category === 'spam' || category === 'newsletter' || category === 'receipt_notification',
        task_created: !!task_id,
        task_id: task_id ?? null,
      }).select('id').single()

      // Invoice extraction
      const subjectLower = subject.toLowerCase()
      const hasInvoiceKeyword = subjectLower.includes('invoice') || subjectLower.includes('receipt') || subjectLower.includes('statement') || subjectLower.includes('payment')
      const shouldExtract = result.extract_invoice || category === 'receipt_notification' || (category === 'needs_attention' && hasInvoiceKeyword)

      if (classRow?.id && shouldExtract) {
        const extractDebug = await extractInvoiceFromEmail(supabase, msg.id, classRow.id, subject, sender)
        debug.push(...extractDebug)
      }

      // Gmail labels + starring
      let gmailModify: { addLabelIds?: string[]; removeLabelIds?: string[] }
      if (category === 'spam') {
        gmailModify = { addLabelIds: ['SPAM'], removeLabelIds: ['INBOX', 'UNREAD'] }
        archived++
      } else if (category === 'newsletter') {
        const labelId = labelMap['NWHub/Newsletter']
        gmailModify = { addLabelIds: labelId ? [labelId] : [], removeLabelIds: ['INBOX', 'UNREAD'] }
        archived++
      } else if (category === 'receipt_notification') {
        const labelId = labelMap['NWHub/Receipts']
        gmailModify = { addLabelIds: labelId ? [labelId] : [], removeLabelIds: ['INBOX', 'UNREAD'] }
        archived++
      } else if (category === 'needs_attention') {
        const labelId = labelMap['NWHub/Action Required']
        gmailModify = { addLabelIds: [labelId, 'STARRED'].filter(Boolean) as string[], removeLabelIds: ['UNREAD'] }
      } else if (category === 'new_lead') {
        const labelId = labelMap['NWHub/New Lead']
        gmailModify = { addLabelIds: [labelId, 'STARRED'].filter(Boolean) as string[], removeLabelIds: ['UNREAD'] }
      } else {
        gmailModify = { removeLabelIds: ['UNREAD'] }
      }

      await gmailFetch(`/users/me/messages/${msg.id}/modify`, {
        method: 'POST',
        body: JSON.stringify(gmailModify),
      })

      debug.push(`${sender} | "${subject}" → ${category}`)
      processed++
    } catch (e) {
      console.error(`[gmail-processor] Error processing ${msg.id}:`, e)
    }
  }

  return { processed, tasks_created, archived, debug }
}
