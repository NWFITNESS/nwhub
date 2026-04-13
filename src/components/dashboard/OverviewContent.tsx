'use no memo'
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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
  { id: 'kpi-members',     name: 'Total Members',             category: 'kpi',   defaultLayout: { w: 2,  h: 3, x: 0,  y: 0  } },
  { id: 'kpi-kids',        name: 'Kids & Teens',              category: 'kpi',   defaultLayout: { w: 2,  h: 3, x: 2,  y: 0  } },
  { id: 'kpi-leads',       name: 'Lead Pipeline',             category: 'kpi',   defaultLayout: { w: 4,  h: 3, x: 4,  y: 0  } },
  { id: 'kpi-subscribers', name: 'Email Subscribers',         category: 'kpi',   defaultLayout: { w: 2,  h: 3, x: 8,  y: 0  } },
  { id: 'kpi-enquiries',   name: 'Unread Enquiries',          category: 'kpi',   defaultLayout: { w: 2,  h: 3, x: 10, y: 0  } },
  { id: 'kpi-revenue',     name: 'Monthly Revenue',           category: 'kpi',   defaultLayout: { w: 3,  h: 3, x: 0,  y: 3  } },
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
  return (
    <div className="relative cursor-default overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 p-6 shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md h-full">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)]">{icon}</div>
      </div>
      <div className={`mt-3 font-brand text-[34px] font-bold leading-none tracking-[-0.5px] ${gold ? 'text-gold-300' : 'text-white'}`}>{value}</div>
      <div className="mt-2 text-xs font-medium text-nw-400">{sub}</div>
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${gold ? 'bg-gradient-to-r from-[rgba(212,160,23,0.65)] to-transparent' : 'bg-gradient-to-r from-nw-600 to-transparent'}`} />
    </div>
  )
}

// ── Quick Action ──────────────────────────────────────────────────────────────

function QuickAction({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2.5 bg-nw-750 p-5 transition-colors hover:bg-nw-700 no-underline"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)]">
          {icon}
        </div>
        <span className="text-sm text-nw-600 transition-[color,transform] duration-150 group-hover:text-gold-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
      </div>
      <div className="text-sm font-semibold text-nw-200 transition-colors group-hover:text-white">{title}</div>
      <div className="text-xs text-nw-400 leading-relaxed">{desc}</div>
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
            <StatCard label="Total Members" value={data.membersTotal} sub="Active memberships" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>} />
          </WidgetWrapper>
        )

      case 'kpi-kids':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard label="Kids & Teens" value={data.kidsRegistrations} sub="Programme registrations" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="6" r="3"/><path d="M4 14c0-2.2 1.8-4 4-4s4 1.8 4 4"/><path d="M5 3c0-1 .5-2 3-2s3 1 3 2" strokeLinecap="round"/></svg>} />
          </WidgetWrapper>
        )

      case 'kpi-leads':
        {
          const convRate = data.leadCount + data.convertedLeads > 0
            ? Math.round((data.convertedLeads / (data.leadCount + data.convertedLeads)) * 100)
            : 0
          return (
            <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
              <div className="relative cursor-default overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.13)] bg-nw-750 shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md h-full">
                <div className="flex items-stretch h-full">
                  {/* Total Leads */}
                  <div className="flex-1 p-[13px_15px_11px]">
                    <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">Total Leads</span>
                    <div className="mt-1.5 font-brand text-[28px] font-bold leading-none tracking-[-0.5px] text-white">{data.leadCount}</div>
                    <div className="mt-1 text-[10px] text-nw-500">No membership</div>
                  </div>
                  {/* Divider */}
                  <div className="w-px self-stretch my-2.5 bg-[rgba(255,255,255,0.09)]" />
                  {/* Converted */}
                  <div className="flex-1 p-[13px_15px_11px]">
                    <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">Converted</span>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="font-brand text-[28px] font-bold leading-none tracking-[-0.5px] text-gold-300">{data.convertedLeads}</span>
                      {convRate > 0 && (
                        <span className="rounded-[5px] bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-1 py-px text-[9px] font-semibold text-[#4ade80]">{convRate}%</span>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] text-nw-500">Became members</div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[rgba(212,160,23,0.65)] to-transparent" />
              </div>
            </WidgetWrapper>
          )
        }

      case 'kpi-subscribers':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard label="Email Subscribers" value={data.subscribers} sub="Active subscribers" icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>} />
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
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
              <div className="flex flex-shrink-0 items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[11px]">
                <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">Navigation</span>
                <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
                <span className="text-[13px] font-medium text-nw-200">Quick Actions</span>
              </div>
              <div className="grid grid-cols-2 flex-shrink-0" style={{ gap: 1, background: 'rgba(255,255,255,0.07)' }}>
                <QuickAction href="/enquiries" title="Contacts & Enquiries" desc="Track inbound leads, AI chat messages, and contact records." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>} />
                <QuickAction href="/content" title="Edit Website Content" desc="Update hero, memberships and FAQs without touching code." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M8 2v12M2 8h12"/></svg>} />
                <QuickAction href="/blog/manage" title="Blog & Posts" desc="Write and publish posts to engage members and boost SEO." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>} />
                <QuickAction href="/mailchimp" title="Email Campaigns" desc="Send newsletters to your subscriber list via Mailchimp." icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>} />
              </div>
              <div className="flex flex-shrink-0 items-center gap-2 border-y border-[rgba(255,255,255,0.07)] px-[17px] py-[11px]">
                <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">Inbound</span>
                <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
                <span className="text-[13px] font-medium text-nw-200">Recent Enquiries</span>
              </div>
              {data.recentEnquiries.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-7 text-center text-xs text-nw-600">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>
                  </div>
                  No enquiries yet — they&apos;ll appear here as they come in.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {data.recentEnquiries.map(enq => (
                    <div key={enq.id} className="flex flex-col gap-[3px] border-b border-[rgba(255,255,255,0.05)] px-[17px] py-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-nw-200">{enq.name}</span>
                        <span className="text-[10px] text-nw-600">{new Date(enq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <span className="truncate text-[11px] text-nw-500">{enq.message ?? enq.enquiry_type}</span>
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
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
              {/* Header */}
              <div className="flex-shrink-0 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[13px]">
                <div className="flex items-center justify-between mb-[9px]">
                  <span className="text-[13px] font-medium text-nw-200">Setup Checklist</span>
                  <div className="flex items-center gap-2">
                    <span className="font-brand text-[16px] font-bold text-gold-300">
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
                <div className="h-[3px] overflow-hidden rounded-full bg-nw-700">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-[width] duration-[400ms]"
                    style={{ width: effectiveChecklist.length > 0 ? `${(doneCount / effectiveChecklist.length) * 100}%` : '0%' }}
                  />
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
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 p-[14px_17px]">
              <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">System Status</span>
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Supabase',      status: 'Operational', color: '#4ade80' },
                  { name: 'Vercel Deploy', status: 'Live',        color: '#4ade80' },
                  { name: 'Resend Email',  status: 'Pending',     color: '#f59e0b' },
                ].map(row => (
                  <div key={row.name} className="flex items-center justify-between text-xs">
                    <span className="text-nw-400">{row.name}</span>
                    <span className="flex items-center gap-1.5 font-medium" style={{ color: row.color }}>
                      <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
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
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
              <div className="flex-shrink-0 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[13px]">
                <span className="text-[13px] font-medium text-nw-200">Website Visitors</span>
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
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[13px]">
                <div>
                  <span className="text-[13px] font-medium text-nw-200">To Do</span>
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
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
              <div className="flex flex-shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[13px]">
                <span className="text-[13px] font-medium text-nw-200">Recent Blog Posts</span>
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
    <div className="flex flex-col gap-4">

        {/* Page header */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-[3px]">
            <span className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">Admin Panel</span>
            <h1 className="font-brand text-[28px] font-bold leading-none tracking-[0.3px] text-white">
              Northern Warrior <span className="text-gold-400">Hub</span>
            </h1>
            <span className="mt-px text-xs text-nw-500">{formattedDate}</span>
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
