'use client'

import { useState, useEffect } from 'react'
import { X, Send, Mail, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface ScheduledCampaign {
  campaign_id: string
  name: string
  subject: string
  scheduled_for: string
  created_at: string
}

// Session-only snooze list. Cleared when the app/tab is closed, so a snoozed
// campaign re-appears on the next login — that's the "Later, remind me again"
// behaviour. A permanent "Cancel" instead removes the campaign from the stored
// list (global_settings) so it never comes back.
const SNOOZE_KEY = 'nw-dismissed-campaigns'

function readSnoozed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(SNOOZE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function ScheduledCampaignPopup() {
  // `all` is the full stored list (so Cancel can write back the remainder);
  // `campaigns` is the subset actually shown (due + not snoozed this session).
  const [all, setAll] = useState<ScheduledCampaign[]>([])
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([])
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings-read?key=scheduled_campaigns')
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data?.value)) return
        const list = data.value as ScheduledCampaign[]
        setAll(list)
        const now = new Date()
        const due = list.filter((c) => new Date(c.scheduled_for) <= now)
        const snoozed = new Set(readSnoozed())
        const show = due.filter((c) => !snoozed.has(c.campaign_id))
        if (show.length > 0) {
          setCampaigns(show)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  function hideIfEmpty(next: ScheduledCampaign[]) {
    setCampaigns(next)
    if (next.length === 0) setVisible(false)
  }

  // Later — snooze for this session; reappears on the next login.
  function later(id: string) {
    const snoozed = readSnoozed()
    if (!snoozed.includes(id)) snoozed.push(id)
    sessionStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozed))
    hideIfEmpty(campaigns.filter((c) => c.campaign_id !== id))
  }

  // Snooze everything (backdrop / header close) — same "remind me later" intent.
  function laterAll() {
    const ids = campaigns.map((c) => c.campaign_id)
    sessionStorage.setItem(SNOOZE_KEY, JSON.stringify([...new Set([...readSnoozed(), ...ids])]))
    setVisible(false)
  }

  // Cancel — permanently remove from the stored list so it never appears again.
  async function cancel(id: string) {
    setBusy(id)
    const remaining = all.filter((c) => c.campaign_id !== id)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'scheduled_campaigns', value: remaining }),
      })
      if (!res.ok) throw new Error('save failed')
      setAll(remaining)
      hideIfEmpty(campaigns.filter((c) => c.campaign_id !== id))
    } catch {
      // Left in place — the user can try Cancel again.
    } finally {
      setBusy(null)
    }
  }

  if (!visible || campaigns.length === 0) return null

  return (
    <>
      {/* Backdrop — closing it just snoozes (Later) */}
      <div onClick={laterAll} className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" />

      {/* Popup */}
      <div className="fixed z-[70] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.11)] bg-nw-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.22)]">
              <Mail size={16} className="text-gold-400" />
            </div>
            <div>
              <p className="text-nw-200 font-medium" style={{ fontSize: 15 }}>Campaign Ready to Send</p>
              <p className="text-nw-500" style={{ fontSize: 11 }}>Your scheduled campaign is due</p>
            </div>
          </div>
          <button onClick={laterAll} title="Remind me later" className="text-nw-500 hover:text-nw-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Campaigns */}
        <div className="p-5 flex flex-col gap-3">
          {campaigns.map((c) => {
            const scheduledDate = new Date(c.scheduled_for)
            const timeStr = scheduledDate.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            const isBusy = busy === c.campaign_id

            return (
              <div key={c.campaign_id} className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-nw-200 font-medium" style={{ fontSize: 14 }}>{c.name}</p>
                  <button onClick={() => later(c.campaign_id)} title="Remind me later" className="text-nw-600 hover:text-nw-400 transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-nw-400" style={{ fontSize: 12 }}>Subject: {c.subject}</p>
                <div className="flex items-center gap-1.5 mt-1 text-gold-400" style={{ fontSize: 11 }}>
                  <Clock size={11} />
                  Scheduled for {timeStr}
                </div>
                <div className="flex gap-2 mt-3">
                  <Link href="/mailchimp" className="flex-1">
                    <Button variant="gold" size="sm" className="w-full">
                      <Send size={12} /> Go to Campaigns
                    </Button>
                  </Link>
                  <Button variant="default" size="sm" onClick={() => later(c.campaign_id)} disabled={isBusy}>
                    Later
                  </Button>
                </div>
                <button
                  onClick={() => cancel(c.campaign_id)}
                  disabled={isBusy}
                  className="mt-2.5 text-nw-500 hover:text-red-400 transition-colors disabled:opacity-50"
                  style={{ fontSize: 11 }}
                  title="Stop reminding me about this campaign"
                >
                  {isBusy ? 'Cancelling…' : 'Cancel reminder — don’t show again'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
