import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mc, resolveApiKey } from '@/lib/mailchimp'
import type { MailchimpAudience, MailchimpSettings } from '@/lib/types'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const key = resolveApiKey((data?.value as Partial<MailchimpSettings>)?.api_key)
  if (!key) return NextResponse.json({ error: 'API key not configured' }, { status: 400 })

  const res = await mc(key, '/lists?count=50&fields=lists.id,lists.name,lists.stats.member_count')
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err.detail ?? 'Mailchimp request failed' }, { status: res.status })
  }

  const json = await res.json()
  const audiences: MailchimpAudience[] = (json.lists ?? []).map((l: { id: string; name: string; stats?: { member_count?: number } }) => ({
    id: l.id,
    name: l.name,
    member_count: l.stats?.member_count ?? 0,
  }))

  return NextResponse.json(audiences)
}
