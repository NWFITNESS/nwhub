import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { gmailFetch, extractEmailBody, getHeader } from '@/lib/gmail'

const TRIAGE_TOOL: Anthropic.Tool = {
  name: 'classify_email',
  description: 'Classify a gym business email for Northern Warrior, a functional fitness and strength & conditioning gym in the UK.',
  input_schema: {
    type: 'object' as const,
    properties: {
      category: {
        type: 'string',
        enum: ['PRIORITY', 'INFO', 'JUNK', 'NEEDS_REPLY', 'MEMBER', 'SUPPLIER', 'FINANCIAL'],
        description: 'PRIORITY=urgent owner attention, INFO=informational, JUNK=spam/unwanted, NEEDS_REPLY=awaiting response, MEMBER=from a gym member, SUPPLIER=from a supplier/vendor, FINANCIAL=invoices/payments/accounting',
      },
      requires_reply: { type: 'boolean', description: 'Does this email need a reply?' },
      urgency: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'How urgently does this need attention?',
      },
      is_flagged: { type: 'boolean', description: 'Should this be flagged for owner attention?' },
      ai_summary: { type: 'string', description: 'One-sentence summary of the email content' },
      ai_suggested_action: { type: 'string', description: 'Optional: suggested action for the gym owner' },
      create_todo: { type: 'boolean', description: 'Should a task be created from this email?' },
      todo_title: { type: 'string', description: 'Title for the task if create_todo is true' },
      todo_due_date: { type: 'string', description: 'ISO date (YYYY-MM-DD) if a deadline is mentioned' },
    },
    required: ['category', 'requires_reply', 'urgency', 'is_flagged', 'ai_summary'],
  },
}

const GMAIL_LABELS = {
  PRIORITY: 'NWHub/Priority',
  NEEDS_REPLY: 'NWHub/Priority',
  MEMBER: 'NWHub/Members',
  FINANCIAL: 'NWHub/Financial',
}

async function ensureLabel(accessToken: string, labelName: string): Promise<string | null> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null

  const { labels } = await res.json()
  const existing = labels?.find((l: { name: string; id: string }) => l.name === labelName)
  if (existing) return existing.id

  // Create label
  const parts = labelName.split('/')
  const createRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
      color: parts[1] === 'Priority'
        ? { backgroundColor: '#cc3a21', textColor: '#ffffff' }
        : parts[1] === 'Members'
        ? { backgroundColor: '#1c4587', textColor: '#ffffff' }
        : { backgroundColor: '#7e6514', textColor: '#ffffff' },
    }),
  })

  if (!createRes.ok) return null
  const created = await createRes.json()
  return created.id
}

export async function POST() {
  const supabase = createAdminClient()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let processed = 0
  let todosCreated = 0
  let junkMoved = 0

  try {
    // Get valid access token
    const { data: tokenData } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'gmail_tokens')
      .single()

    if (!tokenData?.value) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 401 })
    }

    const tokens = JSON.parse(tokenData.value)
    const accessToken = tokens.access_token

    // Fetch up to 50 unread emails from INBOX
    const listRes = await gmailFetch('/users/me/messages?maxResults=50&q=is:unread in:inbox')
    if (!listRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch Gmail messages' }, { status: 502 })
    }

    const listData = await listRes.json()
    const messageIds: string[] = (listData.messages ?? []).map((m: { id: string }) => m.id)

    if (messageIds.length === 0) {
      return NextResponse.json({ processed: 0, todos_created: 0, junk_moved: 0, message: 'No unread emails' })
    }

    // Get already-triaged gmail_ids to skip
    const { data: existingRows } = await supabase
      .from('email_triage')
      .select('gmail_id')
      .in('gmail_id', messageIds)

    const existingIds = new Set((existingRows ?? []).map((r: { gmail_id: string }) => r.gmail_id))
    const toProcess = messageIds.filter((id) => !existingIds.has(id))

    // Label ID cache
    const labelCache: Record<string, string | null> = {}

    async function getLabelId(labelName: string): Promise<string | null> {
      if (labelName in labelCache) return labelCache[labelName]
      const id = await ensureLabel(accessToken, labelName)
      labelCache[labelName] = id
      return id
    }

    for (const gmailId of toProcess) {
      try {
        // Fetch full message
        const msgRes = await gmailFetch(`/users/me/messages/${gmailId}?format=full`)
        if (!msgRes.ok) continue

        const msg = await msgRes.json()
        const headers = msg.payload?.headers ?? []

        const subject = getHeader(headers, 'Subject') || '(no subject)'
        const fromRaw = getHeader(headers, 'From')
        const dateRaw = getHeader(headers, 'Date')

        // Parse from name/email
        const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/)
        const fromName = fromMatch ? fromMatch[1].replace(/^"|"$/g, '').trim() : fromRaw
        const fromEmail = fromMatch ? fromMatch[2] : fromRaw

        const snippet = msg.snippet ?? ''
        const bodyText = extractEmailBody(msg.payload).slice(0, 2000) // limit for AI

        // Send to Claude for classification
        const aiRes = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          tools: [TRIAGE_TOOL],
          tool_choice: { type: 'any' },
          messages: [
            {
              role: 'user',
              content: `Classify this email for a UK functional fitness gym owner:\n\nFrom: ${fromRaw}\nSubject: ${subject}\nSnippet: ${snippet}\n\nBody:\n${bodyText}`,
            },
          ],
        })

        const toolBlock = aiRes.content.find(
          (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use'
        )

        if (!toolBlock) continue

        const classification = toolBlock.input as {
          category: string
          requires_reply: boolean
          urgency: string
          is_flagged: boolean
          ai_summary: string
          ai_suggested_action?: string
          create_todo?: boolean
          todo_title?: string
          todo_due_date?: string
        }

        // Create todo if AI says so
        let todoId: string | null = null
        if (classification.create_todo && classification.todo_title) {
          const { data: todo } = await supabase
            .from('todos')
            .insert({
              title: classification.todo_title,
              source: 'email',
              email_gmail_id: gmailId,
              email_subject: subject,
              email_from: fromEmail,
              priority: classification.urgency === 'high' ? 'high' : 'medium',
              due_date: classification.todo_due_date ?? null,
            })
            .select('id')
            .single()

          todoId = todo?.id ?? null
          if (todoId) todosCreated++
        }

        // Insert into email_triage
        await supabase.from('email_triage').insert({
          gmail_id: gmailId,
          thread_id: msg.threadId,
          from_email: fromEmail,
          from_name: fromName,
          subject,
          snippet,
          category: classification.category,
          requires_reply: classification.requires_reply,
          is_flagged: classification.is_flagged,
          ai_summary: classification.ai_summary,
          ai_suggested_action: classification.ai_suggested_action ?? null,
          urgency: classification.urgency,
          todo_id: todoId,
          received_at: dateRaw ? new Date(dateRaw).toISOString() : new Date().toISOString(),
        })

        // Post-classification actions
        if (classification.category === 'JUNK') {
          // Move to trash
          await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailId}/trash`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          junkMoved++
        } else {
          // Apply category label
          const labelName = GMAIL_LABELS[classification.category as keyof typeof GMAIL_LABELS]
          if (labelName) {
            const labelId = await getLabelId(labelName)
            if (labelId) {
              await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailId}/modify`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ addLabelIds: [labelId], removeLabelIds: ['UNREAD'] }),
              })
            } else {
              // Still mark as read
              await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailId}/modify`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
              })
            }
          } else {
            // Mark as read
            await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailId}/modify`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
            })
          }
        }

        processed++
      } catch (msgErr) {
        console.error(`[gmail/triage] Error processing message ${gmailId}:`, msgErr)
        // Continue with next message
      }
    }

    return NextResponse.json({ processed, todos_created: todosCreated, junk_moved: junkMoved })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[gmail/triage]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
