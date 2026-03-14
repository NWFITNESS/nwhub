import { xero } from '@/lib/xero'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.toString()
    await xero.apiCallback(url)

    const tokenSet = await xero.readTokenSet()

    // updateTenants requires accounting scope — skip if not available
    let tenantId = ''
    try {
      await xero.updateTenants()
      tenantId = xero.tenants?.[0]?.tenantId ?? ''
    } catch {
      // No accounting scope yet — tenantId will be set after scopes are added
    }

    const supabase = await createClient()
    await supabase.from('global_settings').upsert(
      { key: 'xero_tokens', value: JSON.stringify(tokenSet), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    if (tenantId) {
      await supabase.from('global_settings').upsert(
        { key: 'xero_tenant_id', value: tenantId, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    }

    return NextResponse.redirect(new URL('/financials', req.url))
  } catch (err) {
    console.error('Xero callback error:', err)
    return NextResponse.redirect(new URL('/financials?xero_error=callback_failed', req.url))
  }
}
