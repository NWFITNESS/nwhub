'use client'

import { ChevronLeft, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { NWHubIcon } from '@/components/NWHubIcon'
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
    <header className="flex md:hidden h-12 flex-shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-4">
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-nw-400 active:bg-nw-800 flex-shrink-0"
        >
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div className="w-9" />
      )}

      <div className="flex items-center gap-2">
        <NWHubIcon size={22} />
        <span className="font-brand text-sm font-bold uppercase tracking-[1.5px] text-white">
          {title}
        </span>
        {count != null && count > 0 && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.28)] text-gold-300">
            {count}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {actions ?? (
          <button className="w-9 h-9 flex items-center justify-center rounded-lg text-nw-400">
            <Bell size={18} />
          </button>
        )}
      </div>
    </header>
  )
}
