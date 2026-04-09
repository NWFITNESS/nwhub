'use client'

import { useState, useTransition, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { submitTrialBooking } from '@/lib/kids/actions'
import { CATEGORY_LABEL, CATEGORY_TIME, categoryFromDob } from '@/lib/kids/constants'
import type { BlockWithDetails, KidsCategory } from '@/lib/kids/types'

interface Props {
  open: boolean
  onClose: () => void
  blocks: BlockWithDetails[]
}

/**
 * NWHub admin "Create trial" modal — used when Mat gets a DM and wants to
 * book a trial for a parent without making them go to the website. Same
 * underlying server action as the public form.
 */
export function TrialModal({ open, onClose, blocks }: Props) {
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [childFirst, setChildFirst] = useState('')
  const [childLast, setChildLast] = useState('')
  const [childDob, setChildDob] = useState('')
  const [category, setCategory] = useState<KidsCategory>('littles')
  const [categoryAutoSuggested, setCategoryAutoSuggested] = useState(false)
  const [photoConsent, setPhotoConsent] = useState(true)
  const [sessionId, setSessionId] = useState('')
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()

  // When DOB changes, suggest the matching category — but only if the user
  // hasn't manually picked one yet. Once they touch the dropdown, their pick
  // is sticky.
  useEffect(() => {
    if (!childDob || categoryAutoSuggested) return
    setCategory(categoryFromDob(childDob))
  }, [childDob, categoryAutoSuggested])

  // Build a flat list of upcoming non-break sessions across all active blocks
  const upcomingSessions = blocks
    .flatMap((b) =>
      b.sessions
        .filter((s) => !s.is_break)
        .map((s) => ({ ...s, blockName: b.name })),
    )
    .sort((a, b) => a.session_date.localeCompare(b.session_date))

  function reset() {
    setParentName('')
    setParentEmail('')
    setParentPhone('')
    setEmergencyName('')
    setEmergencyPhone('')
    setChildFirst('')
    setChildLast('')
    setChildDob('')
    setCategory('littles')
    setCategoryAutoSuggested(false)
    setPhotoConsent(true)
    setSessionId('')
    setNotes('')
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        const result = await submitTrialBooking({
          parent: {
            name: parentName,
            email: parentEmail,
            phone: parentPhone,
            emergencyName,
            emergencyPhone,
          },
          child: {
            firstName: childFirst,
            lastName: childLast,
            dateOfBirth: childDob,
            photoConsent,
          },
          category,
          sessionId: sessionId || null,
          notes,
          source: 'admin',
        })
        reset()
        onClose()
        if (!result.emailSent) {
          alert(`Trial saved, but the confirmation email failed to send: ${result.emailError ?? 'unknown error'}`)
        }
      } catch (e) {
        alert((e as Error).message)
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="New trial booking" width="lg">
      <div className="flex flex-col gap-3">
        <Section title="Parent">
          <Field label="Name">
            <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Email">
              <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Emergency contact">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name">
              <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Child">
          <div className="grid grid-cols-2 gap-2">
            <Field label="First name">
              <input type="text" value={childFirst} onChange={(e) => setChildFirst(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Surname">
              <input type="text" value={childLast} onChange={(e) => setChildLast(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Date of birth">
              <input type="date" value={childDob} onChange={(e) => setChildDob(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Photo consent">
              <select value={photoConsent ? 'yes' : 'no'} onChange={(e) => setPhotoConsent(e.target.value === 'yes')} className={inputCls}>
                <option value="yes">Yes — allowed</option>
                <option value="no">No — not allowed</option>
              </select>
            </Field>
          </div>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as KidsCategory)
                setCategoryAutoSuggested(true)
              }}
              className={inputCls}
            >
              <option value="minis">{CATEGORY_LABEL.minis} · {CATEGORY_TIME.minis}</option>
              <option value="littles">{CATEGORY_LABEL.littles} · {CATEGORY_TIME.littles}</option>
              <option value="teens">{CATEGORY_LABEL.teens} · {CATEGORY_TIME.teens}</option>
            </select>
          </Field>
        </Section>

        <Section title="Session">
          <Field label="Session date">
            <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={inputCls}>
              <option value="">Pick a session…</option>
              {upcomingSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.blockName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="Anything we should know — e.g. medical, allergies, prior experience"
            />
          </Field>
        </Section>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="md" onClick={handleSubmit} loading={pending}>Create trial &amp; email parent</Button>
        </div>
      </div>
    </Modal>
  )
}

const inputCls = "w-full rounded-[6px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-[rgba(255,255,255,0.07)] p-3">
      <div className="mb-2 text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-500">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-semibold uppercase tracking-[1.1px] text-nw-500">{label}</span>
      {children}
    </label>
  )
}
