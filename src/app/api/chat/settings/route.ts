import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_CHAT_SETTINGS } from '@/lib/chat-defaults'
import type { ChatSettings } from '@/lib/types'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'chat_settings')
    .single()

  const settings: ChatSettings = data?.value
    ? { ...DEFAULT_CHAT_SETTINGS, ...(data.value as Partial<ChatSettings>) }
    : { ...DEFAULT_CHAT_SETTINGS }

  // Never expose the real API key to the browser
  return NextResponse.json({
    ...settings,
    api_key: settings.api_key ? '••••••••' : '',
  })
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body: Partial<ChatSettings> = await req.json()

  // If the key is still the placeholder mask, preserve the existing stored key
  let api_key = body.api_key ?? ''
  if (api_key === '••••••••') {
    const { data: existing } = await supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'chat_settings')
      .single()
    api_key = ((existing?.value as Partial<ChatSettings>)?.api_key) ?? ''
  }

  const value: ChatSettings = {
    enabled: body.enabled ?? true,
    api_key,
    system_prompt: body.system_prompt ?? DEFAULT_CHAT_SETTINGS.system_prompt,
    whatsapp_number: body.whatsapp_number ?? '',
  }

  const { error } = await supabase.from('global_settings').upsert(
    { key: 'chat_settings', value, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
