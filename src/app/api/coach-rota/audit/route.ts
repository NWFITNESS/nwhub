import { NextResponse } from 'next/server'
import { requireRotaAdmin } from '@/lib/rota-server'

// GET /api/coach-rota/audit — recent rota change history (admin only).
export async function GET() {
  const guard = await requireRotaAdmin()
  if (!guard.ok) return guard.res
  const { admin } = guard

  const { data, error } = await admin.from('rota_audit')
    .select('*').order('created_at', { ascending: false }).limit(150)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data })
}
