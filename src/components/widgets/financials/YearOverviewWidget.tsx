'use client'

interface Props {
  yearIncome: number
  yearExpenses: number
  yearProfit: number
}

export function YearOverviewWidget({ yearIncome, yearExpenses, yearProfit }: Props) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <span className="text-sm text-white/50">Total Income</span>
          <span className="text-sm font-semibold text-green-400">£{yearIncome.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
          <span className="text-sm text-white/50">Total Expenses</span>
          <span className="text-sm font-semibold text-red-400">£{yearExpenses.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-semibold text-white/70">Net Profit</span>
          <span className={`text-sm font-bold ${yearProfit >= 0 ? 'text-[#C9A70A]' : 'text-red-400'}`}>
            £{yearProfit.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
