import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'

// ---------------------------------------------------------------------------
// CSV Parser — handles quoted fields and common WodBoard column name variants
// ---------------------------------------------------------------------------
function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())

  return lines.slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      // Handle quoted fields that may contain commas
      const values: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes; continue }
        if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
        current += char
      }
      values.push(current.trim())

      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] ?? '' })
      return row
    })
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key]) return row[key]
  }
  return ''
}

interface MemberRow {
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  membershipType: string
  startDate: string
  lastAttended: string
  dateOfBirth: string
}

function extractMember(row: Record<string, string>): MemberRow {
  return {
    firstName:    pick(row, 'first name', 'firstname', 'first_name', 'forename', 'given name'),
    lastName:     pick(row, 'last name',  'lastname',  'last_name',  'surname',  'family name'),
    email:        pick(row, 'email', 'email address', 'e-mail'),
    phone:        pick(row, 'phone', 'mobile', 'telephone', 'phone number', 'mobile number'),
    status:       pick(row, 'status', 'membership status', 'member status'),
    membershipType: pick(row, 'membership type', 'membership', 'plan', 'product'),
    startDate:    pick(row, 'start date', 'start_date', 'joined', 'join date', 'member since'),
    lastAttended: pick(row, 'last attended', 'last_attended', 'last visit', 'last class'),
    dateOfBirth:  pick(row, 'date of birth', 'dob', 'birthday', 'birth date'),
  }
}

function mapStatus(status: string, membershipType: string): string {
  const s = status?.toLowerCase() ?? ''
  const t = membershipType?.toLowerCase() ?? ''
  if (s.includes('cancel') || s.includes('terminat') || s.includes('inactive') || s.includes('lapsed')) return 'cancelled'
  if (s.includes('trial') || t.includes('trial')) return 'trial'
  if (s.includes('active') || s.includes('member') || s.includes('paid')) return 'member'
  if (s.includes('enquir') || s.includes('lead') || s.includes('prospect')) return 'inactive'
  return 'inactive'
}

function mapProgramme(membershipType: string): string {
  const t = membershipType?.toLowerCase() ?? ''
  if (t.includes('kid') || t.includes('junior') || t.includes('youth')) return 'kids'
  if (t.includes('hyrox')) return 'hyrox'
  if (t.includes('personal') || t.includes(' pt')) return 'personal_training'
  return 'adult'
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function datePlusDays(dateStr: string, days: number): string | null {
  const d = parseDate(dateStr)
  if (!d) return null
  const date = new Date(d)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  // Parse multipart form data
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const csvText = await file.text()
  const rows = parseCSV(csvText)
  const members = rows.map(extractMember).filter((m) => m.email)

  if (members.length === 0) {
    return NextResponse.json(
      { error: 'No valid members found in CSV — check the file has an email column' },
      { status: 400 }
    )
  }

  // Load all existing contacts (not just wodboard — email is unique across all)
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('id, email, status, last_attendance, source')

  const existingByEmail = new Map(
    (existingContacts ?? []).map((c) => [c.email?.toLowerCase(), c])
  )

  const results = { created: 0, updated: 0, cancelled: 0, errors: 0, log: [] as string[] }

  for (const member of members) {
    try {
      const email = member.email.toLowerCase()
      const existing = existingByEmail.get(email)
      const status = mapStatus(member.status, member.membershipType)
      const programme = mapProgramme(member.membershipType)

      if (!existing) {
        // New contact
        await supabase.from('contacts').insert({
          first_name:        member.firstName || 'Unknown',
          last_name:         member.lastName  || '',
          email:             member.email,
          phone:             member.phone     || null,
          status,
          source:            'wodboard',
          programme,
          member_since:      status === 'member' ? parseDate(member.startDate) : null,
          trial_start_date:  status === 'trial'  ? parseDate(member.startDate) : null,
          trial_end_date:    status === 'trial'  ? datePlusDays(member.startDate, 14) : null,
          last_attendance:   parseDate(member.lastAttended),
          groups:            [],
        })
        results.created++
        results.log.push(`Created: ${member.firstName} ${member.lastName} (${email}) — ${status}`)

      } else {
        // Existing contact — update changed fields only
        const updates: Record<string, unknown> = {}

        if (existing.status !== status) {
          updates.status = status

          if (status === 'member' && (existing.status === 'trial' || existing.status === 'inactive')) {
            updates.member_since = parseDate(member.startDate)
            results.log.push(`Converted → member: ${member.firstName} ${member.lastName}`)
          }

          if (status === 'cancelled' && existing.status !== 'cancelled') {
            results.cancelled++
            results.log.push(`Cancelled: ${member.firstName} ${member.lastName}`)
          }
        }

        const newAttendance = parseDate(member.lastAttended)
        if (newAttendance && newAttendance !== existing.last_attendance) {
          updates.last_attendance = newAttendance
        }

        // Always refresh programme
        if (programme) updates.programme = programme

        // Backfill source if it was imported from somewhere else
        if (existing.source !== 'wodboard') updates.source = 'wodboard'

        if (Object.keys(updates).length > 0) {
          await supabase.from('contacts').update(updates).eq('id', existing.id)
          results.updated++
          if (!results.log.some((l) => l.includes(email))) {
            results.log.push(`Updated: ${member.firstName} ${member.lastName}`)
          }
        }
      }
    } catch (err) {
      results.errors++
      results.log.push(`Error: ${member.email} — ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Write to sync_log
  try {
    await supabase.from('sync_log').insert({
      source:    'wodboard',
      synced_at: new Date().toISOString(),
      created:   results.created,
      updated:   results.updated,
      cancelled: results.cancelled,
      errors:    results.errors,
      log:       results.log,
    })
  } catch {
    // Don't fail the whole import if sync_log write fails
  }

  return NextResponse.json(results)
}
