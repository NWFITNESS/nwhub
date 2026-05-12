import { xero } from '@/lib/xero/client'
import { createAdminClient } from '@/lib/supabase/admin'

async function refreshXeroToken(refreshToken: string) {
  const credentials = Buffer.from(
    `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Xero token refresh failed (${res.status}): ${text}`)
  }

  const newToken = await res.json()
  newToken.expires_at = Math.floor(Date.now() / 1000) + (newToken.expires_in ?? 1800)
  return newToken
}

export type XeroAuthResult =
  | { ok: true; tenantId: string }
  | { ok: false; error: string; status: number }

/**
 * Load Xero tokens, refresh if needed, resolve tenant ID.
 * Returns the tenantId on success or an error payload to return as a Response.
 * After success, `xero` is ready to use via the module-level singleton.
 */
export async function getXeroAuth(): Promise<XeroAuthResult> {
  const supabase = createAdminClient()

  const { data: tokenData } = await supabase
    .from('global_settings').select('value').eq('key', 'xero_tokens').single()

  if (!tokenData?.value) {
    return { ok: false, error: 'not_connected', status: 401 }
  }

  let tokenSet = JSON.parse(tokenData.value)

  const expiresAt: number = tokenSet.expires_at ?? 0
  if (expiresAt < Math.floor(Date.now() / 1000) + 60) {
    if (!tokenSet.refresh_token) {
      return { ok: false, error: 'not_connected', status: 401 }
    }
    try {
      tokenSet = await refreshXeroToken(tokenSet.refresh_token)
    } catch (refreshErr: unknown) {
      const msg = refreshErr instanceof Error ? refreshErr.message : String(refreshErr)
      if (msg.includes('invalid_grant') || msg.includes('400')) {
        await supabase.from('global_settings')
          .delete().in('key', ['xero_tokens', 'xero_tenant_id'])
      }
      return { ok: false, error: 'not_connected', status: 401 }
    }
    await supabase.from('global_settings').upsert(
      { key: 'xero_tokens', value: JSON.stringify(tokenSet), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  }

  await xero.setTokenSet(tokenSet)

  let tenantId = ''
  const { data: tenantData } = await supabase
    .from('global_settings').select('value').eq('key', 'xero_tenant_id').single()

  if (tenantData?.value) {
    tenantId = tenantData.value
  } else {
    await xero.updateTenants()
    tenantId = xero.tenants?.[0]?.tenantId ?? ''
    if (tenantId) {
      await supabase.from('global_settings').upsert(
        { key: 'xero_tenant_id', value: tenantId, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    }
  }

  if (!tenantId) {
    return { ok: false, error: 'no_tenant', status: 401 }
  }

  return { ok: true, tenantId }
}
