import { PageHeader } from '@/components/layout/PageHeader'
import { CalendarClient } from './CalendarClient'

export const metadata = { title: 'Calendar — NW Hub' }

export default function CalendarPage() {
  return (
    <>
      {/* Mobile: simple message */}
      <div className="lg:hidden flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6 text-center">
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--r-gold-400)" strokeWidth="1.5">
            <rect x="3" y="4" width="14" height="13" rx="2"/>
            <path d="M7 2v4M13 2v4M3 9h14"/>
          </svg>
        </div>
        <p style={{ fontSize: 14, color: 'var(--slate-300)', fontWeight: 500 }}>Calendar is best viewed on desktop</p>
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex flex-col bg-nw-900" style={{ height: '100%' }}>
        <main className="page-pad flex flex-col gap-5 py-5" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <PageHeader eyebrow="Admin Panel" title="Training" titleGold="Calendar" description="Trials, events and upcoming sessions at a glance." />
          <CalendarClient />
        </main>
      </div>
    </>
  )
}
