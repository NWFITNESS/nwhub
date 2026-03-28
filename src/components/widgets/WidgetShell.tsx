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
      className={`rounded-xl flex flex-col h-full overflow-hidden bg-nw-750 border border-[rgba(255,255,255,0.11)] ${isCustomising ? 'outline outline-1 outline-dashed outline-gold-600/20' : ''}`}
    >
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 min-w-0">
            {isCustomising && (
              <div className="widget-drag-handle cursor-grab active:cursor-grabbing flex-shrink-0 text-nw-600">
                <GripVertical size={16} />
              </div>
            )}
            <div className="min-w-0">
              {subtitle && (
                <p className="text-[9px] font-semibold text-gold-500 uppercase tracking-[0.15em] mb-0.5">
                  {subtitle}
                </p>
              )}
              {title && (
                <h3 className="truncate text-sm font-semibold text-nw-100">{title}</h3>
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
