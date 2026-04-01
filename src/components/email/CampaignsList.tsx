'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { Send, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { CampaignSendModal } from '@/components/mailchimp/CampaignSendModal'

interface Campaign {
  id: string
  settings: { subject_line: string; title: string; preview_text?: string }
  status: string
  send_time: string | null
  emails_sent: number
  opens?: { open_rate: number; unique_opens: number }
  clicks?: { click_rate: number; unique_clicks: number }
}

function isDraft(status: string) {
  return status === 'draft' || status === 'save' || status === 'created'
}

function statusVariant(status: string) {
  if (isDraft(status)) return 'gold' as const
  switch (status) {
    case 'sent': return 'sent' as const
    case 'schedule': case 'scheduled': return 'gold' as const
    case 'sending': return 'active' as const
    case 'paused': return 'paused' as const
    default: return 'default' as const
  }
}

function statusLabel(status: string) {
  if (isDraft(status)) return 'Draft'
  return status
}

export function CampaignsList({ campaigns }: { campaigns: Campaign[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState<Campaign | null>(null)
  const [draftHtml, setDraftHtml] = useState('')
  const [loadingDraft, setLoadingDraft] = useState(false)

  async function openDraft(c: Campaign) {
    setSelectedDraft(c)
    setDraftHtml('')
    setModalOpen(true)

    // Fetch draft HTML content from Mailchimp
    setLoadingDraft(true)
    try {
      const res = await fetch(`/api/mailchimp/campaign-content?id=${c.id}`)
      if (res.ok) {
        const data = await res.json()
        setDraftHtml(data.html ?? '')
      }
    } catch {}
    setLoadingDraft(false)
  }

  return (
    <>
      <Panel>
        <PanelHeader eyebrow="Mailchimp" title="All Campaigns" />

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                {['Name', 'Status', 'Sent', 'Opens', 'Clicks', 'Date', ''].map(h => (
                  <th key={h} className="border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-nw-500" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.1px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-nw-500">No campaigns yet</td></tr>
              ) : campaigns.map(c => (
                <tr
                  key={c.id}
                  onClick={isDraft(c.status) ? () => openDraft(c) : undefined}
                  className={`transition-colors ${isDraft(c.status) ? 'cursor-pointer hover:bg-[rgba(212,160,23,0.04)] border-l-2 border-l-gold-400' : 'hover:bg-[rgba(255,255,255,0.03)]'}`}
                >
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                    <p className="font-medium text-nw-200 truncate" style={{ maxWidth: 240 }}>{c.settings.title || c.settings.subject_line}</p>
                    {c.settings.title && c.settings.subject_line && c.settings.title !== c.settings.subject_line && (
                      <p className="text-nw-500 truncate mt-0.5" style={{ fontSize: 11 }}>{c.settings.subject_line}</p>
                    )}
                  </td>
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                    <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                  </td>
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-300">{c.emails_sent > 0 ? c.emails_sent.toLocaleString() : '—'}</td>
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                    {c.opens ? <span className="text-[#4ade80] font-medium">{(c.opens.open_rate * 100).toFixed(1)}%</span> : '—'}
                  </td>
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                    {c.clicks ? <span className="text-gold-300 font-medium">{(c.clicks.click_rate * 100).toFixed(1)}%</span> : '—'}
                  </td>
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-500" style={{ fontSize: 11 }}>
                    {c.send_time ? format(new Date(c.send_time), 'dd MMM yyyy') : 'Draft'}
                  </td>
                  <td className="border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
                    {isDraft(c.status) && (
                      <Button variant="gold" size="sm" onClick={() => openDraft(c)}>
                        <Send size={11} /> Continue
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card rows */}
        <div className="md:hidden">
          {campaigns.length === 0 ? (
            <div className="px-4 py-12 text-center text-nw-500">No campaigns yet</div>
          ) : campaigns.map(c => (
            <div
              key={c.id}
              onClick={isDraft(c.status) ? () => openDraft(c) : undefined}
              className={`border-b border-[rgba(255,255,255,0.05)] p-4 ${isDraft(c.status) ? 'cursor-pointer border-l-2 border-l-gold-400 bg-[rgba(212,160,23,0.03)]' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-nw-200" style={{ fontSize: 14 }}>{c.settings.title || c.settings.subject_line}</p>
                <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
              </div>
              <div className="flex items-center gap-4 mb-2" style={{ fontSize: 11 }}>
                {c.emails_sent > 0 && <span className="text-nw-400">{c.emails_sent} sent</span>}
                {c.opens && <span className="text-[#4ade80]">{(c.opens.open_rate * 100).toFixed(1)}% opens</span>}
                {c.clicks && <span className="text-gold-300">{(c.clicks.click_rate * 100).toFixed(1)}% clicks</span>}
                <span className="text-nw-500 ml-auto">{c.send_time ? format(new Date(c.send_time), 'dd MMM') : 'Draft'}</span>
              </div>
              {isDraft(c.status) && (
                <Button variant="gold" size="sm" onClick={() => openDraft(c)} className="w-full mt-1">
                  <Send size={11} /> Continue Draft
                </Button>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {/* Draft send modal */}
      {selectedDraft && (
        <CampaignSendModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedDraft(null); setDraftHtml('') }}
          html={draftHtml}
          title={selectedDraft.settings.title || selectedDraft.settings.subject_line}
          previewText={selectedDraft.settings.preview_text ?? ''}
          existingCampaignId={selectedDraft.id}
        />
      )}
    </>
  )
}
