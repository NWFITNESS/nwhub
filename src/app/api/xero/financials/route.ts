import { xero } from '@/lib/xero'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: tokenData } = await supabase
    .from('global_settings').select('value').eq('key', 'xero_tokens').single()
  const { data: tenantData } = await supabase
    .from('global_settings').select('value').eq('key', 'xero_tenant_id').single()

  if (!tokenData || !tenantData) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  await xero.setTokenSet(JSON.parse(tokenData.value))
  const tenantId = tenantData.value

  const tokenSet = xero.readTokenSet()
  if (tokenSet.expired()) {
    const newTokenSet = await xero.refreshToken()
    await supabase.from('global_settings').upsert({
      key: 'xero_tokens',
      value: JSON.stringify(newTokenSet),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
  }

  const [invoices, payments, contacts, profitLoss] = await Promise.all([
    xero.accountingApi.getInvoices(
      tenantId, undefined, undefined, undefined, undefined, undefined, undefined,
      ['AUTHORISED', 'PAID'], undefined, undefined, undefined, undefined, undefined, 100
    ),
    xero.accountingApi.getPayments(tenantId),
    xero.accountingApi.getContacts(tenantId),
    xero.accountingApi.getReportProfitAndLoss(tenantId),
  ])

  return NextResponse.json({
    invoices: invoices.body.invoices,
    payments: payments.body.payments,
    contacts: contacts.body.contacts,
    profitLoss: profitLoss.body,
  })
}
