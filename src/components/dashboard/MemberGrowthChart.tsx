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
  Legend,
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
  comp7d?: ChartDataPoint[]
  comp30d?: ChartDataPoint[]
  comp1y?: ChartDataPoint[]
}

const RANGE_LABELS: Record<Range, string> = {
  '24H': 'Today', '7D': 'This Week', '30D': 'This Month', '1Y': 'This Year',
}

const COMP_LABELS: Record<Range, string> = {
  '24H': '', '7D': 'Last Week', '30D': 'Last Month', '1Y': 'Last Year',
}

function hasData(data: ChartDataPoint[]) {
  return data.length > 0 && data.some((d) => d.value > 0)
}

function sumValues(data: ChartDataPoint[]) {
  return data.reduce((a, b) => a + b.value, 0)
}

export function WebsiteVisitorsChart({ data24h, data7d, data30d, data1y, comp7d, comp30d, comp1y }: Props) {
  const [range, setRange] = useState<Range>('7D')
  const [showComparison, setShowComparison] = useState(false)

  const datasets: Record<Range, ChartDataPoint[]> = {
    '24H': data24h, '7D': data7d, '30D': data30d, '1Y': data1y,
  }
  const compDatasets: Record<Range, ChartDataPoint[] | undefined> = {
    '24H': undefined, '7D': comp7d, '30D': comp30d, '1Y': comp1y,
  }

  const currentData = datasets[range]
  const compData = compDatasets[range]
  const hasComp = range !== '24H' && compData && compData.length > 0

  // Merge current + comparison into a single dataset for Recharts
  // Use index-based alignment (day 1 vs day 1, Mon vs Mon, Jan vs Jan)
  const maxLen = Math.max(currentData.length, (showComparison && compData ? compData.length : 0))
  const mergedData = Array.from({ length: maxLen }, (_, i) => ({
    label: currentData[i]?.label ?? (compData?.[i]?.label ?? ''),
    value: currentData[i]?.value ?? null,
    ...(showComparison && compData ? { prev: compData[i]?.value ?? null } : {}),
  }))

  const currentTotal = sumValues(currentData)
  const compTotal = compData ? sumValues(compData) : 0
  const pctChange = compTotal > 0 ? Math.round(((currentTotal - compTotal) / compTotal) * 100) : null

  // Tick intervals to avoid label crowding
  const tickInterval = range === '30D' ? Math.max(0, Math.floor(currentData.length / 8) - 1) : range === '24H' ? 2 : 0

  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--slate-750)', border: '1px solid var(--r-panel-border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--r-gold-500)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4 }}>
            Analytics
          </p>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-100)' }}>
            Website Visitors
            <span className="text-white/30 font-normal text-sm ml-2">— {RANGE_LABELS[range]}</span>
          </h3>
          {showComparison && hasComp && pctChange !== null && (
            <p style={{ fontSize: 11, marginTop: 2 }}>
              <span className="text-white/40">{currentTotal} views</span>
              {' '}
              <span style={{ color: pctChange >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                {pctChange >= 0 ? '↑' : '↓'} {Math.abs(pctChange)}%
              </span>
              {' '}
              <span className="text-white/30">vs {COMP_LABELS[range]} ({compTotal})</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasComp && (
            <button
              onClick={() => setShowComparison(v => !v)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                showComparison
                  ? 'bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/30'
                  : 'text-white/30 hover:text-white/50 border border-transparent'
              }`}
            >
              Compare
            </button>
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
        <LineChart data={mergedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
            cursor={{ stroke: 'rgba(201,167,10,0.15)', strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={RANGE_LABELS[range]}
            stroke="#C9A70A"
            strokeWidth={2}
            dot={currentData.length <= 12 ? { fill: '#C9A70A', strokeWidth: 0, r: 4 } : false}
            activeDot={{ r: 6, fill: '#C9A70A' }}
            connectNulls
          />
          {showComparison && hasComp && (
            <Line
              type="monotone"
              dataKey="prev"
              name={COMP_LABELS[range]}
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              activeDot={{ r: 5, fill: '#3b82f6' }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
