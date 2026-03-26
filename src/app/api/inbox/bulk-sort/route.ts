import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getValidAccessToken, extractEmailBody } from '@/lib/gmail'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const CLASSIFY_TOOL = {
  name: 'classify_email',
  description: 'Classify a gym business email for Northern Warrior fitness gym',
  input_schema: {
    type: 'object' as const,
    properties: {
      category: { type: 'string', enum: ['needs_attention', 'new_lead', 'newsletter', 'receipt_notification', 'spam'] },
      ai_summary: { type: 'string' },
      flagged: { type: 'boolean' },
      create_task: { type: 'boolean' },
      task_title: { type: 'string' },
      task_due_date: { type: 'string' },
    },
    required: ['category', 'ai_summary', 'flagged', 'create_task'],
  },
}

export async function POST() {
  const supabase = createAdminClient()

  // Fetch token ONCE and reuse — avoids 500+ DB reads
  const tokenData = await getValidAccessToken()
  if (!tokenData) return NextResponse.json({ error: 'Gmail not connected or token invalid' }, { status: 401 })

  const gFetch = (path: string, options: RequestInit = {}) =>
    fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${tokenData.accessToken}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    })

  // Get all unread message IDs (paginate up to 500)
  const allMessages: Array<{ id: string }> = []
  let pageToken: string | undefined

  do {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=500&q=in:inbox${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${tokenData.accessToken}` } })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Gmail list failed (${res.status}): ${err}` }, { status: 502 })
    }
    const data = await res.json()
    allMessages.push(...(data.messages ?? []))
    pageToken = data.nextPageToken
  } while (pageToken && allMessages.length < 500)

  const { data: existing } = await supabase.from('email_classifications').select('gmail_message_id')
  const existingIds = new Set((existing ?? []).map((r: { gmail_message_id: string }) => r.gmail_message_id))
  const toProcess = allMessages.filter((m) => !existingIds.has(m.id))

  const total = toProcess.length
  let processed = 0, tasks_created = 0, archived = 0
  const errors: string[] = []

  // Process in batches of 5 — larger batches hit Claude + Gmail rate limits
  const BATCH = 5
  for (let i = 0; i < toProcess.length; i += BATCH) {
    const batch = toProcess.slice(i, i + BATCH)
    await Promise.allSettled(batch.map(async (msg) => {
      try {
        const detailRes = await gFetch(`/users/me/messages/${msg.id}?format=full`)
        if (!detailRes.ok) {
          errors.push(`Detail fetch ${msg.id}: ${detailRes.status} ${await detailRes.text().catch(() => '')}`)
          return
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detail: any = await detailRes.json()
        const headers: Array<{ name: string; value: string }> = detail.payload?.headers ?? []
        const getHeader = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''

        const subject = getHeader('Subject')
        const from = getHeader('From')
        const dateStr = getHeader('Date')
        const received_at = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()
        const fromMatch = from.match(/^(.*?)\s*<(.+?)>$/)
        const sender_name = fromMatch ? fromMatch[1].trim().replace(/^"|"$/g, '') : from
        const sender = fromMatch ? fromMatch[2] : from
        const body = extractEmailBody(detail.payload)
        const preview = (body || detail.snippet || '').slice(0, 300)

        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 256,
          tools: [CLASSIFY_TOOL],
          tool_choice: { type: 'any' },
          messages: [{ role: 'user', content: `Classify: From: ${from}\nSubject: ${subject}\nPreview: ${preview.slice(0, 150)}` }],
        })

        const toolUse = response.content.find((b) => b.type === 'tool_use')
        if (!toolUse) return

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
        const shouldArchive = category === 'spam' || category === 'newsletter' || category === 'receipt_notification'

        let task_id: string | undefined
        if (result.create_task && result.task_title) {
          const { data: task } = await supabase.from('tasks').insert({
            title: result.task_title,
            source: 'email',
            due_date: result.task_due_date || null,
            priority: category === 'needs_attention' ? 'high' : 'medium',
          }).select('id').single()
          if (task) { task_id = task.id; tasks_created++ }
        }

        await supabase.from('email_classifications').upsert({
          gmail_message_id: msg.id,
          thread_id: detail.threadId,
          sender, sender_name, subject,
          preview: detail.snippet ?? preview.slice(0, 200),
          received_at, category,
          ai_summary: result.ai_summary || null,
          flagged: result.flagged ?? false,
          archived: shouldArchive,
          task_created: !!task_id,
          task_id: task_id ?? null,
        }, { onConflict: 'gmail_message_id' })

        if (shouldArchive) {
          await gFetch(`/users/me/messages/${msg.id}/modify`, { method: 'POST', body: JSON.stringify({ removeLabelIds: ['INBOX', 'UNREAD'] }) })
          archived++
        } else {
          await gFetch(`/users/me/messages/${msg.id}/modify`, { method: 'POST', body: JSON.stringify({ removeLabelIds: ['UNREAD'] }) })
        }

        processed++
        await supabase.from('global_settings').upsert({ key: 'bulk_sort_progress', value: JSON.stringify({ processed, total, done: false }) })
      } catch (e) {
        const msg_err = e instanceof Error ? e.message : String(e)
        errors.push(msg_err)
        console.error('[bulk-sort] error on', msg.id, e)
      }
    }))
  }

  await supabase.from('global_settings').upsert({ key: 'bulk_sort_progress', value: JSON.stringify({ processed, total, done: true, tasks_created, archived }) })
  return NextResponse.json({ processed, total, tasks_created, archived, errors: errors.slice(0, 5) })
}
