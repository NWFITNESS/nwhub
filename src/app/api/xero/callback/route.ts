import { xero } from '@/lib/xero'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.toString()
  await xero.apiCallback(url)
  await xero.updateTenants()

  const tokenSet = await xero.readTokenSet()
  const tenantId = xero.tenants[0].tenantId

  const supabase = await createClient()
  await supabase.from('settings').upsert({ key: 'xero_tokens', value: JSON.stringify(tokenSet) })
  await supabase.from('settings').upsert({ key: 'xero_tenant_id', value: tenantId })

  return NextResponse.redirect(new URL('/financials', req.url))
}
