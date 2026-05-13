'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface ChartDataPoint {
  label: string
  value: number
}

type Range = '24H' | '7D' | '30D' | '1Y'

interface Props {
  data24h: ChartDataPoint[]
  data7d: ChartDataPoint[]
  data30d: ChartDataPoint[]
  data1y: ChartDataPoint[]
}

// Placeholder data — never show an empty chart (SKILL.md §5)
function buildPlaceholders() {
  const now = new Date()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const ph24h: ChartDataPoint[] = Array.from({ length: 24 }, (_, idx) => {
    const h = new Date(now.getTime() - (23 - idx) * 3600000)
    const hour = h.getHours()
    const ampm = hour < 12 ? 'am' : 'pm'
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const label = hour === 0 ? `${h.getDate()}/${h.getMonth() + 1}` : `${h12}${ampm}`
    return { label, value: Math.round(2 + Math.random() * 6) }
  })

  const ph7d: ChartDataPoint[] = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(now.getTime() - (6 - idx) * 86400000)
    const label = idx === 6 ? 'Today' : `${dayNames[d.getDay()]} ${d.getDate()}`
    return { label, value: 12 + idx * 4 + Math.round(Math.random() * 8) }
  })

  const ph30d: ChartDataPoint[] = Array.from({ length: 30 }, (_, idx) => {
    const d = new Date(now.getTime() - (29 - idx) * 86400000)
    const label = idx === 29 ? 'Today' : `${d.getDate()} ${monthNames[d.getMonth()]}`
    return { label, value: 8 + Math.round(Math.random() * 15) }
  })

  const ph1y: ChartDataPoint[] = Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1)
    const mName = monthNames[d.getMonth()]
    const label = idx === 11 ? `${mName} (now)` : `${mName} ${String(d.getFullYear()).slice(2)}`
    return { label, value: 100 + idx * 70 + Math.round(Math.random() * 40) }
  })

  return { '24H': ph24h, '7D': ph7d, '30D': ph30d, '1Y': ph1y }
}

const PH = buildPlaceholders()

const PLACEHOLDERS = PH

const RANGE_LABELS: Record<Range, string> = {
  '24H': 'Today', '7D': 'This Week', '30D': 'This Month', '1Y': 'This Year',
}

function hasData(data: ChartDataPoint[]) {
  return data.length > 0 && data.some((d) => d.value > 0)
}

export function WebsiteVisitorsChart({ data24h, data7d, data30d, data1y }: Props) {
  const [range, setRange] = useState<Range>('7D')

  const datasets: Record<Range, ChartDataPoint[]> = {
    '24H': data24h, '7D': data7d, '30D': data30d, '1Y': data1y,
  }

  const rawData = datasets[range]
  const data = hasData(rawData) ? rawData : PLACEHOLDERS[range]
  const isPlaceholder = !hasData(rawData)

  // For 30D, only show every 5th tick to avoid crowding
  const tickInterval = range === '30D' ? 4 : range === '24H' ? 2 : 0

  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--slate-750)', border: '1px solid var(--r-panel-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--r-gold-500)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
            Analytics
          </p>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-100)' }}>
            Website Visitors
            <span className="text-white/30 font-normal text-sm ml-2">— {RANGE_LABELS[range]}</span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isPlaceholder && (
            <span className="text-[10px] text-white/20 uppercase tracking-widest">sample data</span>
          )}
          <div className="flex gap-0.5 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            {(['24H', '7D', '30D', '1Y'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  range === r
                    ? 'bg-[#967705]/20 text-[#C9A70A] border border-[#967705]/30'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid rgba(201,167,10,0.3)',
              borderRadius: '8px',
              color: '#F0F0F0',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
            itemStyle={{ color: '#C9A70A', fontWeight: 700 }}
            cursor={{ stroke: 'rgba(201,167,10,0.15)', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#C9A70A"
            strokeWidth={2}
            dot={range === '24H' || range === '30D' ? false : { fill: '#C9A70A', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, fill: '#C9A70A' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
