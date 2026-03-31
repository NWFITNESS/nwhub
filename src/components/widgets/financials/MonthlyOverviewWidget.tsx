'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const TOOLTIP_STYLE = {
  background: '#22293d',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 8,
  fontSize: 12,
}
const AXIS_TICK = { fill: '#8296b4', fontSize: 11 }

interface MonthlyPoint {
  label: string
  income: number
  expenses: number
  profit: number
}

interface Props {
  data: MonthlyPoint[]
}

export function MonthlyOverviewWidget({ data }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-nw-400">
          <div className="w-3 h-3 rounded-sm bg-[#e8b933]" /> Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-nw-400">
          <div className="w-4 h-0.5 bg-red-400" /> Expenses
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelStyle={{ color: '#d2deee' }}
              itemStyle={{ color: '#f2cb55' }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(value) => [`£${Number(value).toLocaleString()}`, '']}
            />
            <Bar dataKey="income" fill="#e8b933" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
