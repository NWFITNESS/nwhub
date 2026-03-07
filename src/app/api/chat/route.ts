import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_CHAT_SYSTEM_PROMPT } from '@/lib/chat-defaults'
import type { ChatSettings } from '@/lib/types'

const SAVE_LEAD_TOOL: Anthropic.Tool = {
  name: 'save_lead',
  description:
    "Save a visitor's contact details when they've expressed interest in joining Northern Warrior. Call this once you have collected their full name, email address, and phone number.",
  input_schema: {
    type: 'object' as const,
    properties: {
      name:  { type: 'string', description: 'Full name of the visitor' },
      email: { type: 'string', description: 'Email address' },
      phone: { type: 'string', description: 'Phone number (UK format preferred)' },
    },
    required: ['name', 'email', 'phone'],
  },
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()

  // Load settings
  const { data: settingsRow } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'chat_settings')
    .single()

  const settings = settingsRow?.value as Partial<ChatSettings> | null

  if (settings?.enabled === false) {
    return NextResponse.json({ error: 'Chat is currently disabled' }, { status: 503 })
  }

  const apiKey = settings?.api_key || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  const systemPrompt = settings?.system_prompt || DEFAULT_CHAT_SYSTEM_PROMPT

  let body: { session_id: string; messages: Anthropic.MessageParam[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { session_id, messages } = body
  if (!session_id || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'session_id and messages required' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let fullAssistantText = ''
      let leadContactId: string | null = null

      function send(payload: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      try {
        // ── First streaming call ──────────────────────────────────────────
        const firstStream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          system: systemPrompt,
          tools: [SAVE_LEAD_TOOL],
          messages,
        })

        for await (const event of firstStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullAssistantText += event.delta.text
            send({ text: event.delta.text })
          }
        }

        const finalMsg = await firstStream.finalMessage()

        // ── Tool use: save_lead ───────────────────────────────────────────
        if (finalMsg.stop_reason === 'tool_use') {
          const toolBlock = finalMsg.content.find(
            (c): c is Anthropic.ToolUseBlock => c.type === 'tool_use'
          )

          if (toolBlock && toolBlock.name === 'save_lead') {
            const input = toolBlock.input as { name: string; email: string; phone: string }

            // Split name into first/last
            const parts = (input.name ?? '').trim().split(/\s+/)
            const firstName = parts[0] ?? ''
            const lastName = parts.slice(1).join(' ')

            // Insert contact
            const { data: contact } = await supabase
              .from('contacts')
              .insert({
                first_name: firstName,
                last_name: lastName,
                email: input.email || null,
                phone: input.phone || null,
                source: 'website_chat',
                status: 'active',
                groups: [],
              })
              .select('id')
              .single()

            leadContactId = contact?.id ?? null

            // Second streaming call with tool result
            const secondStream = anthropic.messages.stream({
              model: 'claude-opus-4-6',
              max_tokens: 512,
              system: systemPrompt,
              tools: [SAVE_LEAD_TOOL],
              messages: [
                ...messages,
                { role: 'assistant' as const, content: finalMsg.content },
                {
                  role: 'user' as const,
                  content: [
                    {
                      type: 'tool_result' as const,
                      tool_use_id: toolBlock.id,
                      content: "Lead saved successfully! The visitor's details have been recorded and the team will be in touch.",
                    },
                  ],
                },
              ],
            })

            for await (const event of secondStream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                fullAssistantText += event.delta.text
                send({ text: event.delta.text })
              }
            }
          }
        }

        if (leadContactId) send({ lead_captured: true })
        send({ done: true })

        // ── Persist session ───────────────────────────────────────────────
        const ip =
          req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
          req.headers.get('x-real-ip') ??
          null

        const updatedMessages = [
          ...messages,
          {
            role: 'assistant' as const,
            content: fullAssistantText,
            timestamp: new Date().toISOString(),
          },
        ]

        await supabase.from('chat_sessions').upsert(
          {
            session_id,
            messages: updatedMessages,
            lead_captured: !!leadContactId,
            contact_id: leadContactId,
            ip_address: ip,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'session_id' }
        )
      } catch (err) {
        console.error('Chat stream error:', err)
        send({ error: 'Something went wrong. Please try again.' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
