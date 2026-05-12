'use client'

interface Props {
  yearIncome: number
  yearExpenses: number
  yearProfit: number
}

export function YearOverviewWidget({ yearIncome, yearExpenses, yearProfit }: Props) {
  return (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.07)]">
          <span className="text-[13px] text-nw-400">Total Income</span>
          <span className="text-[13px] font-medium text-[#22c55e]">£{yearIncome.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.07)]">
          <span className="text-[13px] text-nw-400">Total Expenses</span>
          <span className="text-[13px] font-medium text-red-400">£{yearExpenses.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-3">
          <span className="text-[13px] font-medium text-nw-200">Net Profit</span>
          <span className={`text-[13px] font-bold ${yearProfit >= 0 ? 'text-gold-300' : 'text-red-400'}`}>
            £{yearProfit.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
