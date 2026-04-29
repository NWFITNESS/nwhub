import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function POST(request: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  try {
    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await admin.from('email_campaigns').insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
