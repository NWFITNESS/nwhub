import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gmailFetch, extractEmailBody, ensureGmailLabels } from '@/lib/gmail'
import { outlookFetch, getOutlookTokens, ensureOutlookCategories } from '@/lib/outlook'
import { classifyEmail } from '@/lib/email-classifier'
import { applyRules, type NormalizedEmail } from '@/lib/rules-engine'
import { fetchPdfAttachments } from '@/lib/gmail-attachments'
import { extractInvoiceMetadata } from '@/lib/invoice-extractor'
import { storeInvoicePdf } from '@/lib/invoice-storage'
import { findMatchingXeroInvoice } from '@/lib/xero-matcher'

// Vercel crons fire GET — UI button fires POST — both use the same handler
export async function GET(request: Request) { return handler(request) }
export async function POST(request: Request) { return handler(request) }

// In-memory label cache — labels almost never change, so we cache for 5
// minutes to avoid a redundant Gmail API call on every process run.
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

async function handler(request: Request) {
  const supabase = createAdminClient()

  // ── Mutex: prevent concurrent runs from burning duplicate Claude tokens ──
  // Check if another run is in progress (started within the last 3 minutes).
  // If so, skip. The 3-minute window auto-expires in case a prior run crashed
  // without clearing the lock.
  const LOCK_KEY = 'inbox_processing_lock'
  const LOCK_TTL = 3 * 60 * 1000
  const { data: lockData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', LOCK_KEY)
    .single()
  const lockTime = lockData?.value ? new Date(lockData.value).getTime() : 0
  if (lockTime && (Date.now() - lockTime) < LOCK_TTL) {
    return NextResponse.json({ skipped: true, reason: 'Another processing run is in progress' })
  }
  // Acquire the lock
  await supabase.from('global_settings').upsert(
    { key: LOCK_KEY, value: new Date().toISOString() },
    { onConflict: 'key' },
  )

  try {
    return await processEmails(request, supabase)
  } finally {
    // Release the lock — best-effort, don't throw if it fails
    try {
      await supabase.from('global_settings').upsert(
        { key: LOCK_KEY, value: '' },
        { onConflict: 'key' },
      )
    } catch { /* swallow */ }
  }
}

async function processEmails(request: Request, supabase: ReturnType<typeof createAdminClient>) {
  // Check interval throttle (skip if called too soon, unless ?force=true)
  const url = new URL(request.url)
  const force = url.searchParams.get('force') === 'true'
  if (!force) {
    const [{ data: intervalSetting }, { data: lastRunSetting }] = await Promise.all([
      supabase.from('global_settings').select('value').eq('key', 'inbox_process_interval').single(),
      supabase.from('global_settings').select('value').eq('key', 'inbox_last_processed').single(),
    ])
    const intervalMins = parseInt(intervalSetting?.value ?? '5', 10)
    const lastRun = lastRunSetting?.value ? new Date(lastRunSetting.value) : null
    if (lastRun && (Date.now() - lastRun.getTime()) < intervalMins * 60 * 1000) {
      return NextResponse.json({ skipped: true, reason: `Last ran ${Math.round((Date.now() - lastRun.getTime()) / 60000)}m ago, interval is ${intervalMins}m` })
    }
  }
  // Record this run and get Gmail labels (cached)
  await supabase.from('global_settings').upsert({ key: 'inbox_last_processed', value: new Date().toISOString() }, { onConflict: 'key' })
  const labelMap = await getCachedLabels()

  // Fetch unread emails from Gmail
  let listData: { messages?: Array<{ id: string }> }
  try {
    const listRes = await gmailFetch('/users/me/messages?maxResults=50&q=is:unread+in:inbox&labelIds=INBOX')
    if (!listRes.ok) {
      const text = await listRes.text()
      return NextResponse.json({ error: `Gmail fetch failed: ${text}` }, { status: 500 })
    }
    listData = await listRes.json()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: `Gmail fetch failed: ${message}` }, { status: 500 })
  }

  const messages = listData.messages ?? []
  if (messages.length === 0) return NextResponse.json({ processed: 0, tasks_created: 0, archived: 0 })

  // Get already-processed IDs
  const { data: existing } = await supabase
    .from('email_classifications')
    .select('gmail_message_id')
  const existingIds = new Set((existing ?? []).map((r: { gmail_message_id: string }) => r.gmail_message_id))

  const newMessages = messages.filter((m) => !existingIds.has(m.id))

  let processed = 0, tasks_created = 0, archived = 0

  for (const msg of newMessages) {
    try {
      const detailRes = await gmailFetch(`/users/me/messages/${msg.id}?format=full`)
      if (!detailRes.ok) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail: any = await detailRes.json()
      const headers: Array<{ name: string; value: string }> = detail.payload?.headers ?? []
      const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const dateStr = getHeader('Date')
      const received_at = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()

      // Extract sender name and email
      const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/)
      const sender_name = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, '') : from
      const sender = fromMatch ? fromMatch[2] : from

      const body = extractEmailBody(detail.payload)
      const preview = (body || detail.snippet || '').slice(0, 500)

      const aiResult = await classifyEmail({ from, subject, preview })
      if (!aiResult) continue

      // Apply rules engine — rules can override AI classification
      const senderDomain = sender.includes('@') ? sender.split('@')[1] : ''
      const normalizedEmail: NormalizedEmail = {
        from: sender,
        from_domain: senderDomain,
        subject,
        body: preview,
        has_attachment: (detail.payload?.parts ?? []).some((p: { mimeType?: string }) => p.mimeType === 'application/pdf' || p.mimeType?.startsWith('image/')),
        attachment_types: (detail.payload?.parts ?? []).filter((p: { mimeType?: string }) => p.mimeType && !p.mimeType.startsWith('text/') && !p.mimeType.startsWith('multipart/')).map((p: { mimeType: string }) => p.mimeType),
      }
      const result = await applyRules(normalizedEmail, aiResult)

      const category = result.category

      // Create task if needed
      let task_id: string | undefined
      if (result.create_task && result.task_title) {
        const { data: task } = await supabase
          .from('tasks')
          .insert({
            title: result.task_title,
            notes: result.task_detail || null,
            source: 'email',
            email_id: msg.id,
            due_date: result.task_due_date || null,
            priority: result.task_priority ?? (category === 'needs_attention' ? 'high' : 'medium'),
          })
          .select('id')
          .single()
        if (task) { task_id = task.id; tasks_created++ }
      }

      // Store classification
      const { data: classRow } = await supabase.from('email_classifications').insert({
        gmail_message_id: msg.id,
        thread_id: detail.threadId,
        sender,
        sender_name,
        subject,
        preview: detail.snippet ?? preview.slice(0, 200),
        received_at,
        category,
        ai_summary: result.ai_summary || null,
        flagged: result.flagged ?? false,
        archived: category === 'spam' || category === 'newsletter' || category === 'receipt_notification',
        task_created: !!task_id,
        task_id: task_id ?? null,
      }).select('id').single()

      // Invoice extraction — for receipts or when rules set extract_invoice (Gmail only)
      console.log(`[inbox/process] Gmail: ${sender} | "${subject}" → ${category} | extract: ${result.extract_invoice ?? false}`)
      if (classRow?.id && (result.extract_invoice || category === 'receipt_notification')) {
        try {
          const pdfs = await fetchPdfAttachments(msg.id)
          for (const pdf of pdfs) {
            try {
              const extracted = await extractInvoiceMetadata(pdf.data)
              if (!extracted || !extracted.is_invoice) continue

              const storagePath = await storeInvoicePdf(pdf.data, pdf.filename, classRow.id)
              const match = await findMatchingXeroInvoice({
                supplier: extracted.supplier ?? '',
                amount_total: extracted.amount_total ?? 0,
                invoice_date: extracted.invoice_date ?? new Date().toISOString().split('T')[0],
                invoice_number: extracted.invoice_number,
              })

              await supabase.from('invoice_vault').insert({
                source: 'email',
                source_email_id: classRow.id,
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
            } catch (pdfErr) {
              console.error(`[inbox/process] PDF extraction failed for ${pdf.filename}:`, pdfErr instanceof Error ? pdfErr.message : pdfErr)
              // Continue — one bad PDF must not crash the batch
            }
          }
        } catch (attErr) {
          console.error(`[inbox/process] Attachment fetch failed for ${msg.id}:`, attErr instanceof Error ? attErr.message : attErr)
        }
      }

      // Move to correct Gmail folder/label based on category
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
        gmailModify = { addLabelIds: labelId ? [labelId] : [], removeLabelIds: ['UNREAD'] }
      } else if (category === 'new_lead') {
        const labelId = labelMap['NWHub/New Lead']
        gmailModify = { addLabelIds: labelId ? [labelId] : [], removeLabelIds: ['UNREAD'] }
      } else {
        gmailModify = { removeLabelIds: ['UNREAD'] }
      }
      await gmailFetch(`/users/me/messages/${msg.id}/modify`, {
        method: 'POST',
        body: JSON.stringify(gmailModify),
      })

      processed++
    } catch (e) {
      console.error(`[inbox/process] Error processing ${msg.id}:`, e)
    }
  }

  // ── Process Outlook emails (if connected) ───────────────────────────
  const outlookTokens = await getOutlookTokens()
  if (outlookTokens) {
    try {
      const outlookResult = await processOutlookEmails(supabase)
      processed += outlookResult.processed
      tasks_created += outlookResult.tasks_created
      archived += outlookResult.archived
    } catch (e) {
      console.error('[inbox/process] Outlook processing failed:', (e as Error).message)
    }
  }

  return NextResponse.json({ processed, tasks_created, archived })
}

// ─────────────────────────────────────────────────────────────────────────────
// Outlook email processor — mirrors the Gmail flow above but uses Microsoft
// Graph API. The classifier is identical; only the fetch/flag/categorize
// calls differ.
// ─────────────────────────────────────────────────────────────────────────────

async function processOutlookEmails(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ processed: number; tasks_created: number; archived: number }> {
  // Fetch unread emails from Outlook inbox
  const listRes = await outlookFetch(
    "/me/mailFolders/inbox/messages?$filter=isRead eq false&$top=50&$select=id,subject,from,receivedDateTime,bodyPreview,importance&$orderby=receivedDateTime desc",
  )

  if (!listRes.ok) {
    const text = await listRes.text()
    throw new Error(`Outlook fetch failed (${listRes.status}): ${text}`)
  }

  const listData = await listRes.json()
  const messages: Array<{
    id: string
    subject: string
    from: { emailAddress: { name: string; address: string } }
    receivedDateTime: string
    bodyPreview: string
    importance: string
  }> = listData.value ?? []

  if (!messages.length) return { processed: 0, tasks_created: 0, archived: 0 }

  // Get already-processed Outlook IDs
  const { data: existing } = await supabase
    .from('email_classifications')
    .select('outlook_message_id')
    .not('outlook_message_id', 'is', null)
  const existingIds = new Set((existing ?? []).map((r: { outlook_message_id: string }) => r.outlook_message_id))

  const newMessages = messages.filter((m) => !existingIds.has(m.id))
  let processed = 0, tasks_created = 0, archived = 0

  for (const msg of newMessages) {
    try {
      const sender = msg.from?.emailAddress?.address ?? 'unknown'
      const senderName = msg.from?.emailAddress?.name ?? sender
      const subject = msg.subject ?? '(no subject)'
      const preview = msg.bodyPreview ?? ''
      const receivedAt = msg.receivedDateTime
        ? new Date(msg.receivedDateTime).toISOString()
        : new Date().toISOString()

      // Classify with the same AI classifier used for Gmail
      const aiResult = await classifyEmail({
        from: `${senderName} <${sender}>`,
        subject,
        preview,
      })
      if (!aiResult) continue

      // Apply rules engine
      const outlookSenderDomain = sender.includes('@') ? sender.split('@')[1] : ''
      const outlookNormalized: NormalizedEmail = {
        from: sender,
        from_domain: outlookSenderDomain,
        subject,
        body: preview,
        has_attachment: false, // Outlook attachment detection deferred
        attachment_types: [],
      }
      const result = await applyRules(outlookNormalized, aiResult)

      const category = result.category

      // Create task if needed
      let task_id: string | undefined
      if (result.create_task && result.task_title) {
        const { data: task } = await supabase
          .from('tasks')
          .insert({
            title: result.task_title,
            notes: result.task_detail || null,
            source: 'email',
            email_id: msg.id,
            due_date: result.task_due_date || null,
            priority: result.task_priority ?? (category === 'needs_attention' ? 'high' : 'medium'),
          })
          .select('id')
          .single()
        if (task) { task_id = task.id; tasks_created++ }
      }

      // Store classification
      await supabase.from('email_classifications').insert({
        outlook_message_id: msg.id,
        provider: 'outlook',
        sender,
        sender_name: senderName,
        subject,
        preview: preview.slice(0, 200),
        received_at: receivedAt,
        category,
        ai_summary: result.ai_summary || null,
        flagged: result.flagged ?? false,
        archived: category === 'spam' || category === 'newsletter' || category === 'receipt_notification',
        task_created: !!task_id,
        task_id: task_id ?? null,
      })

      // Apply Outlook-specific actions based on classification
      console.log(`[inbox/process] Outlook: ${sender} | "${subject}" → ${category}`)

      const catMap = await ensureOutlookCategories()
      const outlookCategory = catMap[category]

      if (category === 'spam') {
        const moveRes = await outlookFetch(`/me/messages/${msg.id}/move`, {
          method: 'POST',
          body: JSON.stringify({ destinationId: 'junkemail' }),
        })
        if (!moveRes.ok) console.error(`[inbox/process] Outlook move to junk failed:`, await moveRes.text().catch(() => ''))
        archived++
      } else if (category === 'needs_attention') {
        const patchRes = await outlookFetch(`/me/messages/${msg.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            flag: { flagStatus: 'flagged' },
            importance: 'high',
            isRead: false,
            categories: outlookCategory ? [outlookCategory] : [],
          }),
        })
        if (!patchRes.ok) console.error(`[inbox/process] Outlook flag failed:`, await patchRes.text().catch(() => ''))
      } else if (category === 'new_lead') {
        const patchRes = await outlookFetch(`/me/messages/${msg.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            flag: { flagStatus: 'flagged' },
            isRead: false,
            categories: outlookCategory ? [outlookCategory] : [],
          }),
        })
        if (!patchRes.ok) console.error(`[inbox/process] Outlook flag failed:`, await patchRes.text().catch(() => ''))
      } else if (category === 'newsletter' || category === 'receipt_notification') {
        const patchRes = await outlookFetch(`/me/messages/${msg.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            isRead: true,
            categories: outlookCategory ? [outlookCategory] : [],
          }),
        })
        if (!patchRes.ok) console.error(`[inbox/process] Outlook category failed:`, await patchRes.text().catch(() => ''))
        const moveRes = await outlookFetch(`/me/messages/${msg.id}/move`, {
          method: 'POST',
          body: JSON.stringify({ destinationId: 'archive' }),
        })
        if (!moveRes.ok) console.error(`[inbox/process] Outlook move to archive failed:`, await moveRes.text().catch(() => ''))
        archived++
      } else {
        await outlookFetch(`/me/messages/${msg.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            isRead: true,
            categories: outlookCategory ? [outlookCategory] : [],
          }),
        })
      }

      processed++
    } catch (e) {
      console.error(`[inbox/process] Error processing Outlook message ${msg.id}:`, e)
    }
  }

  return { processed, tasks_created, archived }
}
