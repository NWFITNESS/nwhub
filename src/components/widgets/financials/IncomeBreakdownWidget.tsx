'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { PoundSterling } from 'lucide-react'

const TOOLTIP_STYLE = {
  background: '#1a1a1a',
  border: '1px solid rgba(201,167,10,0.3)',
  borderRadius: '8px',
  color: '#F0F0F0',
}

const PIE_COLOURS = ['#C9A70A', '#3B82F6', '#22C55E', '#A855F7', '#F97316', '#EC4899']

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
        <PoundSterling size={24} className="text-white/20" />
        <p className="text-xs text-white/30">No breakdown available</p>
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
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`£${Number(value).toLocaleString()}`, '']} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-2 overflow-y-auto flex-1">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLOURS[i % PIE_COLOURS.length] }} />
              <span className="text-xs text-white/50 truncate">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-[#F0F0F0] flex-shrink-0 ml-2">£{item.amount.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
