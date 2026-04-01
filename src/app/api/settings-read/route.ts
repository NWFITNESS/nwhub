import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  const supabase = createAdminClient()
  const { data } = await supabase.from('global_settings').select('value').eq('key', key).single()

  return NextResponse.json({ value: data?.value ?? null })
}
