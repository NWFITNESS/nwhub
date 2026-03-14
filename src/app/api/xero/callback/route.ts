import { xero } from '@/lib/xero'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.toString()
    await xero.apiCallback(url)

    const tokenSet = await xero.readTokenSet()

    await xero.updateTenants()
    const tenantId = xero.tenants?.[0]?.tenantId ?? ''

    const supabase = await createClient()

    await supabase.from('global_settings').upsert(
      { key: 'xero_tokens', value: JSON.stringify(tokenSet), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

    await supabase.from('global_settings').upsert(
      { key: 'xero_tenant_id', value: tenantId, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

    return NextResponse.redirect(new URL('/financials', req.url))
  } catch (err) {
    console.error('Xero callback error:', err)
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.redirect(new URL(`/financials?xero_error=${encodeURIComponent(msg)}`, req.url))
  }
}
