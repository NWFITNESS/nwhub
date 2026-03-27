'use client'

import type { ReactNode } from 'react'

type StatusColor = 'green' | 'amber' | 'red' | 'blue' | 'gray'

interface CardRowProps {
  initials: string
  name: string
  secondary?: string
  meta?: string
  status?: StatusColor
  date?: string
  isNew?: boolean
  onClick?: () => void
  actions?: ReactNode
}

const statusColors: Record<StatusColor, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red:   'bg-red-500',
  blue:  'bg-blue-500',
  gray:  'bg-[#444]',
}

function getInitialsBg(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#1e3a2f', '#1e2a3a', '#2a1e3a', '#3a2a1e', '#1e3a3a', '#2a1e2a']
  return colors[Math.abs(hash) % colors.length]
}

export function CardRow({
  initials,
  name,
  secondary,
  meta,
  status,
  date,
  isNew,
  onClick,
  actions,
}: CardRowProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 min-h-[64px] border-b border-[#1a1a1a] active:bg-[#1a1a1a] transition-colors ${isNew ? 'bg-[#0f0c00] border-l-2 border-l-[#3a2e00]' : ''} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-semibold text-white/80"
        style={{ background: getInitialsBg(name) }}
      >
        {initials.slice(0, 2).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 py-3 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-white truncate">{name}</span>
          {isNew && (
            <span className="flex-shrink-0 text-[10px] font-semibold text-[#e0c97f] bg-[#2a2000] border border-[#4a3800] rounded-full px-1.5 py-0.5">
              NEW
            </span>
          )}
        </div>
        {secondary && (
          <p className="text-[12px] text-[#888] truncate mt-0.5">{secondary}</p>
        )}
        {meta && (
          <p className="text-[11px] text-[#555] truncate mt-0.5">{meta}</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {status && (
          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
        )}
        {date && (
          <span className="text-[11px] text-[#555]">{date}</span>
        )}
        {actions}
      </div>
    </div>
  )
}
