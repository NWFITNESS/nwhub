'use client'

import { useState, useEffect } from 'react'
import { Eye, Users, FileText, Monitor, Smartphone, Tablet } from 'lucide-react'

interface AnalyticsData {
  today: { sessions: number; users: number; pageViews: number }
  topPages: { path: string; views: number }[]
  devices: { name: string; count: number; pct: number }[]
}

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
}

const DEVICE_COLORS: Record<string, string> = {
  Desktop: '#C9A70A',
  Mobile: '#8b5cf6',
  Tablet: '#3b82f6',
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Homepage',
  '/membership': 'Membership',
  '/timetable': 'Timetable',
  '/training': 'Training',
  '/start-here': 'Start Here',
  '/contact': 'Contact',
  '/hyrox': 'HYROX',
  '/kids-teens': 'Kids & Teens',
  '/personal-training': 'Personal Training',
  '/physio': 'Physio',
  '/team': 'Our Team',
  '/our-facilities': 'Facilities',
  '/why-us': 'Why Us',
  '/results': 'Results',
  '/blog': 'Blog',
}

export function AnalyticsPanels() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetch('/api/analytics/realtime')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const maxPageViews = Math.max(1, ...data.topPages.map(p => p.views))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

      {/* Real-time stats */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750 h-full" style={{ padding: '20px' }}>
          <p className="text-nw-500 mb-4" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Today&apos;s Stats
          </p>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Sessions', value: data.today.sessions, icon: Eye, color: '#C9A70A' },
              { label: 'Users', value: data.today.users, icon: Users, color: '#8b5cf6' },
              { label: 'Page Views', value: data.today.pageViews, icon: FileText, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <s.icon size={16} style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-nw-400" style={{ fontSize: 11 }}>{s.label}</p>
                  <p className="font-brand text-nw-100" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{s.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top pages */}
      <div className="lg:col-span-5">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750 h-full" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-nw-500" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Top Pages
            </p>
            <span className="text-nw-600" style={{ fontSize: 11 }}>Last 30 days</span>
          </div>
          <div className="flex flex-col gap-2">
            {data.topPages.map((page, i) => {
              const barWidth = Math.max(8, (page.views / maxPageViews) * 100)
              const label = PAGE_LABELS[page.path] || page.path
              return (
                <div key={page.path} className="flex items-center gap-3" style={{ minHeight: 28 }}>
                  <span className="text-nw-600 flex-shrink-0 w-4 text-right" style={{ fontSize: 11 }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-nw-200 truncate" style={{ fontSize: 13 }}>{label}</span>
                      <span className="text-nw-400 flex-shrink-0 ml-2" style={{ fontSize: 12, fontWeight: 600 }}>{page.views.toLocaleString()}</span>
                    </div>
                    <div className="h-[3px] rounded-full bg-[rgba(255,255,255,0.04)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: 'linear-gradient(90deg, #C9A70A, #f2cb55)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Device breakdown */}
      <div className="lg:col-span-4">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750 h-full" style={{ padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-nw-500" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Devices
            </p>
            <span className="text-nw-600" style={{ fontSize: 11 }}>Last 30 days</span>
          </div>

          {/* Donut chart (CSS) */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative" style={{ width: 120, height: 120 }}>
              <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                {(() => {
                  let offset = 0
                  return data.devices.map(d => {
                    const dash = d.pct * 0.01 * 100
                    const el = (
                      <circle
                        key={d.name}
                        cx="18" cy="18" r="14"
                        fill="none"
                        stroke={DEVICE_COLORS[d.name] ?? '#5e6e82'}
                        strokeWidth="4"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                      />
                    )
                    offset += dash
                    return el
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-brand text-nw-100" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
                  {data.devices.reduce((a, d) => a + d.count, 0).toLocaleString()}
                </span>
                <span className="text-nw-500" style={{ fontSize: 9 }}>Total</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3">
            {data.devices.map(d => {
              const Icon = DEVICE_ICONS[d.name] ?? Monitor
              const color = DEVICE_COLORS[d.name] ?? '#5e6e82'
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <Icon size={14} className="flex-shrink-0" style={{ color }} />
                  <span className="flex-1 text-nw-300" style={{ fontSize: 13 }}>{d.name}</span>
                  <span className="text-nw-200 font-semibold" style={{ fontSize: 13 }}>{d.pct}%</span>
                  <span className="text-nw-500" style={{ fontSize: 11 }}>{d.count.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
