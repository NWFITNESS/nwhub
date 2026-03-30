'use client'

import { useState, createContext, useContext } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileAppBar } from '@/components/mobile/MobileAppBar'
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
      <div className="flex h-screen min-h-[600px] overflow-hidden bg-nw-900">
        {/* Desktop sidebar */}
        <Sidebar unreadCount={unreadCount} userEmail={userEmail} />

        {/* Mobile sidebar drawer */}
        <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            onToggle={() => setMobileMenuOpen(false)}
            unreadCount={unreadCount}
            userEmail={userEmail}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar />
          <MobileAppBar title="NW Hub" />

          <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-[22px_24px] md:pb-[22px]">
            {isMobileView ? (
              <div className="flex justify-center bg-nw-950 min-h-full pt-6 px-4">
                <div className="w-[390px] bg-nw-900 min-h-[844px] rounded-[2rem] border border-[rgba(255,255,255,0.1)] overflow-hidden shadow-2xl">
                  {children}
                </div>
              </div>
            ) : (
              children
            )}
          </main>

          <BottomTabBar />
        </div>
      </div>
    </SidebarCtx.Provider>
  )
}
