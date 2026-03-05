import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function normaliseUKPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('447') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('07') && digits.length === 11) return `+44${digits.slice(1)}`
  if (digits.startsWith('44') && digits.length === 12) return `+${digits}`
  return null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()

  const phone = body.phone ? normaliseUKPhone(body.phone) : null
  if (body.phone && !phone) {
    return NextResponse.json({ error: 'Invalid UK phone number' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if ('first_name' in body) updates.first_name = body.first_name
  if ('last_name' in body) updates.last_name = body.last_name
  if ('email' in body) updates.email = body.email ?? null
  if ('phone' in body) updates.phone = phone
  if ('groups' in body) updates.groups = body.groups
  if ('notes' in body) updates.notes = body.notes ?? null
  if ('status' in body) updates.status = body.status

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync to sms_subscribers if phone present
  if (phone) {
    await supabase.from('sms_subscribers').upsert(
      {
        phone,
        first_name: updates.first_name ?? data.first_name,
        tags: updates.groups ?? data.groups,
        status: 'subscribed',
      },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
