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
  // Xero returns expires_in (seconds); compute expires_at for consistency
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

    // Set token on SDK client (same pattern as the working dashboard page)
    await xero.setTokenSet(tokenSet)

    // Get tenantId
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

    // P&L is a separate scope — try it but don't fail if unavailable
    let profitLoss = null
    try {
      const pl = await xero.accountingApi.getReportProfitAndLoss(tenantId)
      profitLoss = pl.body
    } catch {
      // scope may not be granted
    }

    const invList = invoices.body.invoices ?? []
    const pymList = payments.body.payments ?? []

    return NextResponse.json({
      invoices: invList,
      payments: pymList,
      contacts: contacts.body.contacts,
      profitLoss,
      _debug: {
        invoiceCount: invList.length,
        paymentCount: pymList.length,
        invoicesBodyKeys: Object.keys(invoices.body ?? {}),
        paymentsBodyKeys: Object.keys(payments.body ?? {}),
        invoicesHttpStatus: invoices.response?.statusCode,
        paymentsHttpStatus: payments.response?.statusCode,
        accessTokenPrefix: tokenSet.access_token
          ? (tokenSet.access_token as string).slice(0, 12) + '...'
          : 'MISSING',
        tenantId,
        firstInvoice: invList[0]
          ? { status: invList[0].status, date: invList[0].date, total: invList[0].total }
          : null,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[xero/financials]', message)
    return NextResponse.json({ error: 'xero_error', message }, { status: 502 })
  }
}
