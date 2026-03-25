'use client'

import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { Menu, Bell } from 'lucide-react'
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
  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function handleMouseEnter() {
    clearTimeout(closeTimer.current)
    setDesktopOpen(true)
  }

  function handleMouseLeave() {
    closeTimer.current = setTimeout(() => setDesktopOpen(false), 200)
  }

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  return (
    <SidebarCtx.Provider value={{ mobileMenuOpen, setMobileMenuOpen, isMobileView, setIsMobileView }}>

      {/* ── Particle background ── */}
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <NeuralBackground color="#d4af37" trailOpacity={0.06} particleCount={380} speed={0.4} />
      </div>

      {/* ── App shell ── */}
      <div className="flex h-screen overflow-hidden">

        {/* ── Desktop sidebar ──
            Outer div clips and transitions width.
            Inner div is always full 256 px so content never squashes. ── */}
        <div
          className="hidden md:flex flex-shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{ width: desktopOpen ? '256px' : '64px' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="h-full w-64 flex-shrink-0">
            <Sidebar
              open={desktopOpen}
              unreadCount={unreadCount}
              userEmail={userEmail}
            />
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Mobile topbar */}
          <div className="flex md:hidden items-center justify-between px-4 h-14 flex-shrink-0 bg-[#131313] border-b border-white/[0.06]">
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <img src="/nw-logo.svg" alt="NW" className="w-7 h-7 object-contain" />
              <span className="text-sm font-bold text-white" style={{ fontFamily: 'Rajdhani' }}>
                Northern Warrior
              </span>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/[0.06]">
              <Bell size={18} />
            </button>
          </div>

          {/* Scrollable page content */}
          <div className="flex-1 overflow-y-auto @container/page">
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
