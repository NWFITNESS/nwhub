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

export function ScheduledCampaignPopup() {
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check for scheduled campaigns
    fetch('/api/settings-read?key=scheduled_campaigns')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data?.value)) return
        const now = new Date()
        // Show campaigns that are due (scheduled time is now or in the past)
        const due = (data.value as ScheduledCampaign[]).filter(c => {
          const scheduledDate = new Date(c.scheduled_for)
          return scheduledDate <= now
        })
        // Also check sessionStorage for already dismissed ones this session
        const sessionDismissed = new Set(JSON.parse(sessionStorage.getItem('nw-dismissed-campaigns') ?? '[]'))
        const undismissed = due.filter(c => !sessionDismissed.has(c.campaign_id))
        if (undismissed.length > 0) {
          setCampaigns(undismissed)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  function dismiss(campaignId: string) {
    const next = new Set(dismissed)
    next.add(campaignId)
    setDismissed(next)
    sessionStorage.setItem('nw-dismissed-campaigns', JSON.stringify([...next]))
    const remaining = campaigns.filter(c => !next.has(c.campaign_id))
    if (remaining.length === 0) setVisible(false)
  }

  function dismissAll() {
    const allIds = campaigns.map(c => c.campaign_id)
    sessionStorage.setItem('nw-dismissed-campaigns', JSON.stringify(allIds))
    setVisible(false)
  }

  if (!visible || campaigns.length === 0) return null

  const activeCampaigns = campaigns.filter(c => !dismissed.has(c.campaign_id))
  if (activeCampaigns.length === 0) return null

  return (
    <>
      {/* Backdrop */}
      <div onClick={dismissAll} className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" />

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
          <button onClick={dismissAll} className="text-nw-500 hover:text-nw-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Campaigns */}
        <div className="p-5 flex flex-col gap-3">
          {activeCampaigns.map(c => {
            const scheduledDate = new Date(c.scheduled_for)
            const timeStr = scheduledDate.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

            return (
              <div key={c.campaign_id} className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-nw-200 font-medium" style={{ fontSize: 14 }}>{c.name}</p>
                  <button onClick={() => dismiss(c.campaign_id)} className="text-nw-600 hover:text-nw-400 transition-colors flex-shrink-0">
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
                  <Button variant="default" size="sm" onClick={() => dismiss(c.campaign_id)}>
                    Later
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
