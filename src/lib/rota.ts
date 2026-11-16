// ── Coach Rota — shared types + helpers ──────────────────────────────────────
// day_of_week convention: 0 = Monday … 6 = Sunday (matches a Mon-first grid)

export interface RotaClassType {
  id: string
  name: string
  color: string
  sort_order: number
  archived: boolean
  created_by: string | null
  created_at: string
}

export interface RotaCoach {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  hourly_rate: number
  color: string | null
  active: boolean
  created_at: string
}

export interface RotaTemplateSlot {
  id: string
  day_of_week: number
  start_time: string          // 'HH:MM:SS'
  end_time: string
  class_type_id: string | null
  notes: string | null
  active: boolean
  sort_order: number
}

export interface RotaSession {
  id: string
  date: string                // 'YYYY-MM-DD'
  start_time: string          // 'HH:MM:SS'
  end_time: string
  class_type_id: string | null
  coach_id: string | null     // null = needs filled
  status: 'active' | 'cancelled'
  locked: boolean
  notes: string | null
  source: 'manual' | 'template'
  template_slot_id: string | null
  claimed_at: string | null
  created_at: string
  updated_at: string
}

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const DAY_LABELS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

// ── Date helpers (local, string-based to dodge timezone drift) ───────────────

/** 'YYYY-MM-DD' for a Date, using its local components. */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse 'YYYY-MM-DD' into a local Date at midnight. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** The Monday (ISO date) of the week containing `iso` (or today). */
export function mondayOf(iso?: string): string {
  const d = iso ? fromISODate(iso) : new Date()
  const dow = d.getDay()            // 0=Sun … 6=Sat
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return toISODate(d)
}

/** The 7 ISO dates Mon→Sun for a week starting at `mondayISO`. */
export function weekDates(mondayISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayISO, i))
}

/** 0=Mon … 6=Sun for an ISO date. */
export function dayOfWeekIndex(iso: string): number {
  const dow = fromISODate(iso).getDay()
  return dow === 0 ? 6 : dow - 1
}

// ── Time helpers ─────────────────────────────────────────────────────────────

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Hours between two 'HH:MM[:SS]' times (end − start), floored at 0. */
export function sessionHours(start: string, end: string): number {
  const mins = timeToMinutes(end) - timeToMinutes(start)
  return mins > 0 ? mins / 60 : 0
}

/** '06:00:00' → '6:00am'. */
export function formatTime(t: string): string {
  if (!t) return ''
  const [hStr, mStr] = t.split(':')
  let h = Number(hStr)
  const m = Number(mStr)
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12
  if (h === 0) h = 12
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, '0')}${ampm}`
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

export function formatHours(h: number): string {
  // 1.5 → '1.5', 2 → '2'
  return Number.isInteger(h) ? String(h) : h.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function formatMoney(n: number): string {
  return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Colour helpers ───────────────────────────────────────────────────────────

/** Expand #abc / normalise #aabbcc → [r,g,b]. */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h || '3b82f6', 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Readable text colour (#fff or near-black) for a given background hex. */
export function contrastText(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#10151f' : '#ffffff'
}

/** A sensible default colour palette offered when creating a class type. */
export const CLASS_COLOUR_PRESETS = [
  '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ec4899',
  '#14b8a6', '#ef4444', '#6366f1', '#eab308', '#64748b',
  '#06b6d4', '#f97316',
]
