'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CalendarEvent, Trial } from './types'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { CalendarSidebar } from '@/components/calendar/CalendarSidebar'

export function CalendarClient() {
  const now = new Date()
  const [year, setYear]               = useState(now.getFullYear())
  const [month, setMonth]             = useState(now.getMonth())
  const [view, setView]               = useState<'month' | 'week' | 'agenda'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [events, setEvents]           = useState<CalendarEvent[]>([])
  const [gcalEvents, setGcalEvents]   = useState<CalendarEvent[]>([])
  const [trials, setTrials]           = useState<Trial[]>([])
  const [gcalConnected, setGcalConnected] = useState(false)

  const searchParams = useSearchParams()

  // ── Load Supabase events ──────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const firstDay = `${year}-${String(month + 1).padStart(2,'0')}-01`
    const lastDay  = new Date(year, month + 1, 0).toISOString().slice(0, 10)

    Promise.all([
      supabase.from('trials').select('*').lte('start_date', lastDay).gte('end_date', firstDay),
      supabase.from('calendar_events').select('*').gte('date', firstDay).lte('date', lastDay),
    ]).then(([{ data: t }, { data: e }]) => {
      setTrials((t ?? []) as Trial[])
      setEvents((e ?? []) as CalendarEvent[])
    })
  }, [year, month])

  // ── Load Google Calendar events ───────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/gcal/events?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(data => {
        setGcalConnected(data.connected ?? false)
        setGcalEvents((data.events ?? []) as CalendarEvent[])
      })
      .catch(() => {})
  }, [year, month])

  // ── All events merged ─────────────────────────────────────────────────────
  const allEvents: CalendarEvent[] = [...events, ...gcalEvents]

  // ── Navigation ────────────────────────────────────────────────────────────
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  // ── Create event ──────────────────────────────────────────────────────────
  async function handleCreateEvent(data: {
    date: string
    label: string
    type: string
    description?: string
    startTime?: string
    endTime?: string
  }) {
    const res = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return
    const { event } = await res.json()
    if (event) {
      // Optimistically add the new event
      setEvents(prev => [...prev, event as CalendarEvent])
    }
  }

  // ── Delete event ──────────────────────────────────────────────────────────
  async function handleDeleteEvent(id: string, gcalId?: string) {
    const params = new URLSearchParams()
    if (id.startsWith('gcal_')) {
      // Pure Google Calendar event — no Supabase row
      const rawId = gcalId ?? id.replace(/^gcal_/, '')
      params.set('gcalId', rawId)
    } else {
      params.set('id', id)
      if (gcalId) params.set('gcalId', gcalId)
    }

    await fetch(`/api/calendar/events?${params.toString()}`, { method: 'DELETE' })

    // Remove from local state
    if (id.startsWith('gcal_')) {
      setGcalEvents(prev => prev.filter(e => e.id !== id))
    } else {
      setEvents(prev => prev.filter(e => e.id !== id))
    }
  }

  // ── Connection banner (shown once after redirect) ─────────────────────────
  const justConnected = searchParams.get('connected') === 'gcal'

  return (
    <div style={{
      background: 'var(--slate-900)',
      border: '1px solid rgba(255,255,255,0.11)',
      borderRadius: 10,
      boxShadow: '0 4px 24px rgba(212,160,23,0.07), 0 1px 4px rgba(212,160,23,0.04)',
      display: 'flex', flexDirection: 'column',
      flex: 1, overflow: 'hidden', minHeight: 0,
    }}>
      {justConnected && (
        <div style={{
          padding: '8px 17px', background: 'rgba(74,222,128,0.08)', borderBottom: '1px solid rgba(74,222,128,0.2)',
          fontSize: 12, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
          Google Calendar connected — your events will appear here automatically.
        </div>
      )}

      <CalendarHeader
        year={year}
        month={month}
        view={view}
        onPrev={prevMonth}
        onNext={nextMonth}
        onViewChange={setView}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <CalendarGrid
          year={year}
          month={month}
          events={allEvents}
          trials={trials}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
        <CalendarSidebar
          events={allEvents}
          selectedDate={selectedDate}
          gcalConnected={gcalConnected}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 17px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'var(--slate-950)',
        fontSize: 10, color: 'var(--slate-500)',
        flexShrink: 0,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
        <span>Supabase</span>
        <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: gcalConnected ? '#22c55e' : '#f59e0b' }} />
        <span>Google Calendar {gcalConnected ? 'connected' : '— not connected'}</span>
        {!gcalConnected && (
          <>
            <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.07)' }} />
            <a
              href="/api/gcal/connect"
              style={{ fontSize: 10, color: '#6ba3f5', textDecoration: 'none', fontWeight: 600 }}
            >
              Connect Google Calendar →
            </a>
          </>
        )}
        <div style={{ marginLeft: 'auto', color: 'var(--slate-600)' }}>
          {gcalEvents.length > 0 && `${gcalEvents.length} Google Calendar event${gcalEvents.length !== 1 ? 's' : ''} loaded`}
        </div>
      </div>
    </div>
  )
}
