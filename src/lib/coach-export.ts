import type { RotaSession, RotaClassType } from '@/lib/rota'

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

// 'YYYY-MM-DD' + 'HH:MM:SS' -> '20261118T161500' (floating local time, which
// calendars interpret in the device's own timezone — fine for a UK-only gym).
function icsDateTime(dateISO: string, time: string): string {
  return dateISO.replace(/-/g, '') + 'T' + time.replace(/:/g, '').padEnd(6, '0').slice(0, 6)
}

/** Build an iCalendar (.ics) feed from a coach's sessions. */
export function buildICS(sessions: RotaSession[], classMap: Map<string, RotaClassType>, stamp: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Northern Warrior//Coach Rota//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]
  for (const s of sessions) {
    const name = (s.class_type_id && classMap.get(s.class_type_id)?.name) || 'Coaching'
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${s.id}@northernwarrior`)
    lines.push(`DTSTAMP:${stamp}`)
    lines.push(`DTSTART:${icsDateTime(s.date, s.start_time)}`)
    lines.push(`DTEND:${icsDateTime(s.date, s.end_time)}`)
    lines.push(`SUMMARY:${icsEscape(`${name} — coaching`)}`)
    if (s.notes) lines.push(`DESCRIPTION:${icsEscape(s.notes)}`)
    lines.push('LOCATION:Northern Warrior')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

/** Trigger a client-side download of a text blob. */
export function downloadText(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
