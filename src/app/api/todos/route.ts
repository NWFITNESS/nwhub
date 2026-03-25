import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)

  let query = supabase.from('todos').select('*')

  const completed = searchParams.get('completed')
  if (completed !== null) {
    query = query.eq('completed', completed === 'true')
  }

  const priority = searchParams.get('priority')
  if (priority) {
    query = query.eq('priority', priority)
  }

  // Sort: overdue first, then by due_date asc, then priority weight
  query = query.order('due_date', { ascending: true, nullsFirst: false })
  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { title, notes, priority, due_date, source, email_gmail_id, email_subject, email_from, tags } = body

  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({
      title,
      notes: notes ?? null,
      priority: priority ?? 'medium',
      due_date: due_date ?? null,
      source: source ?? 'manual',
      email_gmail_id: email_gmail_id ?? null,
      email_subject: email_subject ?? null,
      email_from: email_from ?? null,
      tags: tags ?? [],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
