export type EventType = 'gmail' | 'enquiry' | 'renewal' | 'class'

export interface CalendarEvent {
  id: string
  date: string       // ISO date e.g. "2026-03-14"
  type: EventType
  label: string
  meta?: string
}

export interface Trial {
  id: string
  member_name: string
  start_date: string  // ISO date
  end_date: string    // ISO date — startDate + 13 days
  source: 'wodboard'
  color_variant?: 0 | 1 | 2
}
