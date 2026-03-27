'use client'

import { GripVertical, X } from 'lucide-react'

interface WidgetShellProps {
  id: string
  subtitle?: string
  title?: string
  isCustomising?: boolean
  onRemove?: (id: string) => void
  noPad?: boolean
  children: React.ReactNode
  headerRight?: React.ReactNode
}

export function WidgetShell({
  id,
  subtitle,
  title,
  isCustomising,
  onRemove,
  noPad,
  children,
  headerRight,
}: WidgetShellProps) {
  const hasHeader = subtitle || title || isCustomising

  return (
    <div
      className="rounded-xl flex flex-col h-full overflow-hidden"
      style={{
        background: 'var(--slate-750)', border: '1px solid var(--r-panel-border)',
        ...(isCustomising ? { outline: '1px dashed rgba(212,175,55,0.15)' } : {}),
      }}
    >
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--r-panel-border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            {isCustomising && (
              <div className="widget-drag-handle cursor-grab active:cursor-grabbing flex-shrink-0" style={{ color: 'var(--slate-600)' }}>
                <GripVertical size={16} />
              </div>
            )}
            <div className="min-w-0">
              {subtitle && (
                <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--r-gold-500)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>
                  {subtitle}
                </p>
              )}
              {title && (
                <h3 className="truncate" style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-100)' }}>{title}</h3>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {headerRight}
            {isCustomising && onRemove && (
              <button
                onClick={() => onRemove(id)}
                className="w-6 h-6 flex items-center justify-center rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`flex-1 overflow-hidden ${noPad ? '' : 'p-5'}`}>
        {children}
      </div>
    </div>
  )
}
