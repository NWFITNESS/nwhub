import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function normaliseUKPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('447') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('07') && digits.length === 11) return `+44${digits.slice(1)}`
  if (digits.startsWith('44') && digits.length === 12) return `+${digits}`
  return null
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim()); current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

type InputRow = {
  first_name?: string
  last_name?: string
  email?: string | null
  phone?: string | null
  groups?: string[]
  notes?: string | null
}

function buildRows(input: InputRow[]) {
  const rows: Record<string, unknown>[] = []
  const errors: { row: number; reason: string }[] = []

  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    const rowNum = i + 2

    const first_name = c.first_name?.trim() ?? ''
    const last_name  = c.last_name?.trim()  ?? ''
    const email      = c.email?.trim()      || null
    const rawPhone   = c.phone?.trim()      ?? ''
    const groups     = c.groups ?? []
    const notes      = c.notes?.trim()      || null

    if (!first_name && !email && !rawPhone) {
      errors.push({ row: rowNum, reason: 'Row has no name, email, or phone — skipped' })
      continue
    }

    const phone = rawPhone ? normaliseUKPhone(rawPhone) : null
    if (rawPhone && !phone) {
      errors.push({ row: rowNum, reason: `Invalid UK phone "${rawPhone}"` })
      continue
    }

    rows.push({ first_name, last_name, email, phone, groups, notes, source: 'import', status: 'active' })
  }

  return { rows, errors }
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const contentType = req.headers.get('content-type') ?? ''

  let inputRows: InputRow[]
  const preErrors: { row: number; reason: string }[] = []

  if (contentType.includes('application/json')) {
    // Pre-mapped rows from the client-side column mapper
    const body = await req.json()
    inputRows = body.contacts ?? []
  } else {
    // FormData — template-format CSV (backwards compat)
    const fd   = await req.formData()
    const file = fd.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text    = await file.text()
    const lines   = text.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 })

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'))
    const missing = ['first_name', 'last_name', 'email'].filter((h) => !headers.includes(h))
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing columns: ${missing.join(', ')}` }, { status: 400 })
    }

    const idx = (col: string) => headers.indexOf(col)
    inputRows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i])
      const groupsRaw = idx('groups') >= 0 ? (cols[idx('groups')]?.trim() ?? '') : ''
      inputRows.push({
        first_name: cols[idx('first_name')]?.trim(),
        last_name:  cols[idx('last_name')]?.trim(),
        email:      cols[idx('email')]?.trim()   || null,
        phone:      idx('phone') >= 0 ? cols[idx('phone')]?.trim() || null : null,
        groups:     groupsRaw ? groupsRaw.split(';').map((g) => g.trim().toLowerCase()).filter(Boolean) : [],
        notes:      idx('notes') >= 0 ? cols[idx('notes')]?.trim() || null : null,
      })
    }
  }

  const { rows, errors } = buildRows(inputRows)
  errors.push(...preErrors)

  if (rows.length === 0) return NextResponse.json({ inserted: 0, errors })

  const { data, error } = await supabase.from('contacts').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync phone numbers to sms_subscribers
  const phoneRows = (data ?? [])
    .filter((c) => c.phone)
    .map((c) => ({ phone: c.phone, first_name: c.first_name, tags: c.groups, status: 'subscribed' }))

  if (phoneRows.length > 0) {
    await supabase.from('sms_subscribers').upsert(phoneRows, { onConflict: 'phone', ignoreDuplicates: false })
  }

  return NextResponse.json({ inserted: data?.length ?? 0, errors })
}
