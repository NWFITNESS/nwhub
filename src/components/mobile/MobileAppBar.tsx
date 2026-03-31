'use client'

import { Bell } from 'lucide-react'
import { NWHubIcon } from '@/components/NWHubIcon'

interface MobileAppBarProps {
  title?: string
  count?: number
  showBack?: boolean
  actions?: React.ReactNode
}

export function MobileAppBar({ title = 'NW Hub' }: MobileAppBarProps) {
  return (
    <header className="flex md:hidden h-[52px] flex-shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-4 sticky top-0 z-40">
      <div style={{ width: 28 }} />

      <div className="flex items-center gap-2">
        <NWHubIcon size={26} animated />
        <span className="font-brand text-[13px] font-bold uppercase tracking-[1.5px] text-nw-200">
          {title}
        </span>
      </div>

      <button className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-nw-500">
        <Bell size={13} strokeWidth={1.7} />
      </button>
    </header>
  )
}
