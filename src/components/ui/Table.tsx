import { LucideIcon } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { SkeletonTable } from './Skeleton'

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
    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
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
                className={`border-b border-white/[0.04] last:border-0 transition-colors border-l-2 border-l-transparent ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-white/[0.03] hover:border-l-[#967705]/30'
                    : 'hover:border-l-[#967705]/20'
                }`}
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
