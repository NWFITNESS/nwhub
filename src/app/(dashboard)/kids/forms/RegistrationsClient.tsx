'use client'

import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Th, Td } from '@/components/ui/Table'
import {
  CATEGORY_LABEL,
  CATEGORY_AGE_RANGE,
  CATEGORY_BADGE,
  ageFromDob,
} from '@/lib/kids/constants'
import { registrationsPrintHtml } from '@/lib/kids/registrations'
import type { KidsCategory, PaymentStatus, RegistrationFull } from '@/lib/kids/types'

interface Props {
  registrations: RegistrationFull[]
  blocks: { id: string; name: string }[]
}

const CSV_URL = '/api/kids/registrations/export'

const PAYMENT_META: Record<PaymentStatus, { label: string; bg: string; fg: string }> = {
  paid:      { label: 'Paid',        bg: 'rgba(34,197,94,0.14)',  fg: '#4ade80' },
  pending:   { label: 'Pending',     bg: 'rgba(234,179,8,0.14)',  fg: '#facc15' },
  link_sent: { label: 'Link sent',   bg: 'rgba(59,130,246,0.14)', fg: '#60a5fa' },
  refunded:  { label: 'Refunded',    bg: 'rgba(148,163,184,0.16)',fg: '#cbd5e1' },
  cancelled: { label: 'Cancelled',   bg: 'rgba(239,68,68,0.14)',  fg: '#f87171' },
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Print (→ PDF) ────────────────────────────────────────────────────────────
function printRegistrations(regs: RegistrationFull[]) {
  if (!regs.length) return
  const w = window.open('', '_blank', 'width=900,height=1000')
  if (!w) {
    alert('Please allow pop-ups for this site to download the PDF.')
    return
  }
  w.document.write(registrationsPrintHtml(regs))
  w.document.close()
  w.focus()
}

// ── Badges ───────────────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: KidsCategory }) {
  const c = CATEGORY_BADGE[category]
  return (
    <span
      className="inline-block rounded-full font-semibold"
      style={{ background: c.bg, color: c.fg, padding: '2px 10px', fontSize: 12 }}
    >
      {CATEGORY_LABEL[category]}
    </span>
  )
}
function PaymentBadge({ status }: { status: PaymentStatus }) {
  const m = PAYMENT_META[status] ?? { label: status, bg: 'rgba(148,163,184,0.16)', fg: '#cbd5e1' }
  return (
    <span
      className="inline-block rounded-full font-semibold"
      style={{ background: m.bg, color: m.fg, padding: '2px 10px', fontSize: 12 }}
    >
      {m.label}
    </span>
  )
}

const selectCls =
  'rounded-lg border border-[rgba(255,255,255,0.1)] bg-nw-800 text-nw-200 focus:border-gold-500 focus:outline-none'

export function RegistrationsClient({ registrations, blocks }: Props) {
  const [search, setSearch] = useState('')
  const [blockId, setBlockId] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [payment, setPayment] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detail, setDetail] = useState<RegistrationFull | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return registrations.filter((r) => {
      if (blockId !== 'all' && r.block_id !== blockId) return false
      if (category !== 'all' && r.category !== category) return false
      if (payment !== 'all' && r.payment_status !== payment) return false
      if (q) {
        const hay = [
          r.child_name, r.parent_name, r.parent_email,
          r.parent_phone, r.emergency_contact_phone, r.emergency_contact_name,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [registrations, search, blockId, category, payment])

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.booking_id))
  const selectedRegs = registrations.filter((r) => selected.has(r.booking_id))

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) filtered.forEach((r) => next.delete(r.booking_id))
      else filtered.forEach((r) => next.add(r.booking_id))
      return next
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Kids & Teens"
        title="Registration"
        titleGold="Forms & Data"
        description={`${registrations.length} registration${registrations.length === 1 ? '' : 's'} · view each form, export selected as PDF, or download all data as CSV`}
        actions={
          <>
            <Button
              variant="gold"
              size="md"
              disabled={selectedRegs.length === 0}
              onClick={() => printRegistrations(selectedRegs)}
            >
              Download PDF{selectedRegs.length ? ` (${selectedRegs.length})` : ''}
            </Button>
            <Button variant="ghost" size="md" onClick={() => { window.location.href = CSV_URL }}>
              Export CSV
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search child, parent, email or phone…"
          className="min-w-[240px] flex-1 rounded-lg border border-[rgba(255,255,255,0.1)] bg-nw-800 text-sm text-nw-100 placeholder:text-nw-500 focus:border-gold-500 focus:outline-none"
          style={{ padding: '9px 14px' }}
        />
        <select value={blockId} onChange={(e) => setBlockId(e.target.value)} className={`${selectCls} text-sm`} style={{ padding: '9px 12px' }}>
          <option value="all">All blocks</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${selectCls} text-sm`} style={{ padding: '9px 12px' }}>
          <option value="all">All groups</option>
          {(['minis', 'littles', 'teens'] as KidsCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
        <select value={payment} onChange={(e) => setPayment(e.target.value)} className={`${selectCls} text-sm`} style={{ padding: '9px 12px' }}>
          <option value="all">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="link_sent">Link sent</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div
          className="flex items-center justify-between rounded-xl border border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.08)]"
          style={{ padding: '10px 16px' }}
        >
          <span className="text-sm text-gold-200">{selected.size} selected</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm font-medium text-nw-400 hover:text-nw-200 transition-colors"
            >
              Clear
            </button>
            <Button variant="gold" size="sm" onClick={() => printRegistrations(selectedRegs)}>
              Download {selected.size} as PDF
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-[rgba(255,255,255,0.08)] px-5 py-3 text-left" style={{ width: 44 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 accent-[#967705] rounded"
                  />
                </th>
                <Th>Child</Th>
                <Th>Group</Th>
                <Th>Parent / guardian</Th>
                <Th>Phone</Th>
                <Th>Block</Th>
                <Th>Payment</Th>
                <Th>Waiver</Th>
                <Th>Registered</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <p className="px-5 py-14 text-center text-nw-400">No registrations match your filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isSel = selected.has(r.booking_id)
                  return (
                    <tr
                      key={r.booking_id}
                      onClick={() => setDetail(r)}
                      className={`cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.04)] ${isSel ? 'bg-[rgba(212,160,23,0.06)]' : ''}`}
                    >
                      <td className="border-b border-[rgba(255,255,255,0.05)] px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.child_name}`}
                          checked={isSel}
                          onChange={() => toggleOne(r.booking_id)}
                          className="h-4 w-4 accent-[#967705] rounded"
                        />
                      </td>
                      <Td className="font-medium text-nw-100">{r.child_name}</Td>
                      <Td><CategoryBadge category={r.category} /></Td>
                      <Td>
                        <div className="text-nw-100">{r.parent_name}</div>
                        <div className="text-[12px] text-nw-500">{r.parent_email || '—'}</div>
                      </Td>
                      <Td>{r.parent_phone || <span className="text-nw-600">—</span>}</Td>
                      <Td className="text-nw-400">{r.block_name}</Td>
                      <Td><PaymentBadge status={r.payment_status} /></Td>
                      <Td>{r.waiver_signed ? <span className="text-green-400">Signed</span> : <span className="text-nw-500">—</span>}</Td>
                      <Td className="whitespace-nowrap text-nw-400">{fmtDate(r.created_at)}</Td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <RegistrationDetailModal reg={detail} onClose={() => setDetail(null)} />
      )}
    </div>
  )
}

// ── Detail modal (read-only form + single PDF) ───────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3" style={{ padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-xs text-white/45" style={{ paddingTop: 1 }}>{label}</span>
      <span className="text-sm text-nw-100">{value || <span className="text-nw-600">—</span>}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="text-xs font-semibold uppercase tracking-widest text-[#967705]" style={{ marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  )
}

function RegistrationDetailModal({ reg, onClose }: { reg: RegistrationFull; onClose: () => void }) {
  const age = reg.date_of_birth ? ageFromDob(reg.date_of_birth) : null
  return (
    <Modal open onClose={onClose} title={`Registration — ${reg.child_name}`} width="2xl">
      <div className="max-h-[70vh] overflow-y-auto" style={{ padding: '0 4px' }}>
        <Section title="Child details">
          <DetailRow label="Full name" value={reg.child_name} />
          <DetailRow label="Date of birth" value={reg.date_of_birth ? `${fmtDate(reg.date_of_birth)}${age != null ? ` · age ${age}` : ''}` : null} />
          <DetailRow label="Group" value={`${CATEGORY_LABEL[reg.category]} · ages ${CATEGORY_AGE_RANGE[reg.category]}`} />
          <DetailRow label="Photo consent" value={reg.photo_consent ? 'Given' : 'Not given'} />
          <DetailRow label="Medical notes" value={reg.medical_notes} />
          <DetailRow label="Authorised pickups" value={reg.authorised_pickups} />
        </Section>

        <Section title="Parent / guardian">
          <DetailRow label="Name" value={reg.parent_name} />
          <DetailRow label="Email" value={reg.parent_email} />
          <DetailRow label="Phone" value={reg.parent_phone} />
        </Section>

        <Section title="Emergency contact">
          <DetailRow label="Name" value={reg.emergency_contact_name} />
          <DetailRow label="Phone" value={reg.emergency_contact_phone} />
          <DetailRow label="Relation" value={reg.emergency_contact_relation} />
        </Section>

        <Section title="Booking">
          <DetailRow label="Block" value={reg.block_name} />
          <DetailRow label="Payment" value={<PaymentBadge status={reg.payment_status} />} />
          <DetailRow label="Paid at" value={reg.paid_at ? fmtDateTime(reg.paid_at) : null} />
          <DetailRow label="Waiver" value={reg.waiver_signed ? `Signed${reg.waiver_signed_at ? ` · ${fmtDateTime(reg.waiver_signed_at)}` : ''}` : 'Not signed'} />
          <DetailRow label="Registered" value={fmtDateTime(reg.created_at)} />
        </Section>

        <div className="flex justify-end gap-3" style={{ paddingTop: 8 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <Button variant="gold" size="sm" onClick={() => printRegistrations([reg])}>Download PDF</Button>
        </div>
      </div>
    </Modal>
  )
}
