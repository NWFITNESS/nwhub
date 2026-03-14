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

export function SidebarProvider({ children, unreadCount = 0, userEmail }: SidebarProviderProps) {
  const [open, setOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  return (
    <SidebarCtx.Provider value={{ mobileMenuOpen, setMobileMenuOpen, isMobileView, setIsMobileView }}>

      {/* ── Particle background ── */}
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <NeuralBackground color="#967705" trailOpacity={0.08} particleCount={450} speed={0.5} />
      </div>

      {/* ── Mobile drawer — always in DOM, CSS slide animation ── */}
      <div
        className={`fixed inset-y-0 left-0 w-[280px] z-50 md:hidden
                    bg-gradient-to-b from-[#131313] to-[#0d0d0d]
                    border-r border-white/[0.06] shadow-2xl
                    transition-transform duration-300 ease-in-out
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar
          open={true}
          onToggle={() => setMobileMenuOpen(false)}
          unreadCount={unreadCount}
          userEmail={userEmail}
          onNavigate={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* ── Mobile backdrop ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Desktop toggle tab (desktop only, fixed) ── */}
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

      {/* ── App shell — flex row fills the screen ── */}
      <div className="flex h-screen overflow-hidden">

        {/* Desktop sidebar — hidden on mobile, in flex flow on desktop */}
        <div
          className={`hidden flex-shrink-0 flex-col overflow-hidden transition-all duration-300 ease-in-out ${open ? 'md:flex' : ''}`}
          style={{ width: 'var(--sidebar-w)' }}
        >
          <Sidebar
            open={open}
            onToggle={() => setOpen((o) => !o)}
            unreadCount={unreadCount}
            userEmail={userEmail}
          />
        </div>

        {/* Main column — full width on mobile, remainder on desktop */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Mobile topbar (hidden on desktop) */}
          <div className="flex md:hidden items-center justify-between px-4 h-14 flex-shrink-0
                          bg-[#0d0d0d] border-b border-white/[0.06]">
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

          {/* Scrollable page content */}
          <div className="flex-1 overflow-y-auto">
            {isMobileView ? (
              <div className="flex justify-center bg-[#050505] min-h-full pt-6 px-4">
                <div className="w-[390px] bg-[#080808] min-h-[844px] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
                  {children}
                </div>
              </div>
            ) : (
              children
            )}
          </div>

        </div>
      </div>

    </SidebarCtx.Provider>
  )
}
