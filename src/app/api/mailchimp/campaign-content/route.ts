import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mc, resolveApiKey } from '@/lib/mailchimp'
import { requireAuth } from '@/lib/auth-guard'
import type { MailchimpSettings } from '@/lib/types'

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('id')
  if (!campaignId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: settingsData } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_settings')
    .single()

  const settings = (settingsData?.value ?? {}) as Partial<MailchimpSettings>
  const apiKey = resolveApiKey(settings.api_key)
  if (!apiKey) return NextResponse.json({ error: 'Mailchimp not configured' }, { status: 400 })

  const res = await mc(apiKey, `/campaigns/${campaignId}/content`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: err.detail ?? 'Failed to fetch content' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ html: data.html ?? '' })
}
