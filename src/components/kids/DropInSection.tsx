'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { createDropInPaymentLink, sendDropInLinkEmail, cancelDropIn, refundDropIn } from '@/lib/kids/actions'
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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [category, setCategory] = useState<KidsCategory>('littles')
  const [priceGbp, setPriceGbp] = useState<number>(DROPIN_PRICE_PENCE.littles / 100)
  const [sessionId, setSessionId] = useState<string>('')
  const [parentEmail, setParentEmail] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // When the category changes, reset the price to that category's default.
  // The admin can still override it before clicking Generate.
  function handleCategoryChange(next: KidsCategory) {
    setCategory(next)
    setPriceGbp(DROPIN_PRICE_PENCE[next] / 100)
  }

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
    const first = firstName.trim()
    const last = lastName.trim()
    if (!first || !last) {
      alert("Both the child's first name and surname are required.")
      return
    }
    if (!parentEmail.trim() || !sessionId) {
      alert('Parent email and session are required')
      return
    }
    if (!Number.isFinite(priceGbp) || priceGbp < 0.5) {
      alert('Amount must be at least £0.50.')
      return
    }
    startTransition(async () => {
      try {
        const { url, bookingId: id } = await createDropInPaymentLink({
          childName: `${first} ${last}`,
          category,
          sessionId,
          parentEmail: parentEmail.trim(),
          pricePence: Math.round(priceGbp * 100),
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
    <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-3.5" style={{ paddingLeft: 20, paddingRight: 20 }}>
        <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">DROP-IN</span>
        <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
        <span className="text-[13px] font-medium text-nw-200">Generate payment link</span>
      </div>

      <div className="flex flex-col gap-3" style={{ padding: 20 }}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Child first name">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
            />
          </Field>
          <Field label="Child surname">
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as KidsCategory)}
              className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"
            >
              <option value="minis">Minis</option>
              <option value="littles">Littles</option>
              <option value="teens">Teens</option>
            </select>
          </Field>
          <Field label="Amount (£)">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-nw-500">£</span>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={priceGbp}
                onChange={(e) => setPriceGbp(Number(e.target.value))}
                className="w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 pl-6 pr-3 py-2 text-sm text-gold-300 focus:border-gold-500 focus:outline-none"
              />
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
        <div className="rounded-[7px] border border-[rgba(255,255,255,0.07)] bg-nw-800/50 font-mono text-[10px] text-nw-400 break-all min-h-[2.5rem]" style={{ padding: 12 }}>
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
          <p className="text-center text-[11px] text-[#22c55e]">{confirm}</p>
        )}
      </div>
    </div>
  )
}

function RecentDropInsCard({ rows }: { rows: DropInRow[] }) {
  const [pending, startTransition] = useTransition()

  function handleCancel(id: string, childName: string) {
    if (!window.confirm(`Cancel drop-in for ${childName}? This deactivates the Stripe link and removes the row.`)) return
    startTransition(async () => {
      try {
        await cancelDropIn(id)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  function handleRefund(id: string, childName: string) {
    if (!window.confirm(`Refund the drop-in payment for ${childName}? This is a full refund via Stripe.`)) return
    startTransition(async () => {
      try {
        await refundDropIn(id)
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750">
      <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] py-3.5" style={{ paddingLeft: 20, paddingRight: 20 }}>
        <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">RECENT</span>
        <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
        <span className="text-[13px] font-medium text-nw-200">Drop-ins</span>
      </div>
      {rows.length === 0 ? (
        <div className="py-12 text-center text-xs text-nw-500" style={{ paddingLeft: 20, paddingRight: 20 }}>No drop-ins yet</div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-2" style={{ padding: 12 }}>
          {rows.map((r) => {
            const canCancel = r.payment_status === 'pending' || r.payment_status === 'link_sent'
            const canRefund = r.payment_status === 'paid'
            return (
              <div key={r.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-nw-800" style={{ padding: 12 }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-nw-100 truncate" style={{ fontSize: 14 }}>{r.child_name}</span>
                  <StatusPill status={r.payment_status} />
                </div>
                <div className="flex items-center justify-between gap-2" style={{ marginTop: 8 }}>
                  <span className="text-nw-400" style={{ fontSize: 12 }}>{CATEGORY_LABEL[r.category]} · {formatPence(r.price_pence)}</span>
                  <div className="flex items-center gap-3">
                    {canCancel && <button onClick={() => handleCancel(r.id, r.child_name)} disabled={pending} className="text-[12px] font-medium text-nw-400 hover:text-[#ef4444] disabled:opacity-50 transition-colors" style={{ minHeight: 32 }}>Cancel</button>}
                    {canRefund && <button onClick={() => handleRefund(r.id, r.child_name)} disabled={pending} className="text-[12px] font-medium text-nw-400 hover:text-[#ef4444] disabled:opacity-50 transition-colors" style={{ minHeight: 32 }}>Refund</button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Child</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Cat.</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Amount</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Status</th>
                <th className="text-right text-[11px] font-bold uppercase tracking-[1.3px] text-nw-500" style={{ padding: '10px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const canCancel = r.payment_status === 'pending' || r.payment_status === 'link_sent'
                const canRefund = r.payment_status === 'paid'
                return (
                  <tr key={r.id} className="border-b border-[rgba(255,255,255,0.04)] last:border-0">
                    <td className="text-nw-100" style={{ padding: '10px 12px' }}>{r.child_name}</td>
                    <td className="text-xs text-nw-400" style={{ padding: '10px 12px' }}>{CATEGORY_LABEL[r.category]}</td>
                    <td className="text-xs text-nw-300" style={{ padding: '10px 12px' }}>{formatPence(r.price_pence)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusPill status={r.payment_status} />
                    </td>
                    <td className="text-right" style={{ padding: '10px 12px' }}>
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(r.id, r.child_name)}
                          disabled={pending}
                          className="text-[11px] font-medium text-nw-400 hover:text-[#ef4444] disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {canRefund && (
                        <button
                          onClick={() => handleRefund(r.id, r.child_name)}
                          disabled={pending}
                          className="text-[11px] font-medium text-nw-400 hover:text-[#ef4444] disabled:opacity-50 transition-colors"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: DropInRow['payment_status'] }) {
  const map: Record<DropInRow['payment_status'], { label: string; bg: string; fg: string }> = {
    paid:      { label: 'Paid',      bg: 'rgba(74,222,128,0.12)',  fg: '#22c55e' },
    link_sent: { label: 'Link sent', bg: 'rgba(59,130,246,0.12)',  fg: '#3b82f6' },
    pending:   { label: 'Pending',   bg: 'rgba(245,158,11,0.12)',  fg: '#f59e0b' },
    refunded:  { label: 'Refunded',  bg: 'rgba(248,113,113,0.12)', fg: '#ef4444' },
    cancelled: { label: 'Cancelled', bg: 'rgba(248,113,113,0.12)', fg: '#ef4444' },
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
      <span className="text-[11px] font-bold uppercase tracking-[1.3px] text-nw-400">{label}</span>
      {children}
    </label>
  )
}
