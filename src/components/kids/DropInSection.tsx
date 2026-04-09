'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { createDropInPaymentLink, sendDropInLinkEmail } from '@/lib/kids/actions'
import { CATEGORY_LABEL, DROPIN_PRICE_PENCE, formatPence } from '@/lib/kids/constants'
import type { BlockWithDetails, DropInRow, KidsCategory } from '@/lib/kids/types'

interface Props {
  blocks: BlockWithDetails[]
  recentDropIns: DropInRow[]
}

export function DropInSection({ blocks, recentDropIns }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <GenerateLinkCard blocks={blocks} />
      <RecentDropInsCard rows={recentDropIns} />
    </div>
  )
}

function GenerateLinkCard({ blocks }: { blocks: BlockWithDetails[] }) {
  const [childName, setChildName] = useState('')
  const [category, setCategory] = useState<KidsCategory>('littles')
  const [sessionId, setSessionId] = useState<string>('')
  const [parentEmail, setParentEmail] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Build a flat list of upcoming non-break sessions across all blocks
  const upcomingSessions = blocks
    .flatMap((b) =>
      b.sessions
        .filter((s) => !s.is_break)
        .map((s) => ({ ...s, blockName: b.name })),
    )
    .sort((a, b) => a.session_date.localeCompare(b.session_date))

  function showConfirm(msg: string) {
    setConfirm(msg)
    setTimeout(() => setConfirm(null), 2500)
  }

  function handleGenerate() {
    if (!childName.trim() || !parentEmail.trim() || !sessionId) {
      alert('Child name, parent email, and session are required')
      return
    }
    startTransition(async () => {
      try {
        const { url, bookingId: id } = await createDropInPaymentLink({
          childName: childName.trim(),
          category,
          sessionId,
          parentEmail: parentEmail.trim(),
        })
        setGeneratedUrl(url)
        setBookingId(id)
        try {
          await navigator.clipboard.writeText(url)
          showConfirm('Link copied to clipboard')
        } catch {
          showConfirm('Link generated')
        }
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleSendEmail() {
    if (!bookingId) {
      alert('Generate the link first')
      return
    }
    startTransition(async () => {
      try {
        await sendDropInLinkEmail(bookingId)
        showConfirm(`Email sent to ${parentEmail}`)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[11px]">
        <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">DROP-IN</span>
        <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
        <span className="text-[13px] font-medium text-nw-200">Generate payment link</span>
      </div>

      <div className="flex flex-col gap-3 p-[17px]">
        <Field label="Child name">
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as KidsCategory)}
              className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
            >
              <option value="minis">Minis</option>
              <option value="littles">Littles</option>
              <option value="teens">Teens</option>
            </select>
          </Field>
          <Field label="Amount">
            <div className="flex items-center rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-gold-300">
              {formatPence(DROPIN_PRICE_PENCE[category])}
            </div>
          </Field>
        </div>

        <Field label="Session date">
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
          >
            <option value="">Pick a session…</option>
            {upcomingSessions.map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.blockName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Parent email">
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
          />
        </Field>

        {/* Link preview */}
        <div className="rounded-[7px] border border-[rgba(255,255,255,0.07)] bg-nw-800/50 p-3 font-mono text-[10px] text-nw-400 break-all min-h-[2.5rem]">
          {generatedUrl ?? <span className="text-nw-600">Link preview will appear here…</span>}
        </div>

        <div className="flex gap-2">
          <Button variant="gold" size="md" onClick={handleGenerate} loading={pending} className="flex-1">
            Generate &amp; copy
          </Button>
          <Button variant="default" size="md" onClick={handleSendEmail} disabled={!bookingId}>
            Send email
          </Button>
        </div>

        {confirm && (
          <p className="text-center text-[11px] text-[#4ade80]">{confirm}</p>
        )}
      </div>
    </div>
  )
}

function RecentDropInsCard({ rows }: { rows: DropInRow[] }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[11px]">
        <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">RECENT</span>
        <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
        <span className="text-[13px] font-medium text-nw-200">Drop-ins</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-[17px] py-12 text-center text-xs text-nw-500">No drop-ins yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Child</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Cat.</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Amount</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                  <td className="px-3 py-2.5 text-nw-100">{r.child_name}</td>
                  <td className="px-3 py-2.5 text-xs text-nw-400">{CATEGORY_LABEL[r.category]}</td>
                  <td className="px-3 py-2.5 text-xs text-nw-300">{formatPence(r.price_pence)}</td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={r.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: DropInRow['payment_status'] }) {
  const map: Record<DropInRow['payment_status'], { label: string; bg: string; fg: string }> = {
    paid:      { label: 'Paid',      bg: 'rgba(74,222,128,0.12)',  fg: '#4ade80' },
    link_sent: { label: 'Link sent', bg: 'rgba(59,130,246,0.12)',  fg: '#60a5fa' },
    pending:   { label: 'Pending',   bg: 'rgba(245,158,11,0.12)',  fg: '#f59e0b' },
    refunded:  { label: 'Refunded',  bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
    cancelled: { label: 'Cancelled', bg: 'rgba(248,113,113,0.12)', fg: '#f87171' },
  }
  const s = map[status]
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: s.bg, color: s.fg }}>
      {s.label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">{label}</span>
      {children}
    </label>
  )
}
