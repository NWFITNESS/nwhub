'use no memo'
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import type { DashboardData, DashboardTask } from '@/components/widgets/DashboardWidgetGrid'
import { MiniCalendar } from './MiniCalendar'
import { WebsiteVisitorsChart } from './MemberGrowthChart'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layouts } from 'react-grid-layout'
import {
  Settings2, Check, GripVertical, X, Plus,
  Pencil, Trash2, CheckCheck, ExternalLink,
} from 'lucide-react'
import { useWidgetLayout, type WidgetDef } from '@/components/widgets/useWidgetLayout'
import { WidgetPicker } from '@/components/widgets/WidgetPicker'

const ResponsiveGridLayout = WidthProvider(Responsive)

// ── Widget catalogue ───────────────────────────────────────────────────────────

const OVERVIEW_WIDGETS: WidgetDef[] = [
  { id: 'kpi-members',     name: 'Total Members',             category: 'kpi',   defaultLayout: { w: 3,  h: 3, x: 0,  y: 0  } },
  { id: 'kpi-subscribers', name: 'Email Subscribers',         category: 'kpi',   defaultLayout: { w: 3,  h: 3, x: 3,  y: 0  } },
  { id: 'kpi-enquiries',   name: 'Unread Enquiries',          category: 'kpi',   defaultLayout: { w: 3,  h: 3, x: 6,  y: 0  } },
  { id: 'kpi-revenue',     name: 'Monthly Revenue',           category: 'kpi',   defaultLayout: { w: 3,  h: 3, x: 9,  y: 0  } },
  { id: 'main-panel',      name: 'Quick Actions & Enquiries', category: 'misc',  defaultLayout: { w: 8,  h: 10, x: 0, y: 3  } },
  { id: 'checklist',       name: 'Setup Checklist',           category: 'misc',  defaultLayout: { w: 4,  h: 7, x: 8,  y: 3  } },
  { id: 'system-status',   name: 'System Status',             category: 'misc',  defaultLayout: { w: 4,  h: 3, x: 8,  y: 10 } },
  { id: 'calendar',        name: 'Calendar',                  category: 'misc',  defaultLayout: { w: 4,  h: 5, x: 8,  y: 13 } },
  { id: 'visitor-chart',   name: 'Website Visitors',          category: 'chart', defaultLayout: { w: 8,  h: 7, x: 0,  y: 13 } },
  { id: 'todo',            name: 'To Do List',                category: 'misc',  defaultLayout: { w: 4,  h: 8, x: 0,  y: 20 } },
  { id: 'recent-posts',    name: 'Recent Blog Posts',         category: 'table', defaultLayout: { w: 8,  h: 6, x: 4,  y: 20 } },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9) }

function duePriority(due_date: string | null): { label: string; cls: string } | null {
  if (!due_date) return null
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const d = new Date(due_date + 'T00:00:00')
  const diff = Math.floor((d.getTime() - now.getTime()) / 86400000)
  if (diff < 0) return { label: 'Overdue', cls: 'bg-red-500/15 text-red-400 border-red-500/25' }
  if (diff === 0) return { label: 'Today', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/25' }
  if (diff <= 3) return { label: `${diff}d`, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' }
  return null
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-[#C9A70A]', low: 'bg-white/20',
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, gold, icon }: {
  label: string; value: number | string; sub: string; gold?: boolean; icon: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--slate-700)' : 'var(--slate-750)',
        border: `1px solid ${hovered ? 'rgba(212,160,23,0.22)' : 'rgba(255,255,255,0.13)'}`,
        borderRadius: 10, padding: '15px 17px 13px',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', overflow: 'hidden', cursor: 'default',
        height: '100%', boxSizing: 'border-box',
        transition: 'background 0.18s, border-color 0.18s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.1px', textTransform: 'uppercase', color: 'var(--slate-400)' }}>
          {label}
        </span>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div className="font-brand" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.5px', color: gold ? 'var(--r-gold-300)' : '#fff' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{sub}</div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: gold
          ? 'linear-gradient(90deg, rgba(212,160,23,0.65), transparent)'
          : 'linear-gradient(90deg, var(--slate-600), transparent)',
      }} />
    </div>
  )
}

// ── Quick Action ──────────────────────────────────────────────────────────────

function QuickAction({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: React.ReactNode }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--slate-700)' : 'var(--slate-750)',
        padding: '15px 17px',
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'background 0.15s', textDecoration: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 33, height: 33, borderRadius: 8, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{
          color: hovered ? 'var(--r-gold-400)' : 'var(--slate-600)', fontSize: 14,
          transform: hovered ? 'translate(2px,-2px)' : 'none',
          transition: 'color 0.15s, transform 0.15s', display: 'inline-block',
        }}>↗</span>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: hovered ? '#fff' : 'var(--slate-200)', transition: 'color 0.15s' }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--slate-500)', lineHeight: 1.5 }}>{desc}</div>
    </Link>
  )
}

// ── Widget wrapper (adds drag handle + remove button in customise mode) ────────

function WidgetWrapper({ id, isCustomising, onRemove, children }: {
  id: string; isCustomising: boolean; onRemove: (id: string) => void; children: React.ReactNode
}) {
  return (
    <div style={{ position: 'relative', height: '100%', borderRadius: 10, outline: isCustomising ? '1px dashed rgba(212,175,55,0.18)' : 'none' }}>
      {isCustomising && (
        <>
          <div className="widget-drag-handle" style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, background: 'rgba(11,14,20,0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 6px', color: 'var(--slate-400)', cursor: 'grab', display: 'flex', alignItems: 'center' }}>
            <GripVertical size={12} />
          </div>
          <button onClick={() => onRemove(id)} style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, background: 'rgba(11,14,20,0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 6px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <X size={12} />
          </button>
        </>
      )}
      {children}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface CustomItem { id: string; label: string; done: boolean }

interface Props {
  data: DashboardData
  formattedDate: string
}

export function OverviewContent({ data, formattedDate }: Props) {
  const { layouts, visibleIds, saveLayouts, removeWidget, addWidget } = useWidgetLayout('dashboard', OVERVIEW_WIDGETS)
  const [isCustomising, setIsCustomising] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // ── Task state ──────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<DashboardTask[]>(data.tasks)

  async function handleTaskToggle(id: string, completed: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
  }

  // Quick-add task from dashboard
  const [newTaskTitle, setNewTaskTitle] = useState('')
  async function handleAddTask() {
    const title = newTaskTitle.trim()
    if (!title) return
    setNewTaskTitle('')
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, priority: 'medium' }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [task, ...prev])
    }
  }

  // ── Checklist state (localStorage-backed) ──────────────────────────────────
  const [checklistEditing, setChecklistEditing] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [customItems, setCustomItems] = useState<CustomItem[]>([])
  const [newCheckItem, setNewCheckItem] = useState('')
  const newCheckRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      setOverrides(JSON.parse(localStorage.getItem('nw-cl-ov') ?? '{}'))
      setCustomItems(JSON.parse(localStorage.getItem('nw-cl-cu') ?? '[]'))
    } catch {}
  }, [])

  function toggleOverride(label: string, currentDone: boolean) {
    const next = { ...overrides, [label]: !currentDone }
    setOverrides(next)
    localStorage.setItem('nw-cl-ov', JSON.stringify(next))
  }

  function toggleCustom(id: string) {
    const next = customItems.map(c => c.id === id ? { ...c, done: !c.done } : c)
    setCustomItems(next)
    localStorage.setItem('nw-cl-cu', JSON.stringify(next))
  }

  function deleteCustom(id: string) {
    const next = customItems.filter(c => c.id !== id)
    setCustomItems(next)
    localStorage.setItem('nw-cl-cu', JSON.stringify(next))
  }

  function addCustomItem() {
    const label = newCheckItem.trim()
    if (!label) return
    const next = [...customItems, { id: uid(), label, done: false }]
    setCustomItems(next)
    localStorage.setItem('nw-cl-cu', JSON.stringify(next))
    setNewCheckItem('')
    newCheckRef.current?.focus()
  }

  // Effective checklist (server items + custom, with overrides applied)
  const effectiveChecklist = [
    ...data.checklist.map(item => ({
      label: item.label,
      done: item.label in overrides ? overrides[item.label] : item.done,
      manual: item.manual ?? false,
      isCustom: false,
    })),
    ...customItems.map(c => ({ label: c.label, done: c.done, manual: true, isCustom: true, id: c.id })),
  ]
  const doneCount = effectiveChecklist.filter(c => c.done).length

  // ── Layout filter ─────────────────────────────────────────────────────────
  const filteredLayouts: Layouts = {}
  for (const [bp, items] of Object.entries(layouts)) {
    filteredLayouts[bp] = items.filter((item) => visibleIds.includes(item.i))
  }

  // ── Widget renderer ───────────────────────────────────────────────────────
  function renderWidget(id: string) {
    switch (id) {

      case 'kpi-members':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard label="Total Members" value={data.membersTotal} sub="Kids & adult registrations" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>} />
          </WidgetWrapper>
        )

      case 'kpi-subscribers':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard label="Email Subscribers" value={data.subscribers} sub="Via Mailchimp" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>} />
          </WidgetWrapper>
        )

      case 'kpi-enquiries':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard label="Unread Enquiries" value={data.newContacts} sub={data.newContacts === 0 ? 'All caught up' : `${data.newContacts} need attention`} icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>} />
          </WidgetWrapper>
        )

      case 'kpi-revenue':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard label="Monthly Revenue" value="£7,217" sub="↑ via Xero P&L" gold icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>} />
          </WidgetWrapper>
        )

      case 'main-panel':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
              <div style={{ padding: '11px 17px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Navigation</span>
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.09)' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>Quick Actions</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <QuickAction href="/enquiries" title="Contacts & Enquiries" desc="Track inbound leads, AI chat messages, and contact records." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>} />
                <QuickAction href="/content" title="Edit Website Content" desc="Update hero, memberships and FAQs without touching code." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M8 2v12M2 8h12"/></svg>} />
                <QuickAction href="/blog/manage" title="Blog & Posts" desc="Write and publish posts to engage members and boost SEO." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>} />
                <QuickAction href="/mailchimp" title="Email Campaigns" desc="Send newsletters to your subscriber list via Mailchimp." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>} />
              </div>
              <div style={{ padding: '11px 17px', borderTop: '1px solid rgba(255,255,255,0.07)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Inbound</span>
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.09)' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>Recent Enquiries</span>
              </div>
              {data.recentEnquiries.length === 0 ? (
                <div style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--slate-600)', fontSize: 12, textAlign: 'center', flex: 1, justifyContent: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>
                  </div>
                  No enquiries yet — they&apos;ll appear here as they come in.
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {data.recentEnquiries.map(enq => (
                    <div key={enq.id} style={{ padding: '10px 17px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate-200)' }}>{enq.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--slate-600)' }}>{new Date(enq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--slate-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{enq.message ?? enq.enquiry_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </WidgetWrapper>
        )

      case 'checklist':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ padding: '13px 17px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>Setup Checklist</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="font-brand" style={{ fontSize: 16, fontWeight: 700, color: 'var(--r-gold-300)' }}>
                      {doneCount} / {effectiveChecklist.length}
                    </span>
                    <button
                      onClick={() => setChecklistEditing(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                        color: checklistEditing ? 'var(--r-gold-300)' : 'var(--slate-500)',
                        background: checklistEditing ? 'rgba(212,160,23,0.1)' : 'transparent',
                        border: checklistEditing ? '1px solid rgba(212,160,23,0.3)' : '1px solid rgba(255,255,255,0.08)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {checklistEditing ? <Check size={11} /> : <Pencil size={11} />}
                      {checklistEditing ? 'Done' : 'Edit'}
                    </button>
                  </div>
                </div>
                <div style={{ height: 3, background: 'var(--slate-700)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--r-gold-600), var(--r-gold-300))',
                    borderRadius: 3,
                    width: effectiveChecklist.length > 0 ? `${(doneCount / effectiveChecklist.length) * 100}%` : '0%',
                    transition: 'width 0.4s',
                  }} />
                </div>
              </div>

              {/* Items */}
              <div style={{ padding: '4px 0', flex: 1, overflowY: 'auto' }}>
                {effectiveChecklist.map((item, i) => {
                  const customId = (item as { id?: string }).id
                  return (
                    <div
                      key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 17px', cursor: item.manual ? 'pointer' : 'default', transition: 'background 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      onClick={() => {
                        if (!item.manual) return
                        if (item.isCustom && customId) toggleCustom(customId)
                        else toggleOverride(item.label, item.done)
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{ width: 15, minWidth: 15, height: 15, borderRadius: '50%', border: item.done ? 'none' : `1.5px solid ${item.manual ? 'var(--slate-500)' : 'var(--slate-600)'}`, background: item.done ? 'var(--r-gold-500)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.done && (
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
                            <path d="M2 5l2.5 2.5L8 2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      {/* Label */}
                      <span style={{ flex: 1, fontSize: 12, color: item.done ? 'var(--slate-600)' : 'var(--slate-300)', textDecoration: item.done ? 'line-through' : 'none', minWidth: 0 }}>
                        {item.label}
                      </span>
                      {/* Auto badge or done badge */}
                      {!item.manual && (
                        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '2px 5px', borderRadius: 5, flexShrink: 0, background: 'rgba(100,116,139,0.1)', color: 'var(--slate-600)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          Auto
                        </span>
                      )}
                      {item.manual && !checklistEditing && (
                        <span style={{
                          fontSize: 9, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
                          padding: '2px 7px', borderRadius: 8, flexShrink: 0,
                          background: item.done ? 'rgba(74,222,128,0.1)' : 'rgba(100,116,139,0.1)',
                          color: item.done ? 'var(--r-green)' : 'var(--slate-500)',
                          border: `1px solid ${item.done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        }}>
                          {item.done ? 'Done' : 'To do'}
                        </span>
                      )}
                      {/* Delete button for custom items in edit mode */}
                      {checklistEditing && item.isCustom && customId && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteCustom(customId) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', display: 'flex', padding: 2, flexShrink: 0 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f87171' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)' }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* Add custom item input — visible in edit mode */}
                {checklistEditing && (
                  <div style={{ padding: '6px 17px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 15, minWidth: 15, height: 15, borderRadius: '50%', border: '1.5px dashed var(--slate-600)', flexShrink: 0 }} />
                    <input
                      ref={newCheckRef}
                      value={newCheckItem}
                      onChange={e => setNewCheckItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomItem()}
                      placeholder="Add checklist item…"
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 12, color: 'var(--slate-300)', caretColor: 'var(--r-gold-400)',
                      }}
                    />
                    <button
                      onClick={addCustomItem}
                      style={{
                        width: 22, height: 22, borderRadius: 6, background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)',
                        color: 'var(--r-gold-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </WidgetWrapper>
        )

      case 'system-status':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, padding: '14px 17px', display: 'flex', flexDirection: 'column', gap: 11, height: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>SYSTEM STATUS</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Supabase',      status: 'Operational', color: 'var(--r-green)' },
                  { name: 'Vercel Deploy', status: 'Live',        color: 'var(--r-green)' },
                  { name: 'Resend Email',  status: 'Pending',     color: 'var(--r-amber)' },
                  { name: 'Twilio SMS',    status: 'Pending',     color: 'var(--r-amber)' },
                ].map(row => (
                  <div key={row.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--slate-400)' }}>{row.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: row.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </WidgetWrapper>
        )

      case 'calendar':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ height: '100%', overflow: 'hidden', borderRadius: 10 }}>
              <MiniCalendar />
            </div>
          </WidgetWrapper>
        )

      case 'visitor-chart':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '13px 17px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>Website Visitors</span>
              </div>
              <div style={{ flex: 1, minHeight: 0, padding: '8px 0' }}>
                <WebsiteVisitorsChart data24h={data.data24h} data7d={data.data7d} data30d={data.data30d} data1y={data.data1y} />
              </div>
            </div>
          </WidgetWrapper>
        )

      case 'todo':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '13px 17px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>To Do</span>
                  {tasks.filter(t => !t.completed).length > 0 && (
                    <span className="ml-2 text-[10px] font-bold text-[#f2ca50]">
                      {tasks.filter(t => !t.completed).length} pending
                    </span>
                  )}
                </div>
                <Link href="/inbox" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--slate-500)', textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--r-gold-400)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-500)' }}
                >
                  View all <ExternalLink size={10} />
                </Link>
              </div>

              {/* Quick add */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <input
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                  placeholder="Quick add task…"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--slate-300)', caretColor: 'var(--r-gold-400)' }}
                />
                <button
                  onClick={handleAddTask}
                  style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(212,160,23,0.12)', border: '1px solid rgba(212,160,23,0.3)', color: 'var(--r-gold-400)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Task list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {tasks.filter(t => !t.completed).length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 6, color: 'var(--slate-600)', fontSize: 12 }}>
                    <CheckCheck size={22} style={{ opacity: 0.4 }} />
                    All caught up
                  </div>
                ) : (
                  tasks.filter(t => !t.completed).slice(0, 12).map(task => {
                    const badge = duePriority(task.due_date)
                    return (
                      <div
                        key={task.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        <button
                          onClick={() => handleTaskToggle(task.id, true)}
                          style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--slate-500)', background: 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--r-gold-400)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,23,0.1)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--slate-500)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        />
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_DOT[task.priority] ?? 'var(--slate-600)', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, color: 'var(--slate-300)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                        {badge && (
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 4, flexShrink: 0 }} className={badge.cls}>{badge.label}</span>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </WidgetWrapper>
        )

      case 'recent-posts':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '13px 17px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>Recent Blog Posts</span>
                <Link href="/blog/manage" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--slate-500)', textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--r-gold-400)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--slate-500)' }}
                >
                  Manage <ExternalLink size={10} />
                </Link>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {data.recentPosts.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12, color: 'var(--slate-600)' }}>No posts yet</div>
                ) : data.recentPosts.map(post => (
                  <div
                    key={post.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 17px', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate-200)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                      <p style={{ fontSize: 10, color: 'var(--slate-500)', marginTop: 2 }}>
                        {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
                      padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                      background: post.status === 'published' ? 'rgba(74,222,128,0.1)' : 'rgba(100,116,139,0.1)',
                      color: post.status === 'published' ? 'var(--r-green)' : 'var(--slate-500)',
                      border: `1px solid ${post.status === 'published' ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                      {post.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </WidgetWrapper>
        )

      default:
        return null
    }
  }

  return (
    <div className="hidden lg:flex flex-col" style={{ background: 'var(--slate-900)', height: '100%' }}>
      <TopBar />

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>ADMIN PANEL</p>
            <h1 className="font-brand" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.3px', lineHeight: 1 }}>
              <span style={{ color: '#fff' }}>Northern Warrior </span>
              <span style={{ color: 'var(--r-gold-400)' }}>Hub</span>
            </h1>
            <p style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 1 }}>{formattedDate}</p>
          </div>

          {/* Customise controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            {isCustomising && (
              <button
                onClick={() => setPickerOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--slate-400)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', transition: 'color 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--slate-200)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--slate-400)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
              >
                <Plus size={13} /> Add widgets
              </button>
            )}
            <button
              onClick={() => setIsCustomising(!isCustomising)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: isCustomising ? 'var(--r-gold-300)' : 'var(--slate-400)', background: isCustomising ? 'rgba(212,160,23,0.08)' : 'transparent', border: isCustomising ? '1px solid rgba(212,160,23,0.35)' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.15s' }}
            >
              {isCustomising ? <Check size={13} /> : <Settings2 size={13} />}
              {isCustomising ? 'Done' : 'Customise'}
            </button>
          </div>
        </div>

        {/* Widget grid */}
        <ResponsiveGridLayout
          layouts={filteredLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          margin={[12, 12]}
          draggableHandle=".widget-drag-handle"
          isDraggable={isCustomising}
          isResizable={isCustomising}
          onLayoutChange={(_, all) => saveLayouts(all)}
          useCSSTransforms
        >
          {visibleIds.map((id) => (
            <div key={id} style={{ overflow: 'hidden' }}>
              {renderWidget(id)}
            </div>
          ))}
        </ResponsiveGridLayout>

      </div>

      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        allWidgets={OVERVIEW_WIDGETS}
        visibleIds={visibleIds}
        onAdd={addWidget}
        onRemove={removeWidget}
      />
    </div>
  )
}
