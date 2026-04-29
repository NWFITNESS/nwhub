import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)

  let query = supabase.from('email_triage').select('*')

  const category = searchParams.get('category')
  if (category) {
    query = query.eq('category', category)
  }

  const flagged = searchParams.get('flagged')
  if (flagged !== null) {
    query = query.eq('is_flagged', flagged === 'true')
  }

  query = query.order('received_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
