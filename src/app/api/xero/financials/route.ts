import { xero } from '@/lib/xero'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Refresh a Xero token directly via HTTP — no SDK openIdClient needed
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

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: tokenData } = await supabase
      .from('global_settings').select('value').eq('key', 'xero_tokens').single()

    if (!tokenData?.value) {
      return NextResponse.json({ error: 'not_connected' }, { status: 401 })
    }

    let tokenSet = JSON.parse(tokenData.value)

    // Refresh if expired (expires_at is Unix seconds)
    const expiresAt: number = tokenSet.expires_at ?? 0
    if (expiresAt < Math.floor(Date.now() / 1000) + 60) {
      if (!tokenSet.refresh_token) {
        return NextResponse.json({ error: 'not_connected' }, { status: 401 })
      }
      tokenSet = await refreshXeroToken(tokenSet.refresh_token)
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
      return NextResponse.json({ error: 'no_tenant' }, { status: 401 })
    }

    const [invoices, payments, contacts] = await Promise.all([
      xero.accountingApi.getInvoices(
        tenantId, undefined, undefined, undefined, undefined, undefined, undefined,
        ['AUTHORISED', 'PAID'], undefined, undefined, undefined, undefined, undefined, 100
      ),
      xero.accountingApi.getPayments(tenantId),
      xero.accountingApi.getContacts(tenantId),
    ])

    let profitLoss = null
    try {
      const pl = await xero.accountingApi.getReportProfitAndLoss(tenantId)
      profitLoss = pl.body
    } catch {
      // scope may not be granted
    }

    return NextResponse.json({
      invoices: invoices.body.invoices ?? [],
      payments: payments.body.payments ?? [],
      contacts: contacts.body.contacts ?? [],
      profitLoss,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/financials]', message)
    return NextResponse.json({ error: 'xero_error', message }, { status: 502 })
  }
}
