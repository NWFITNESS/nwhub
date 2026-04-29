import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

interface EmailTemplate {
  id: string
  name: string
  design_json: object
  created_at: string
}

async function getTemplates(): Promise<EmailTemplate[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('global_settings')
    .select('value')
    .eq('key', 'mailchimp_templates')
    .single()
  return (data?.value ?? []) as EmailTemplate[]
}

export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const templates = await getTemplates()
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const { name, design_json } = await req.json()
  if (!name || !design_json) {
    return NextResponse.json({ error: 'name and design_json required' }, { status: 400 })
  }
  const supabase = createAdminClient()
  const templates = await getTemplates()
  const newTemplate: EmailTemplate = {
    id: crypto.randomUUID(),
    name,
    design_json,
    created_at: new Date().toISOString(),
  }
  await supabase.from('global_settings').upsert(
    { key: 'mailchimp_templates', value: [...templates, newTemplate], updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return NextResponse.json(newTemplate)
}

export async function DELETE(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = createAdminClient()
  const templates = await getTemplates()
  const filtered = templates.filter((t) => t.id !== id)
  await supabase.from('global_settings').upsert(
    { key: 'mailchimp_templates', value: filtered, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )
  return NextResponse.json({ ok: true })
}
