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
      className="bg-[#161616] border border-white/[0.06] rounded-xl flex flex-col h-full overflow-hidden"
      style={isCustomising ? { outline: '1px dashed rgba(212,175,55,0.15)' } : undefined}
    >
      {hasHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {isCustomising && (
              <div className="widget-drag-handle cursor-grab active:cursor-grabbing text-white/20 hover:text-white/50 transition-colors flex-shrink-0">
                <GripVertical size={16} />
              </div>
            )}
            <div className="min-w-0">
              {subtitle && (
                <p className="text-[10px] font-semibold text-[#967705] uppercase tracking-[0.15em] mb-0.5">
                  {subtitle}
                </p>
              )}
              {title && (
                <h3 className="text-[#F0F0F0] font-semibold truncate">{title}</h3>
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
