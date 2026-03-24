'use client'

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
    <div className="overflow-x-auto h-full">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.04]">
            <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Contact</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Reference</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Date</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Type</th>
            <th className="text-right px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-[0.1em]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-sm text-white/30">No transactions found</td>
            </tr>
          ) : (
            transactions.map((txn, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 text-sm text-[#F0F0F0]">{txn.contact}</td>
                <td className="px-5 py-4 text-sm text-white/50">{txn.reference}</td>
                <td className="px-5 py-4 text-sm text-white/50">{formatDate(txn.date)}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    txn.type === 'IN'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {txn.type === 'IN' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td className={`px-5 py-4 text-sm font-semibold text-right ${txn.type === 'IN' ? 'text-green-400' : 'text-red-400'}`}>
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
