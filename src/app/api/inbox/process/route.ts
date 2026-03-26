import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { gmailFetch, extractEmailBody, ensureGmailLabels } from '@/lib/gmail'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const CLASSIFY_TOOL = {
  name: 'classify_email',
  description: 'Classify a gym business email for Northern Warrior fitness gym',
  input_schema: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        enum: ['needs_attention', 'new_lead', 'newsletter', 'receipt_notification', 'spam'],
        description: 'needs_attention=reply needed or decision required; new_lead=gym enquiry or membership question; newsletter=marketing/informational; receipt_notification=automated receipts; spam=irrelevant',
      },
      ai_summary: { type: 'string', description: '1-2 sentence summary for needs_attention and new_lead emails only, empty string otherwise' },
      flagged: { type: 'boolean', description: 'true for needs_attention and new_lead only' },
      create_task: { type: 'boolean', description: 'true if an action task should be created' },
      task_title: { type: 'string', description: 'Short action task title if create_task is true' },
      task_due_date: { type: 'string', description: 'ISO date YYYY-MM-DD for task due date, or empty string' },
    },
    required: ['category', 'ai_summary', 'flagged', 'create_task'],
  },
}

export async function POST(request: Request) {
  const supabase = createAdminClient()

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
  // Record this run and ensure NWHub labels exist in Gmail
  await supabase.from('global_settings').upsert({ key: 'inbox_last_processed', value: new Date().toISOString() }, { onConflict: 'key' })
  const labelMap = await ensureGmailLabels(gmailFetch)

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
      const preview = (body || detail.snippet || '').slice(0, 300)

      // Claude classification
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: 'any' },
        messages: [{
          role: 'user',
          content: `Classify this email for Northern Warrior fitness gym admin dashboard.\n\nFrom: ${from}\nSubject: ${subject}\nPreview: ${preview}`,
        }],
      })

      const toolUse = response.content.find((b) => b.type === 'tool_use')
      if (!toolUse) continue

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (toolUse as any).input as {
        category: string
        ai_summary: string
        flagged: boolean
        create_task: boolean
        task_title?: string
        task_due_date?: string
      }
      const category = result.category

      // Create task if needed
      let task_id: string | undefined
      if (result.create_task && result.task_title) {
        const { data: task } = await supabase
          .from('tasks')
          .insert({
            title: result.task_title,
            source: 'email',
            due_date: result.task_due_date || null,
            priority: category === 'needs_attention' ? 'high' : 'medium',
          })
          .select('id')
          .single()
        if (task) { task_id = task.id; tasks_created++ }
      }

      // Store classification
      await supabase.from('email_classifications').insert({
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
      })

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

  return NextResponse.json({ processed, tasks_created, archived })
}
