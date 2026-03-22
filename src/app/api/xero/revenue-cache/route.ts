import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'xero_revenue_cache')
    .single()

  return NextResponse.json({ revenue: parseInt(data?.value ?? '0') || 0 })
}
