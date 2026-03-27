import { LucideIcon } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { SkeletonTable } from './Skeleton'

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">{children}</th>
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-300 ${className ?? ''}`}>{children}</td>
}

export function TrRow({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <tr onClick={onClick} className={`transition-colors hover:bg-[rgba(255,255,255,0.03)] ${onClick ? 'cursor-pointer' : ''}`}>{children}</tr>
}

interface Column<T> {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  emptyIcon?: LucideIcon
  emptyAction?: { label: string; href: string }
  keyField?: keyof T
  loading?: boolean
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No results',
  emptyIcon,
  emptyAction,
  keyField = 'id' as keyof T,
  loading = false,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--r-panel-border)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--r-panel-border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider ${col.className ?? ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonTable rows={5} columns={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                {emptyIcon ? (
                  <EmptyState icon={emptyIcon} title={emptyMessage} action={emptyAction} />
                ) : (
                  <p className="px-4 py-12 text-center text-white/30">{emptyMessage}</p>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String(row[keyField]) || i}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors border-l-2 border-l-transparent last:border-b-0 ${
                  onRowClick
                    ? 'cursor-pointer hover:border-l-[#967705]/30'
                    : 'hover:border-l-[#967705]/20'
                }`}
              style={{ borderBottom: '1px solid var(--r-panel-border)', ...(onRowClick ? {} : {}) }}
              onMouseEnter={onRowClick ? (e) => { (e.currentTarget as HTMLElement).style.background = 'var(--r-panel-bg)' } : undefined}
              onMouseLeave={onRowClick ? (e) => { (e.currentTarget as HTMLElement).style.background = '' } : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-white/80 ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
