'use client'

import { useState } from 'react'
import {
  AreaChart,
  Area,
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
  comp7d?: ChartDataPoint[]
  comp30d?: ChartDataPoint[]
  comp1y?: ChartDataPoint[]
}

const RANGE_LABELS: Record<Range, string> = {
  '24H': 'Today', '7D': 'This Week', '30D': 'This Month', '1Y': 'This Year',
}

const COMP_LABELS: Record<Range, string> = {
  '24H': 'yesterday', '7D': 'last week', '30D': 'last month', '1Y': 'last year',
}

function sumValues(data: ChartDataPoint[]) {
  return data.reduce((a, b) => a + b.value, 0)
}

export function WebsiteVisitorsChart({ data24h, data7d, data30d, data1y, comp7d, comp30d, comp1y }: Props) {
  const [range, setRange] = useState<Range>('30D')

  const datasets: Record<Range, ChartDataPoint[]> = {
    '24H': data24h ?? [], '7D': data7d ?? [], '30D': data30d ?? [], '1Y': data1y ?? [],
  }
  const compDatasets: Record<Range, ChartDataPoint[] | undefined> = {
    '24H': undefined, '7D': comp7d, '30D': comp30d, '1Y': comp1y,
  }

  const currentData = datasets[range]
  const compData = compDatasets[range]
  const hasComp = compData && compData.length > 0

  // Always merge comparison data (shown as faint background line)
  const maxLen = Math.max(currentData.length, hasComp ? compData.length : 0)
  const mergedData = Array.from({ length: maxLen }, (_, i) => ({
    label: currentData[i]?.label ?? '',
    value: currentData[i]?.value ?? null,
    prev: hasComp ? (compData[i]?.value ?? null) : null,
  }))

  const currentTotal = sumValues(currentData)
  const compTotal = hasComp ? sumValues(compData) : 0
  const pctChange = compTotal > 0 ? Math.round(((currentTotal - compTotal) / compTotal) * 100) : null

  const tickInterval = range === '30D' ? Math.max(0, Math.floor(currentData.length / 8) - 1) : range === '24H' ? 2 : 0

  return (
    <div className="rounded-2xl relative overflow-hidden group" style={{ padding: '24px 24px 16px', background: 'var(--slate-750)', border: '1px solid var(--r-panel-border)' }}>
      {/* Decorative illustration — filled globe with data visualization */}
      <svg viewBox="0 0 400 350" fill="none" className="absolute -right-10 -top-10 w-[380px] h-[330px] opacity-[0.45] group-hover:opacity-[0.55] transition-opacity pointer-events-none" aria-hidden="true">
        <defs>
          <radialGradient id="globeGrad" cx="45%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#C9A70A" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#C9A70A" stopOpacity="0.03" />
          </radialGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A70A" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#C9A70A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Large filled globe */}
        <circle cx="240" cy="140" r="110" fill="url(#globeGrad)" />
        <circle cx="240" cy="140" r="110" stroke="#C9A70A" strokeWidth="1.5" opacity="0.12" />
        {/* Globe grid lines */}
        <ellipse cx="240" cy="140" rx="110" ry="44" stroke="#C9A70A" strokeWidth="0.8" opacity="0.08" />
        <ellipse cx="240" cy="140" rx="80" ry="110" stroke="#C9A70A" strokeWidth="0.8" opacity="0.06" />
        <ellipse cx="240" cy="140" rx="44" ry="110" stroke="#C9A70A" strokeWidth="0.8" opacity="0.05" />

        {/* Filled continents / land masses (abstract shapes) */}
        <path d="M195 80c10-5 30-8 45 0s20 25 10 35-25 5-35 0-25-30-20-35z" fill="#C9A70A" opacity="0.12" />
        <path d="M270 110c8 0 20 10 22 25s-5 30-18 28-20-15-18-28 6-25 14-25z" fill="#C9A70A" opacity="0.1" />
        <path d="M200 150c5-3 18-2 22 8s0 22-10 22-18-8-18-18 2-10 6-12z" fill="#C9A70A" opacity="0.08" />

        {/* Pulse marker — main location */}
        <circle cx="215" cy="120" r="6" fill="#C9A70A" opacity="0.35" />
        <circle cx="215" cy="120" r="12" stroke="#C9A70A" strokeWidth="1.5" opacity="0.15" />
        <circle cx="215" cy="120" r="20" stroke="#C9A70A" strokeWidth="1" opacity="0.08" />
        <circle cx="215" cy="120" r="28" stroke="#C9A70A" strokeWidth="0.5" opacity="0.04" />

        {/* Secondary markers */}
        <circle cx="275" cy="100" r="4" fill="#C9A70A" opacity="0.2" />
        <circle cx="260" cy="170" r="3.5" fill="#C9A70A" opacity="0.15" />
        <circle cx="195" cy="165" r="3" fill="#C9A70A" opacity="0.12" />

        {/* Connection lines between markers */}
        <path d="M215 120L275 100" stroke="#C9A70A" strokeWidth="0.8" opacity="0.08" strokeDasharray="4 3" />
        <path d="M215 120L260 170" stroke="#C9A70A" strokeWidth="0.8" opacity="0.06" strokeDasharray="4 3" />

        {/* Rising area chart overlay */}
        <path d="M30 290L80 260L130 275L180 230L230 200L280 170L330 140L370 110" stroke="#C9A70A" strokeWidth="2.5" opacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 290L80 260L130 275L180 230L230 200L280 170L330 140L370 110L370 310L30 310Z" fill="url(#areaGrad)" />

        {/* Chart dots */}
        <circle cx="80" cy="260" r="4" fill="#C9A70A" opacity="0.2" />
        <circle cx="180" cy="230" r="4" fill="#C9A70A" opacity="0.2" />
        <circle cx="280" cy="170" r="5" fill="#C9A70A" opacity="0.25" />
        <circle cx="370" cy="110" r="5" fill="#C9A70A" opacity="0.3" />

        {/* Floating bar chart (small, bottom-left) */}
        <rect x="40" y="270" width="14" height="30" rx="3" fill="#C9A70A" opacity="0.08" />
        <rect x="60" y="255" width="14" height="45" rx="3" fill="#C9A70A" opacity="0.1" />
        <rect x="80" y="240" width="14" height="60" rx="3" fill="#C9A70A" opacity="0.12" />
      </svg>

      {/* Header */}
      <div className="flex items-start justify-between mb-2 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-nw-100" style={{ fontSize: 16, fontWeight: 600 }}>
              Site Traffic
            </h3>
            <span className="text-nw-500" style={{ fontSize: 12 }}>
              {RANGE_LABELS[range]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-brand text-nw-100" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>
              {currentTotal.toLocaleString()}
            </span>
            {pctChange !== null && (
              <span
                className="rounded-md font-semibold"
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  background: pctChange >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: pctChange >= 0 ? '#4ade80' : '#f87171',
                }}
              >
                {pctChange >= 0 ? '+' : ''}{pctChange}%
              </span>
            )}
            {hasComp && (
              <span className="text-nw-500" style={{ fontSize: 12 }}>
                vs {compTotal.toLocaleString()} {COMP_LABELS[range]}
              </span>
            )}
          </div>
        </div>

        {/* Range tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-nw-800 border border-[rgba(255,255,255,0.06)]">
          {(['24H', '7D', '30D', '1Y'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="rounded-lg transition-all duration-200"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                background: range === r ? 'rgba(201,167,10,0.15)' : 'transparent',
                color: range === r ? '#C9A70A' : 'rgba(255,255,255,0.4)',
                border: range === r ? '1px solid rgba(201,167,10,0.25)' : '1px solid transparent',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-nw-400" style={{ fontSize: 11 }}>
          <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: '#C9A70A' }} />
          {RANGE_LABELS[range]}
        </span>
        {hasComp && (
          <span className="flex items-center gap-1.5 text-nw-500" style={{ fontSize: 11 }}>
            <span className="inline-block w-3 h-[2px] rounded-full opacity-50" style={{ background: '#8b5cf6' }} />
            Previous period
          </span>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A70A" stopOpacity={0.35} />
              <stop offset="60%" stopColor="#C9A70A" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#C9A70A" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#0d1117',
              border: '1px solid rgba(201,167,10,0.2)',
              borderRadius: '12px',
              color: '#edf3fb',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              fontSize: 13,
              padding: '10px 14px',
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}
            itemStyle={{ fontWeight: 600, padding: '2px 0' }}
            cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
          />
          {/* Previous period — always shown as faint background */}
          {hasComp && (
            <Area
              type="monotone"
              dataKey="prev"
              name={`Previous (${COMP_LABELS[range]})`}
              stroke="#8b5cf6"
              strokeWidth={1.5}
              strokeOpacity={0.35}
              fill="url(#prevGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#0d1117', strokeWidth: 2 }}
              connectNulls
            />
          )}
          {/* Current period — bold main line */}
          <Area
            type="monotone"
            dataKey="value"
            name={RANGE_LABELS[range]}
            stroke="#C9A70A"
            strokeWidth={3}
            fill="url(#goldGradient)"
            dot={currentData.length <= 12 ? { fill: '#C9A70A', strokeWidth: 2, stroke: '#0d1117', r: 5 } : false}
            activeDot={{ r: 7, fill: '#C9A70A', stroke: '#0d1117', strokeWidth: 3 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
