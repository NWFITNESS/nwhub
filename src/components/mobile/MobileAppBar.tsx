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
    <div className="lg:hidden sticky top-0 z-20 flex items-center h-14 bg-[#111] border-b border-[#1e1e1e] px-3 gap-2 flex-shrink-0">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 active:bg-white/[0.06] flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span
          className="text-[15px] font-medium text-white truncate"
          style={{ fontFamily: 'Rajdhani, League Spartan, sans-serif' }}
        >
          {title}
        </span>
        {count != null && count > 0 && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2a2000] border border-[#4a3800] text-[#e0c97f]">
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
