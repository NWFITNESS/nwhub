'use client'

import { useState, createContext, useContext } from 'react'
import { Menu, Bell } from 'lucide-react'
import { Sidebar } from './Sidebar'
import NeuralBackground from '@/components/ui/flow-field-background'
import { BottomTabBar } from '@/components/mobile/BottomTabBar'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  return (
    <SidebarCtx.Provider value={{ mobileMenuOpen, setMobileMenuOpen, isMobileView, setIsMobileView }}>

      {/* ── Particle background ── */}
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <NeuralBackground color="#d4af37" trailOpacity={0.06} particleCount={380} speed={0.4} />
      </div>

      {/* ── App shell ── */}
      <div className="flex h-screen overflow-hidden">

        {/* ── Desktop sidebar — self-contained hover expand ── */}
        <div className="hidden lg:block flex-shrink-0 h-full">
          <Sidebar unreadCount={unreadCount} userEmail={userEmail} />
        </div>

        {/* ── Mobile drawer ── */}
        <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            onToggle={() => setMobileMenuOpen(false)}
            unreadCount={unreadCount}
            userEmail={userEmail}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* ── Mobile backdrop ── */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Mobile topbar */}
          <div
            className="flex lg:hidden items-center justify-between px-4 h-14 flex-shrink-0 border-b"
            style={{ background: 'var(--slate-950)', borderColor: 'var(--r-panel-border)' }}
          >
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
              style={{ color: 'var(--slate-400)' }}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div style={{
                width: 26, height: 26,
                background: 'linear-gradient(140deg, var(--r-gold-500), var(--r-gold-300))',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
                fontWeight: 700, fontSize: 11, color: 'var(--slate-950)',
              }}>NW</div>
              <span style={{
                fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
                fontSize: 14, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', color: 'var(--slate-300)',
              }}>NW HUB</span>
            </div>
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--slate-400)' }}
            >
              <Bell size={18} />
            </button>
          </div>

          {/* Scrollable page content */}
          <div className="flex-1 overflow-y-auto @container/page pb-[calc(56px+env(safe-area-inset-bottom))] lg:pb-0">
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

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar />

    </SidebarCtx.Provider>
  )
}
