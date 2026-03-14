import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function POST(request: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  try {
    const { key, value } = await request.json()
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('global_settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
