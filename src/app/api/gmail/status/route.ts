import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'gmail_tokens')
    .single()

  if (!data?.value) {
    return NextResponse.json({ connected: false, email: null })
  }

  try {
    const tokens = JSON.parse(data.value)
    const connected = !!(tokens.access_token && tokens.refresh_token)
    return NextResponse.json({ connected, email: tokens.email ?? null })
  } catch {
    return NextResponse.json({ connected: false, email: null })
  }
}
