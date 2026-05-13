import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const { searchParams } = new URL(req.url)
  const project = searchParams.get('project')
  const level = searchParams.get('level')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const limit = parseInt(searchParams.get('limit') ?? '100', 10)

  const supabase = createAdminClient()
  let query = supabase
    .from('changelog_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (project && project !== 'all') query = query.eq('project', project)
  if (level && level !== 'all') query = query.eq('level', level)
  if (category && category !== 'all') query = query.eq('category', category)
  if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const body = await req.json()
  const { project, title, description, reason, category, level, files_changed, commit_hash } = body

  if (!project || !title) {
    return NextResponse.json({ error: 'project and title are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('changelog_entries')
    .insert({
      project,
      title,
      description: description || null,
      reason: reason || null,
      category: category || 'feature',
      level: level || 'info',
      files_changed: files_changed || 0,
      commit_hash: commit_hash || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
