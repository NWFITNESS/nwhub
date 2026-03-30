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
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <Th key={col.key}>
                <span className={col.className ?? ''}>{col.label}</span>
              </Th>
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
                  <p className="px-4 py-12 text-center text-nw-500">{emptyMessage}</p>
                )}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <TrRow
                key={String(row[keyField]) || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <Td key={col.key} className={col.className}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </Td>
                ))}
              </TrRow>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
