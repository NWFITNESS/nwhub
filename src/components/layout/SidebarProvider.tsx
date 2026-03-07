'use client'

import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Sidebar } from './Sidebar'
import NeuralBackground from '@/components/ui/flow-field-background'

interface SidebarProviderProps {
  children: React.ReactNode
  unreadCount?: number
  userEmail?: string
}

// Tab is w-5 (20px). Gap is 2.5rem (40px) past the sidebar edge.
// Content margin = sidebar-w + gap, so tab never touches content.
const GAP = '2.5rem'

export function SidebarProvider({ children, unreadCount = 0, userEmail }: SidebarProviderProps) {
  const [open, setOpen] = useState(true)

  return (
    <>
      {/* Full-screen particle flow field — wrapper owns the positioning */}
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <NeuralBackground
          color="#967705"
          trailOpacity={0.08}
          particleCount={450}
          speed={0.5}
        />
      </div>

      <Sidebar
        open={open}
        onToggle={() => setOpen((o) => !o)}
        unreadCount={unreadCount}
        userEmail={userEmail}
      />

      {/* Toggle tab — sits at sidebar edge, gap keeps it clear of content */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        className="fixed z-50 top-20 h-14 w-5 flex items-center justify-center bg-[#1a1a1a] border border-white/[0.1] rounded-r-lg hover:bg-[#222] hover:border-[#967705]/40 transition-all duration-300 ease-in-out"
        style={{ left: open ? 'var(--sidebar-w)' : '0' }}
      >
        <ChevronLeft
          size={13}
          className={`text-white/50 transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
        />
      </button>

      {/* Main content */}
      <div
        className="relative min-h-screen transition-all duration-300 ease-in-out"
        style={{
          marginLeft: open ? `calc(var(--sidebar-w) + ${GAP})` : '0',
          paddingRight: '10mm',
        }}
      >
        {children}
      </div>
    </>
  )
}
