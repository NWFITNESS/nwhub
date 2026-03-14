import { xero } from '@/lib/xero'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: tokenData } = await supabase
    .from('global_settings').select('value').eq('key', 'xero_tokens').single()

  if (!tokenData?.value) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  await xero.setTokenSet(JSON.parse(tokenData.value))

  // Refresh token if expired
  const tokenSet = xero.readTokenSet()
  if (tokenSet.expired()) {
    const newTokenSet = await xero.refreshToken()
    await supabase.from('global_settings').upsert(
      { key: 'xero_tokens', value: JSON.stringify(newTokenSet), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  }

  // Get tenantId — from DB or discover via updateTenants
  let tenantId = ''
  const { data: tenantData } = await supabase
    .from('global_settings').select('value').eq('key', 'xero_tenant_id').single()

  if (tenantData?.value) {
    tenantId = tenantData.value
  } else {
    // Discover tenants and cache
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

  return NextResponse.json({
    invoices: invoices.body.invoices,
    payments: payments.body.payments,
    contacts: contacts.body.contacts,
    profitLoss,
  })
}
