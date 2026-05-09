import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// GET — fetch all invoice_vault rows
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('invoice_vault')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unmatchedCount = (data ?? []).filter(r => r.source === 'email' && r.xero_match_status === 'unmatched').length

  return NextResponse.json({ items: data ?? [], unmatched_count: unmatchedCount })
}
