import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { findXeroCandidates } from '@/lib/xero/matcher'

// GET — find Xero candidates for manual matching
// ?vault_id=xxx
export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const vaultId = req.nextUrl.searchParams.get('vault_id')
  if (!vaultId) return NextResponse.json({ error: 'vault_id required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: item } = await supabase
    .from('invoice_vault')
    .select('*')
    .eq('id', vaultId)
    .single()

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const candidates = await findXeroCandidates({
    supplier: item.supplier ?? '',
    amount_total: item.amount ?? 0,
    invoice_date: item.invoice_date ?? new Date().toISOString().split('T')[0],
    invoice_number: item.invoice_number,
  })

  return NextResponse.json(candidates)
}

// POST — confirm a manual match
// Body: { vault_id, xero_invoice_id }
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { vault_id, xero_invoice_id } = await req.json()
  if (!vault_id || !xero_invoice_id) {
    return NextResponse.json({ error: 'vault_id and xero_invoice_id required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('invoice_vault')
    .update({
      xero_match_status: 'matched',
      xero_invoice_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vault_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
