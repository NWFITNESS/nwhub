import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: enquiry }, { data: replies }] = await Promise.all([
    supabase.from('contact_enquiries').select('*').eq('id', id).single(),
    supabase.from('enquiry_replies').select('*').eq('enquiry_id', id).order('created_at', { ascending: true }),
  ])

  if (!enquiry) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ enquiry, replies: replies ?? [] })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { id } = await params
  const { status } = await req.json()

  if (!['new', 'read', 'replied'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createAdminClient()
  await supabase.from('contact_enquiries').update({ status }).eq('id', id)

  return NextResponse.json({ ok: true })
}
