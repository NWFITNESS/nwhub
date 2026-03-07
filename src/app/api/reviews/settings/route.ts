import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ReviewSettings } from '@/lib/types'

const DEFAULTS: ReviewSettings = {
  enabled: false,
  channel: 'whatsapp',
  google_place_id: '',
  review_link: '',
  first_content_sid: '',
  reminder_content_sid: '',
  days_after_joining: 7,
  reminder_interval_days: 7,
  max_messages: 2,
  last_known_review_count: 0,
}

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'review_settings')
    .single()

  const settings: ReviewSettings = data?.value
    ? { ...DEFAULTS, ...(data.value as Partial<ReviewSettings>) }
    : DEFAULTS

  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body: Partial<ReviewSettings> = await req.json()

  const { error } = await supabase.from('global_settings').upsert(
    { key: 'review_settings', value: body, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
