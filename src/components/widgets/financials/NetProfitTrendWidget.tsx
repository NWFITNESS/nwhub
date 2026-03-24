'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TOOLTIP_STYLE = {
  background: '#1a1a1a',
  border: '1px solid rgba(201,167,10,0.3)',
  borderRadius: '8px',
  color: '#F0F0F0',
}
const AXIS_TICK = { fill: 'rgba(255,255,255,0.3)', fontSize: 11 }

interface MonthlyPoint {
  label: string
  profit: number
}

interface Props {
  data: MonthlyPoint[]
}

export function NetProfitTrendWidget({ data }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="profitGradW" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, 'Profit']} />
            <Area type="monotone" dataKey="profit" stroke="#22C55E" strokeWidth={2} fill="url(#profitGradW)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
