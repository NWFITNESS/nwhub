'use no memo'
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import type { DashboardData } from '@/components/widgets/DashboardWidgetGrid'
import { MiniCalendar } from './MiniCalendar'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layouts } from 'react-grid-layout'
import { Settings2, Check, GripVertical, X, Plus } from 'lucide-react'
import { useWidgetLayout, type WidgetDef } from '@/components/widgets/useWidgetLayout'
import { WidgetPicker } from '@/components/widgets/WidgetPicker'

const ResponsiveGridLayout = WidthProvider(Responsive)

// ── Widget catalogue ───────────────────────────────────────────────────────────

const OVERVIEW_WIDGETS: WidgetDef[] = [
  { id: 'kpi-members',     name: 'Total Members',             category: 'kpi',  defaultLayout: { w: 3, h: 3, x: 0,  y: 0  } },
  { id: 'kpi-subscribers', name: 'Email Subscribers',         category: 'kpi',  defaultLayout: { w: 3, h: 3, x: 3,  y: 0  } },
  { id: 'kpi-enquiries',   name: 'Unread Enquiries',          category: 'kpi',  defaultLayout: { w: 3, h: 3, x: 6,  y: 0  } },
  { id: 'kpi-revenue',     name: 'Monthly Revenue',           category: 'kpi',  defaultLayout: { w: 3, h: 3, x: 9,  y: 0  } },
  { id: 'main-panel',      name: 'Quick Actions & Enquiries', category: 'misc', defaultLayout: { w: 8, h: 10, x: 0, y: 3  } },
  { id: 'checklist',       name: 'Setup Checklist',           category: 'misc', defaultLayout: { w: 4, h: 5, x: 8,  y: 3  } },
  { id: 'system-status',   name: 'System Status',             category: 'misc', defaultLayout: { w: 4, h: 3, x: 8,  y: 8  } },
  { id: 'calendar',        name: 'Calendar',                  category: 'misc', defaultLayout: { w: 4, h: 5, x: 8,  y: 11 } },
]

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

// ── Check Item ────────────────────────────────────────────────────────────────

function CheckItem({ item }: { item: { label: string; done: boolean } }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 17px', background: hovered ? 'rgba(255,255,255,0.03)' : 'transparent', transition: 'background 0.15s' }}
    >
      <div style={{ width: 15, minWidth: 15, height: 15, borderRadius: '50%', border: item.done ? 'none' : '1.5px solid var(--slate-600)', background: item.done ? 'var(--r-gold-500)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {item.done && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2">
            <path d="M2 5l2.5 2.5L8 2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{ flex: 1, fontSize: 12, color: item.done ? 'var(--slate-600)' : 'var(--slate-300)', textDecoration: item.done ? 'line-through' : 'none' }}>
        {item.label}
      </span>
      <span style={{
        fontSize: 9, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
        padding: '2px 7px', borderRadius: 8, flexShrink: 0,
        background: item.done ? 'rgba(74,222,128,0.1)' : 'rgba(100,116,139,0.1)',
        color: item.done ? 'var(--r-green)' : 'var(--slate-500)',
        border: `1px solid ${item.done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
      }}>
        {item.done ? 'Done' : 'To do'}
      </span>
    </div>
  )
}

// ── Widget wrapper (adds drag handle + remove button in customise mode) ────────

function WidgetWrapper({ id, isCustomising, onRemove, children }: {
  id: string
  isCustomising: boolean
  onRemove: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div style={{
      position: 'relative', height: '100%', borderRadius: 10,
      outline: isCustomising ? '1px dashed rgba(212,175,55,0.18)' : 'none',
    }}>
      {isCustomising && (
        <>
          <div
            className="widget-drag-handle"
            style={{
              position: 'absolute', top: 8, left: 8, zIndex: 10,
              background: 'rgba(11,14,20,0.88)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '4px 6px',
              color: 'var(--slate-400)', cursor: 'grab', display: 'flex', alignItems: 'center',
            }}
          >
            <GripVertical size={12} />
          </div>
          <button
            onClick={() => onRemove(id)}
            style={{
              position: 'absolute', top: 8, right: 8, zIndex: 10,
              background: 'rgba(11,14,20,0.88)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '4px 6px',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={12} />
          </button>
        </>
      )}
      {children}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  data: DashboardData
  formattedDate: string
}

export function OverviewContent({ data, formattedDate }: Props) {
  const doneCount = data.checklist.filter(c => c.done).length
  const { layouts, visibleIds, saveLayouts, removeWidget, addWidget } = useWidgetLayout('dashboard', OVERVIEW_WIDGETS)
  const [isCustomising, setIsCustomising] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Filter layouts to only visible widgets
  const filteredLayouts: Layouts = {}
  for (const [bp, items] of Object.entries(layouts)) {
    filteredLayouts[bp] = (items as Array<{ i: string } & Record<string, unknown>>).filter((item) => visibleIds.includes(item.i))
  }

  function renderWidget(id: string) {
    switch (id) {

      case 'kpi-members':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard
              label="Total Members"
              value={data.membersTotal}
              sub="Awaiting first signup"
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"/></svg>}
            />
          </WidgetWrapper>
        )

      case 'kpi-subscribers':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard
              label="Email Subscribers"
              value={data.subscribers}
              sub="Via Mailchimp"
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>}
            />
          </WidgetWrapper>
        )

      case 'kpi-enquiries':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard
              label="Unread Enquiries"
              value={data.newContacts}
              sub={data.newContacts === 0 ? 'All caught up' : `${data.newContacts} need attention`}
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>}
            />
          </WidgetWrapper>
        )

      case 'kpi-revenue':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <StatCard
              label="Monthly Revenue"
              value="£7,217"
              sub="↑ via Xero P&L"
              gold
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><path d="M2 11l3.5-3.5L8 10l5.5-6" strokeLinecap="round" strokeLinejoin="round"/><rect x="1" y="1" width="14" height="14" rx="2"/></svg>}
            />
          </WidgetWrapper>
        )

      case 'main-panel':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>

              {/* Quick Actions header */}
              <div style={{ padding: '11px 17px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Navigation</span>
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.09)' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>Quick Actions</span>
              </div>

              {/* 2×2 grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <QuickAction
                  href="/enquiries"
                  title="Contacts & Enquiries"
                  desc="Track inbound leads, AI chat messages, and contact records."
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5"/></svg>}
                />
                <QuickAction
                  href="/content"
                  title="Edit Website Content"
                  desc="Update hero, memberships and FAQs without touching code."
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M8 2v12M2 8h12"/></svg>}
                />
                <QuickAction
                  href="/blog/manage"
                  title="Blog & Posts"
                  desc="Write and publish posts to engage members and boost SEO."
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 6h6M5 9h4"/></svg>}
                />
                <QuickAction
                  href="/mailchimp"
                  title="Email Campaigns"
                  desc="Send newsletters to your subscriber list via Mailchimp."
                  icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.7"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-4 3V3a1 1 0 011-1z"/></svg>}
                />
              </div>

              {/* Recent Enquiries header */}
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
                        <span style={{ fontSize: 10, color: 'var(--slate-600)' }}>
                          {new Date(enq.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--slate-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {enq.message ?? enq.enquiry_type}
                      </span>
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
              <div style={{ padding: '13px 17px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--slate-200)' }}>Setup Checklist</span>
                  <span className="font-brand" style={{ fontSize: 16, fontWeight: 700, color: 'var(--r-gold-300)' }}>
                    {doneCount} / {data.checklist.length}
                  </span>
                </div>
                <div style={{ height: 3, background: 'var(--slate-700)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--r-gold-600), var(--r-gold-300))',
                    borderRadius: 3,
                    width: `${(doneCount / data.checklist.length) * 100}%`,
                    transition: 'width 0.6s',
                  }} />
                </div>
              </div>
              <div style={{ padding: '4px 0', flex: 1, overflowY: 'auto' }}>
                {data.checklist.map((item, i) => <CheckItem key={i} item={item} />)}
              </div>
            </div>
          </WidgetWrapper>
        )

      case 'system-status':
        return (
          <WidgetWrapper id={id} isCustomising={isCustomising} onRemove={removeWidget}>
            <div style={{ background: 'var(--slate-750)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 10, padding: '14px 17px', display: 'flex', flexDirection: 'column', gap: 11, height: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>
                SYSTEM STATUS
              </span>
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

      default:
        return null
    }
  }

  return (
    <div className="hidden lg:flex flex-col" style={{ background: 'var(--slate-900)', height: '100%' }}>
      <TopBar />

      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '22px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--slate-500)' }}>
              ADMIN PANEL
            </p>
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
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  color: 'var(--slate-400)', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--slate-200)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--slate-400)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
              >
                <Plus size={13} />
                Add widgets
              </button>
            )}
            <button
              onClick={() => setIsCustomising(!isCustomising)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                color: isCustomising ? 'var(--r-gold-300)' : 'var(--slate-400)',
                background: isCustomising ? 'rgba(212,160,23,0.08)' : 'transparent',
                border: isCustomising ? '1px solid rgba(212,160,23,0.35)' : '1px solid rgba(255,255,255,0.1)',
                transition: 'all 0.15s',
              }}
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
