'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

interface MobileAppBarProps {
  title: string
  count?: number
  showBack?: boolean
  actions?: ReactNode
}

export function MobileAppBar({ title, count, showBack, actions }: MobileAppBarProps) {
  const router = useRouter()

  return (
    <div className="lg:hidden sticky top-0 z-20 flex items-center h-14 bg-nw-950 border-b border-[rgba(255,255,255,0.09)] px-3 gap-2 flex-shrink-0">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-nw-400 active:bg-nw-800 flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-[15px] font-brand font-medium text-nw-200 truncate">
          {title}
        </span>
        {count != null && count > 0 && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.28)] text-gold-300">
            {count}
          </span>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
