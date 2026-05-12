'use client'

import { Badge } from '@/components/ui/Badge'

interface BankTxn {
  date?: string
  contact?: string
  reference?: string
  amount?: number
  type?: 'IN' | 'OUT'
}

function parseXeroDate(xeroDate?: string): Date | null {
  if (!xeroDate) return null
  const match = xeroDate.match(/\/Date\((\d+)([+-]\d+)?\)\//)
  if (match) return new Date(parseInt(match[1]))
  return new Date(xeroDate)
}

function formatDate(xeroDate?: string): string {
  const d = parseXeroDate(xeroDate)
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  transactions: BankTxn[]
}

export function BankTransactionsWidget({ transactions }: Props) {
  return (
    <div className="w-full overflow-x-auto h-full">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <th className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Contact</th>
            <th className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Reference</th>
            <th className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Date</th>
            <th className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Type</th>
            <th className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-right text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-nw-500">No transactions found</td>
            </tr>
          ) : (
            transactions.map((txn, i) => (
              <tr key={i} className="transition-colors hover:bg-[rgba(255,255,255,0.03)]">
                <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-200">{txn.contact}</td>
                <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-400">{txn.reference}</td>
                <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-xs font-medium text-nw-400">{formatDate(txn.date)}</td>
                <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                  <Badge variant={txn.type === 'IN' ? 'active' : 'danger'}>
                    {txn.type === 'IN' ? 'Income' : 'Expense'}
                  </Badge>
                </td>
                <td className={`border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-right font-medium ${txn.type === 'IN' ? 'text-[#22c55e]' : 'text-red-400'}`}>
                  {txn.type === 'OUT' ? '-' : ''}£{(txn.amount ?? 0).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
