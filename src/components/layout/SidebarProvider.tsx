'use client'

import { useState, createContext, useContext } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileAppBar } from '@/components/mobile/MobileAppBar'
import { BottomTabBar } from '@/components/mobile/BottomTabBar'
import { MobileMenuSheet } from '@/components/mobile/MobileMenuSheet'
import { ScheduledCampaignPopup } from '@/components/dashboard/ScheduledCampaignPopup'
import type { StaffProfile } from '@/lib/staff'

// ── Shared context ─────────────────────────────────────────────────────────────

interface SidebarContextValue {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (v: boolean) => void
  staffProfile: StaffProfile | null
}

export const SidebarCtx = createContext<SidebarContextValue>({
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
  staffProfile: null,
})

export function useSidebarCtx() {
  return useContext(SidebarCtx)
}

// ── Component ──────────────────────────────────────────────────────────────────

interface SidebarProviderProps {
  children: React.ReactNode
  unreadCount?: number
  userEmail?: string
  staffProfile?: StaffProfile | null
}

export function SidebarProvider({ children, unreadCount = 0, userEmail, staffProfile = null }: SidebarProviderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <SidebarCtx.Provider value={{ mobileMenuOpen, setMobileMenuOpen, staffProfile }}>
      <div className="flex h-screen min-h-[600px] overflow-hidden bg-nw-900">
        {/* Desktop sidebar */}
        <Sidebar unreadCount={unreadCount} userEmail={userEmail} staffProfile={staffProfile} />

        {/* Mobile sidebar drawer */}
        <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            onToggle={() => setMobileMenuOpen(false)}
            unreadCount={unreadCount}
            userEmail={userEmail}
            staffProfile={staffProfile}
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
          <TopBar staffProfile={staffProfile} userEmail={userEmail} />
          <MobileAppBar />

          <main className="flex-1 overflow-y-auto nw-main-pad">
            {children}
          </main>

          <BottomTabBar unreadCount={unreadCount} />
          <MobileMenuSheet />
        </div>
      </div>

      {/* Scheduled campaign reminder popup */}
      <ScheduledCampaignPopup />
    </SidebarCtx.Provider>
  )
}
