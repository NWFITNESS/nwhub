import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSocialConnections } from '@/lib/social/connections'
import { requireAuth } from '@/lib/auth-guard'

export interface SystemStatus {
  gmail:     { connected: boolean; email?: string }
  outlook:   { connected: boolean; email?: string }
  xero:      { connected: boolean }
  mailchimp: { connected: boolean }
  stripe:    { connected: boolean }
  facebook:  { connected: boolean; name?: string }
  instagram: { connected: boolean; name?: string }
  linkedin:  { connected: boolean; name?: string }
}

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  const [
    { data: gmailRow },
    { data: outlookRow },
    { data: xeroTokensRow },
    { data: xeroTenantRow },
    { data: mailchimpRow },
    social,
  ] = await Promise.all([
    supabase.from('global_settings').select('value').eq('key', 'gmail_tokens').single(),
    supabase.from('global_settings').select('value').eq('key', 'outlook_tokens').single(),
    supabase.from('global_settings').select('value').eq('key', 'xero_tokens').single(),
    supabase.from('global_settings').select('value').eq('key', 'xero_tenant_id').single(),
    supabase.from('global_settings').select('value').eq('key', 'mailchimp_settings').single(),
    getSocialConnections(),
  ])

  const gmailTokens = gmailRow?.value as Record<string, string> | null
  const outlookTokens = outlookRow?.value as Record<string, string> | null
  const mailchimpSettings = mailchimpRow?.value as Record<string, string> | null
  const mailchimpKey = process.env.MAILCHIMP_API_KEY || mailchimpSettings?.api_key || ''

  const status: SystemStatus = {
    gmail: {
      connected: !!(gmailTokens?.access_token && gmailTokens?.refresh_token),
      email: gmailTokens?.email || undefined,
    },
    outlook: {
      connected: !!(outlookTokens?.access_token && outlookTokens?.refresh_token),
      email: outlookTokens?.email || undefined,
    },
    xero: {
      connected: !!(xeroTokensRow?.value && xeroTenantRow?.value),
    },
    mailchimp: {
      connected: !!mailchimpKey,
    },
    stripe: {
      connected: !!process.env.STRIPE_SECRET_KEY,
    },
    facebook: {
      connected: social.facebook.connected,
      name: social.facebook.connected ? social.facebook.page_name : undefined,
    },
    instagram: {
      connected: social.instagram.connected,
      name: social.instagram.connected ? social.instagram.username : undefined,
    },
    linkedin: {
      connected: social.linkedin.connected,
      name: social.linkedin.connected ? social.linkedin.organization_name : undefined,
    },
  }

  return NextResponse.json(status)
}
