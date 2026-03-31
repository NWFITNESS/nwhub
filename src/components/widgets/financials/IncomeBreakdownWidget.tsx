'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { PoundSterling } from 'lucide-react'

const TOOLTIP_STYLE = {
  background: '#22293d',
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 8,
  fontSize: 12,
}

const PIE_COLOURS = ['#e8b933', '#f2cb55', '#d4a017', '#b8870f', '#f8df8a', '#fdf4d4']

interface IncomeAccount {
  name: string
  amount: number
}

interface Props {
  data: IncomeAccount[]
}

export function IncomeBreakdownWidget({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <PoundSterling size={24} className="text-nw-600" />
        <p className="text-xs text-nw-500">No breakdown available</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
            dataKey="amount" nameKey="name" paddingAngle={3}>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLOURS[i % PIE_COLOURS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#d2deee' }} itemStyle={{ color: '#f2cb55' }} formatter={(value) => [`£${Number(value).toLocaleString()}`, '']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-2 overflow-y-auto flex-1">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLOURS[i % PIE_COLOURS.length] }} />
              <span className="text-xs text-nw-400 truncate">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-nw-200 flex-shrink-0 ml-2">£{item.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
