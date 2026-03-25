import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = createAdminClient()
  const { searchParams } = new URL(req.url)
  const completed = searchParams.get('completed')

  let query = supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (completed === 'false') query = query.eq('completed', false)
  if (completed === 'true') query = query.eq('completed', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const body = await req.json()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: body.title,
      notes: body.notes ?? null,
      due_date: body.due_date ?? null,
      priority: body.priority ?? 'medium',
      source: body.source ?? 'manual',
      email_id: body.email_id ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
