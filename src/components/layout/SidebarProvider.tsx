'use client'

import { useState, createContext, useContext } from 'react'
import { ChevronLeft, Menu, X, Bell } from 'lucide-react'
import { Sidebar } from './Sidebar'
import NeuralBackground from '@/components/ui/flow-field-background'

// ── Shared context ─────────────────────────────────────────────────────────────

interface SidebarContextValue {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  isMobileView: boolean
  setIsMobileView: (v: boolean) => void
}

export const SidebarCtx = createContext<SidebarContextValue>({
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
  isMobileView: false,
  setIsMobileView: () => {},
})

export function useSidebarCtx() {
  return useContext(SidebarCtx)
}

// ── Component ──────────────────────────────────────────────────────────────────

interface SidebarProviderProps {
  children: React.ReactNode
  unreadCount?: number
  userEmail?: string
}

// Tab is w-5 (20px). Gap is 2.5rem (40px) past the sidebar edge.
const GAP = '2.5rem'

export function SidebarProvider({ children, unreadCount = 0, userEmail }: SidebarProviderProps) {
  const [open, setOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  return (
    <SidebarCtx.Provider value={{ mobileMenuOpen, setMobileMenuOpen, isMobileView, setIsMobileView }}>
      {/* Full-screen particle flow field */}
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <NeuralBackground
          color="#967705"
          trailOpacity={0.08}
          particleCount={450}
          speed={0.5}
        />
      </div>

      {/* ── Desktop sidebar (hidden on mobile via CSS) ── */}
      <Sidebar
        open={open}
        onToggle={() => setOpen((o) => !o)}
        unreadCount={unreadCount}
        userEmail={userEmail}
      />

      {/* ── Desktop toggle tab (hidden on mobile) ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        className="fixed z-50 top-20 h-14 w-5 hidden md:flex items-center justify-center
                   bg-[#1a1a1a] border border-white/[0.1] rounded-r-lg
                   hover:bg-[#222] hover:border-[#967705]/40
                   transition-all duration-300 ease-in-out"
        style={{ left: open ? 'var(--sidebar-w)' : '0' }}
      >
        <ChevronLeft
          size={13}
          className={`text-white/50 transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
        />
      </button>

      {/* ── Mobile topbar (hidden on desktop) ── */}
      <div className="flex md:hidden items-center justify-between px-4 h-14
                      bg-[#0d0d0d] border-b border-white/[0.06] sticky top-0 z-40">
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg
                     text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="flex items-center gap-2">
          <img src="/nw-logo.svg" alt="NW" className="w-7 h-7 object-contain" />
          <span className="text-sm font-bold text-white" style={{ fontFamily: 'Rajdhani' }}>
            Northern Warrior
          </span>
        </div>

        <button className="w-9 h-9 flex items-center justify-center rounded-lg
                           text-white/60 hover:text-white hover:bg-white/[0.06]">
          <Bell size={18} />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-[280px] z-50 md:hidden
                          bg-gradient-to-b from-[#131313] to-[#0d0d0d]
                          border-r border-white/[0.06] shadow-2xl
                          animate-in slide-in-from-left duration-200">
            <Sidebar
              open={true}
              onToggle={() => setMobileMenuOpen(false)}
              unreadCount={unreadCount}
              userEmail={userEmail}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </>
      )}

      {/* ── Main content ── */}
      <div
        className="main-content-area relative min-h-screen transition-all duration-300 ease-in-out"
        style={{
          marginLeft: open ? `calc(var(--sidebar-w) + ${GAP})` : '0',
          paddingRight: '10mm',
        }}
      >
        {isMobileView ? (
          <div className="flex justify-center bg-[#050505] min-h-screen pt-6 px-4">
            <div className="w-[390px] bg-[#080808] min-h-[844px] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </SidebarCtx.Provider>
  )
}
