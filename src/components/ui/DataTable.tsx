'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { ColumnToggle } from '@/components/ui/ColumnToggle'
import { useColumnVisibility } from '@/lib/use-column-visibility'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DataColumn<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  /** Return a string value used for search matching */
  searchValue?: (row: T) => string
  /** Return a sortable primitive */
  sortValue?: (row: T) => string | number
  sortable?: boolean
  /** Allow this column to be toggled on/off (default true) */
  hideable?: boolean
}

export interface DataTableProps<T> {
  /** Unique id used to persist column visibility in localStorage */
  tableId: string
  columns: DataColumn<T>[]
  data: T[]
  /** Unique key for each row */
  rowKey: (row: T) => string
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Render extra controls beside search / column toggle */
  toolbar?: ReactNode
  /** Custom empty-state node — falls back to a simple message */
  emptyState?: ReactNode
  /** Text shown when no rows match (default "No results") */
  emptyText?: string
  /** Page size for pagination. 0 = show all (default 0) */
  pageSize?: number
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
  tableId,
  columns,
  data,
  rowKey,
  onRowClick,
  searchPlaceholder = 'Search…',
  toolbar,
  emptyState,
  emptyText = 'No results',
  pageSize = 0,
}: DataTableProps<T>) {
  /* Column visibility */
  const hideableCols = columns.filter((c) => c.hideable !== false)
  const { visible, toggle } = useColumnVisibility(
    tableId,
    hideableCols.map((c) => c.key),
  )
  const visibleColumns = columns.filter(
    (c) => c.hideable === false || visible.has(c.key),
  )

  /* Search */
  const [search, setSearch] = useState('')

  /* Sort */
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function handleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  /* Pagination */
  const [page, setPage] = useState(0)

  /* Derived rows */
  const rows = useMemo(() => {
    let result = [...data]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((row) =>
        columns.some((col) => {
          const sv = col.searchValue?.(row)
          return sv && sv.toLowerCase().includes(q)
        }),
      )
    }

    // Sort
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col?.sortValue) {
        result.sort((a, b) => {
          const aVal = col.sortValue!(a)
          const bVal = col.sortValue!(b)
          if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
          if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
          return 0
        })
      }
    }

    return result
  }, [data, search, sortKey, sortDir, columns])

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1
  const safePage = Math.min(page, totalPages - 1)
  const pagedRows = pageSize > 0 ? rows.slice(safePage * pageSize, (safePage + 1) * pageSize) : rows

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          placeholder={searchPlaceholder}
          className="h-11 w-full md:h-8 md:w-52 rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 text-[13px] text-nw-200 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)]"
          style={{ padding: '0 10px' }}
        />
        <div className="flex items-center gap-2 w-full md:w-auto">
          {toolbar}
          {hideableCols.length > 0 && (
            <div className="hidden md:block">
              <ColumnToggle
                columns={hideableCols.map((c) => ({ key: c.key, label: c.label }))}
                visible={visible}
                onToggle={toggle}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile: card list (no horizontal scroll) */}
      <div className="md:hidden flex flex-col gap-2">
        {pagedRows.length === 0 ? (
          <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-nw-800 text-center text-nw-500" style={{ padding: '40px 16px', fontSize: 13 }}>
            {emptyState ?? emptyText}
          </div>
        ) : (
          pagedRows.map((row) => (
            <div
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`rounded-xl border border-[rgba(255,255,255,0.07)] bg-nw-800 transition-colors ${onRowClick ? 'cursor-pointer active:bg-white/[0.03]' : ''}`}
              style={{ padding: 12 }}
            >
              {visibleColumns.map((col, i) => (
                i === 0 ? (
                  <div key={col.key} className="text-nw-100" style={{ fontSize: 14, fontWeight: 600, marginBottom: visibleColumns.length > 1 ? 8 : 0 }}>
                    {col.render(row)}
                  </div>
                ) : (
                  <div key={col.key} className="flex items-start justify-between gap-3" style={{ padding: '4px 0' }}>
                    <span className="text-nw-500 uppercase shrink-0" style={{ fontSize: 10, letterSpacing: '0.5px', fontWeight: 600, paddingTop: 1 }}>{col.label}</span>
                    <span className="text-nw-200 text-right min-w-0" style={{ fontSize: 13 }}>{col.render(row)}</span>
                  </div>
                )
              ))}
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-[rgba(255,255,255,0.07)] text-left text-xs font-semibold uppercase tracking-[1.2px] text-white/30"
                  style={{ padding: '10px 16px' }}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1 hover:text-nw-300 transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ArrowUp size={11} className="text-gold-400" /> : <ArrowDown size={11} className="text-gold-400" />
                      ) : (
                        <ArrowUpDown size={11} className="text-nw-600" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} style={{ padding: '48px 16px' }} className="text-center text-nw-500">
                  {emptyState ?? emptyText}
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-[rgba(255,255,255,0.04)] transition-colors hover:bg-white/[0.02] ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {visibleColumns.map((col) => (
                    <td key={col.key} className="text-nw-200" style={{ padding: '12px 16px' }}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-3" style={{ padding: '0 4px' }}>
          <span className="text-xs text-nw-500">
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-1">
            <button
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-[6px] border border-[rgba(255,255,255,0.08)] text-xs font-medium text-nw-400 transition-colors hover:text-nw-200 hover:border-[rgba(255,255,255,0.15)] disabled:opacity-30 disabled:pointer-events-none"
              style={{ padding: '4px 10px' }}
            >
              Prev
            </button>
            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-[6px] border border-[rgba(255,255,255,0.08)] text-xs font-medium text-nw-400 transition-colors hover:text-nw-200 hover:border-[rgba(255,255,255,0.15)] disabled:opacity-30 disabled:pointer-events-none"
              style={{ padding: '4px 10px' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
