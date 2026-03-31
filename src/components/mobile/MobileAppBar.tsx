'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, Inbox, Mail, FileText, Clock, Zap, MessageSquare } from 'lucide-react'
import { NWHubIcon } from '@/components/NWHubIcon'

const NOTIFICATION_CHANNELS = [
  { key: 'enquiries',      label: 'New Enquiries',      desc: 'When someone submits a contact form',    icon: Inbox },
  { key: 'emails',         label: 'Inbound Emails',     desc: 'Gmail inbox intelligence alerts',         icon: Mail },
  { key: 'todo',           label: 'To-Do Reminders',    desc: 'Task due dates and assignments',          icon: FileText },
  { key: 'morning_digest', label: 'Morning Digest',     desc: 'Daily summary at 8am',                   icon: Clock },
  { key: 'workflows',      label: 'Workflow Triggers',  desc: 'When automations fire or fail',           icon: Zap },
  { key: 'reviews',        label: 'Google Reviews',     desc: 'New reviews detected for your business',  icon: MessageSquare },
]

interface MobileAppBarProps {
  title?: string
  count?: number
  showBack?: boolean
  actions?: React.ReactNode
}

export function MobileAppBar({ title = 'NW Hub' }: MobileAppBarProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const [notifSettings, setNotifSettings] = useState<Record<string, { desktop: boolean; mobile: boolean }>>({})
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nw-notifications')
      if (saved) setNotifSettings(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (Object.keys(notifSettings).length > 0) {
      localStorage.setItem('nw-notifications', JSON.stringify(notifSettings))
    }
  }, [notifSettings])

  function toggleNotif(key: string, type: 'desktop' | 'mobile') {
    setNotifSettings(prev => {
      const current = prev[key] ?? { desktop: false, mobile: false }
      return { ...prev, [key]: { ...current, [type]: !current[type] } }
    })
  }

  return (
    <>
      <header className="flex md:hidden h-[52px] flex-shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-4 sticky top-0 z-40">
        <div style={{ width: 28 }} />

        <div className="flex items-center gap-2">
          <NWHubIcon size={26} animated />
          <span className="font-brand text-[13px] font-bold uppercase tracking-[1.5px] text-nw-200">
            {title}
          </span>
        </div>

        <button
          onClick={() => setBellOpen(true)}
          className={`flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors ${
            bellOpen
              ? 'bg-[rgba(212,160,23,0.12)] text-gold-300'
              : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-nw-500'
          }`}
        >
          <Bell size={13} strokeWidth={1.7} />
        </button>
      </header>

      {/* Notification sheet */}
      {bellOpen && (
        <>
          {/* Backdrop */}
          <div onClick={() => setBellOpen(false)} className="fixed inset-0 z-[55] md:hidden" style={{ background: 'rgba(0,0,0,0.5)' }} />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-[60] md:hidden overflow-hidden rounded-t-[20px] border-t border-[rgba(255,255,255,0.09)] bg-nw-950"
            style={{ maxHeight: '85vh', animation: 'nwhub-sheet-up 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            {/* Handle */}
            <div className="mx-auto mt-2.5 mb-2 h-[3px] w-8 rounded-full bg-nw-600" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)]">
                  <Bell size={13} className="text-gold-400" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-nw-200">Notifications</p>
                  <p className="text-[10px] text-nw-500">Choose what alerts you</p>
                </div>
              </div>
              <button onClick={() => setBellOpen(false)} className="text-nw-500 hover:text-nw-300 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Column headers */}
            <div className="flex items-center justify-end border-b border-[rgba(255,255,255,0.05)] px-5 py-2">
              <span className="w-[52px] text-center text-[9px] font-semibold uppercase tracking-[1px] text-nw-500">Desktop</span>
              <span className="w-[52px] text-center text-[9px] font-semibold uppercase tracking-[1px] text-nw-500">Mobile</span>
            </div>

            {/* Channels */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 160px)', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
              {NOTIFICATION_CHANNELS.map(({ key, label, desc, icon: Icon }) => {
                const s = notifSettings[key] ?? { desktop: false, mobile: false }
                return (
                  <div key={key} className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] px-5 py-3.5 last:border-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)]">
                      <Icon size={15} className="text-nw-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-nw-200">{label}</p>
                      <p className="text-[10px] text-nw-500 leading-tight mt-0.5">{desc}</p>
                    </div>
                    {/* Desktop toggle */}
                    <button
                      onClick={() => toggleNotif(key, 'desktop')}
                      className={`relative h-[20px] w-[36px] flex-shrink-0 rounded-full transition-colors ${s.desktop ? 'bg-gold-500' : 'bg-nw-600'}`}
                    >
                      <div className={`absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform ${s.desktop ? 'translate-x-[19px]' : 'translate-x-[3px]'}`} />
                    </button>
                    {/* Mobile toggle */}
                    <button
                      onClick={() => toggleNotif(key, 'mobile')}
                      className={`relative h-[20px] w-[36px] flex-shrink-0 rounded-full transition-colors ${s.mobile ? 'bg-gold-500' : 'bg-nw-600'}`}
                    >
                      <div className={`absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform ${s.mobile ? 'translate-x-[19px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-[rgba(255,255,255,0.07)] px-5 py-3 flex items-center justify-between">
              <p className="text-[10px] text-nw-500">Settings saved locally</p>
              <button
                onClick={async () => {
                  if ('Notification' in window && Notification.permission === 'default') {
                    await Notification.requestPermission()
                  }
                  setBellOpen(false)
                }}
                className="rounded-[7px] border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] px-3 py-[5px] text-[11px] font-medium text-gold-300 transition-colors hover:bg-[rgba(212,160,23,0.22)]"
              >
                Enable Push
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
