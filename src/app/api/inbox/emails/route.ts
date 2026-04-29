import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const flagged = searchParams.get('flagged')
  const archived = searchParams.get('archived') // defaults to 'false'

  let query = supabase
    .from('email_classifications')
    .select('*, tasks(id, title, due_date, completed)')
    .order('received_at', { ascending: false })
    .limit(200)

  if (category) query = query.eq('category', category)
  if (flagged === 'true') query = query.eq('flagged', true)
  if (archived !== 'true') query = query.eq('archived', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
