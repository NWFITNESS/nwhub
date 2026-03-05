import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function normaliseUKPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('447') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('07') && digits.length === 11) return `+44${digits.slice(1)}`
  if (digits.startsWith('44') && digits.length === 12) return `+${digits}`
  return null
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()

  const phone = body.phone ? normaliseUKPhone(body.phone) : null
  if (body.phone && !phone) {
    return NextResponse.json({ error: 'Invalid UK phone number' }, { status: 400 })
  }

  const row = {
    first_name: body.first_name ?? '',
    last_name: body.last_name ?? '',
    email: body.email ?? null,
    phone,
    groups: body.groups ?? [],
    notes: body.notes ?? null,
    status: body.status ?? 'active',
    source: body.source ?? 'manual',
  }

  const { data, error } = await supabase.from('contacts').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync to sms_subscribers if phone present
  if (phone) {
    await supabase.from('sms_subscribers').upsert(
      { phone, first_name: row.first_name, tags: row.groups, status: 'subscribed' },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
