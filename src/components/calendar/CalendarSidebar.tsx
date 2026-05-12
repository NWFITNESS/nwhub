'use client'

import { useState } from 'react'
import type { CalendarEvent } from '@/app/(dashboard)/calendar/types'
import { EventChip } from './EventChip'
import { X, Trash2 } from 'lucide-react'

interface CalendarSidebarProps {
  events: CalendarEvent[]
  selectedDate: string | null
  gcalConnected: boolean
  onCreateEvent: (data: {
    date: string
    label: string
    type: string
    description?: string
    startTime?: string
    endTime?: string
  }) => Promise<void>
  onDeleteEvent: (id: string, gcalId?: string) => Promise<void>
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (diff < 1) return 'Today'
  if (diff < 2) return 'Tomorrow'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────

const EVENT_TYPES = [
  { value: 'class',   label: 'Class' },
  { value: 'enquiry', label: 'Enquiry Follow-up' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'gcal',    label: 'General' },
]

function AddEventModal({
  defaultDate,
  onClose,
  onSubmit,
}: {
  defaultDate: string
  onClose: () => void
  onSubmit: (data: {
    date: string; label: string; type: string;
    description?: string; startTime?: string; endTime?: string
  }) => Promise<void>
}) {
  const [label, setLabel]         = useState('')
  const [date, setDate]           = useState(defaultDate)
  const [type, setType]           = useState('class')
  const [description, setDesc]    = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime]     = useState('')
  const [saving, setSaving]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !date) return
    setSaving(true)
    try {
      await onSubmit({
        date,
        label: label.trim(),
        type,
        description: description.trim() || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, padding: '7px 9px', fontSize: 12, color: 'var(--slate-200)',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--slate-800)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12, width: 380, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'scaleIn 0.15s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-100)' }}>Add Event</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', display: 'flex', padding: 2 }}>
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div>
            <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--slate-500)', display: 'block', marginBottom: 5 }}>Title *</label>
            <input
              autoFocus
              required
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Trial session, Membership renewal…"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--slate-500)', display: 'block', marginBottom: 5 }}>Date *</label>
              <input
                required
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--slate-500)', display: 'block', marginBottom: 5 }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--slate-500)', display: 'block', marginBottom: 5 }}>Start time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--slate-500)', display: 'block', marginBottom: 5 }}>End time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--slate-500)', display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Optional description…"
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          {/* GCal sync notice */}
          <div style={{ fontSize: 10, color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6ba3f5', flexShrink: 0 }} />
            This event will also be added to your Google Calendar
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: 'var(--slate-400)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !label.trim()}
              style={{ flex: 1, padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--slate-950)', background: 'linear-gradient(90deg, var(--r-gold-600), var(--r-gold-300))', border: 'none', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Saving…' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function CalendarSidebar({ events, selectedDate, gcalConnected, onCreateEvent, onDeleteEvent }: CalendarSidebarProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const defaultModalDate = selectedDate ?? today

  const upcoming = [...events]
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10)

  const filtered = selectedDate
    ? [
        ...events.filter(e => e.date === selectedDate),
        ...upcoming.filter(e => e.date !== selectedDate),
      ].slice(0, 10)
    : upcoming

  async function handleDelete(ev: CalendarEvent) {
    setDeletingId(ev.id)
    try {
      const gcalId = ev.type === 'gcal' ? ev.meta : undefined
      await onDeleteEvent(ev.id, gcalId)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div style={{
        width: 210, flexShrink: 0,
        background: 'var(--slate-950)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Legend */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 9 }}>
            EVENT TYPES
          </p>
          {[
            { bg: 'rgba(212,160,23,0.1)',  border: 'rgba(212,160,23,0.22)', label: 'Trial (WodBoard)' },
            { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.22)', label: 'Trial (continued)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 16, height: 5, borderRadius: 2, background: s.bg, border: `1px solid ${s.border}`, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{s.label}</span>
            </div>
          ))}
          {[
            { color: '#ef4444',           label: 'Gmail event' },
            { color: 'var(--r-gold-300)', label: 'Enquiry follow-up' },
            { color: 'var(--r-green)',    label: 'Renewal' },
            { color: '#a78bfa',           label: 'Class' },
            { color: '#6ba3f5',           label: 'Google Calendar' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Upcoming events */}
        <div style={{ padding: '14px 14px 10px', flex: 1, overflowY: 'auto' }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 9 }}>
            {selectedDate ? 'SELECTED DAY' : 'UPCOMING'}
          </p>

          {filtered.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--slate-600)', textAlign: 'center', paddingTop: 16 }}>
              No upcoming events
            </p>
          ) : (
            filtered.map(ev => (
              <div
                key={ev.id}
                style={{
                  background: 'var(--slate-800)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8, padding: '9px 10px', marginBottom: 7, position: 'relative',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--slate-750)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,160,23,0.22)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--slate-800)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'
                }}
              >
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>
                  {timeAgo(ev.date)}
                </p>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate-200)', marginTop: 2, paddingRight: 18 }}>{ev.label}</p>
                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <EventChip type={ev.type} label={ev.type === 'gcal' ? 'Google Calendar' : ev.type} />
                  <button
                    onClick={() => handleDelete(ev)}
                    disabled={deletingId === ev.id}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', display: 'flex', padding: 2, flexShrink: 0, opacity: deletingId === ev.id ? 0.4 : 1 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)' }}
                    title="Delete event"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {ev.meta && ev.type !== 'gcal' && (
                  <p style={{ fontSize: 10, color: 'var(--slate-600)', marginTop: 2 }}>{ev.meta}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add event button */}
        <button
          onClick={() => setModalOpen(true)}
          style={{
            margin: 14,
            background: 'rgba(212,160,23,0.1)',
            border: '1px solid rgba(212,160,23,0.22)',
            borderRadius: 8, color: 'var(--r-gold-300)',
            fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.5px',
            padding: '9px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.18)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,160,23,0.38)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.1)'
            ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,160,23,0.22)'
          }}
        >
          + Add event {gcalConnected ? '↗' : ''}
        </button>
      </div>

      {modalOpen && (
        <AddEventModal
          defaultDate={defaultModalDate}
          onClose={() => setModalOpen(false)}
          onSubmit={onCreateEvent}
        />
      )}
    </>
  )
}
