'use client'

import { useEffect, useState, useTransition } from 'react'
import { Modal } from '@/components/ui/Modal'
import { getBookingForEditor, updateBooking } from '@/lib/kids/actions'
import type { BookingEditorData, KidsCategory } from '@/lib/kids/types'
import { CATEGORY_LABEL } from '@/lib/kids/constants'

interface Props {
  bookingId: string | null
  onClose: () => void
}

const inputCls =
  'w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-sm text-nw-100 focus:border-gold-500 focus:outline-none'
const checkboxCls = 'h-4 w-4 accent-[#967705] rounded'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-white/50">{label}</span>
      {children}
    </label>
  )
}

export default function BookingEditorModal({ bookingId, onClose }: Props) {
  const [data, setData] = useState<BookingEditorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, startSave] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [childName, setChildName] = useState('')
  const [dob, setDob] = useState('')
  const [category, setCategory] = useState<KidsCategory>('littles')
  const [medicalNotes, setMedicalNotes] = useState('')
  const [authorisedPickups, setAuthorisedPickups] = useState('')
  const [photoConsent, setPhotoConsent] = useState(false)
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyRelation, setEmergencyRelation] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [waiverSigned, setWaiverSigned] = useState(false)

  // Fetch data on open
  useEffect(() => {
    if (!bookingId) { setData(null); return }
    let cancelled = false
    setLoading(true)
    getBookingForEditor(bookingId).then((d) => {
      if (cancelled) return
      setData(d)
      if (d) {
        setChildName(d.child_name)
        setDob(d.date_of_birth)
        setCategory(d.category)
        setMedicalNotes(d.medical_notes ?? '')
        setAuthorisedPickups(d.authorised_pickups ?? '')
        setPhotoConsent(d.photo_consent)
        setParentName(d.parent_name)
        setParentEmail(d.parent_email)
        setParentPhone(d.parent_phone ?? '')
        setEmergencyName(d.emergency_contact_name ?? '')
        setEmergencyPhone(d.emergency_contact_phone ?? '')
        setEmergencyRelation(d.emergency_contact_relation ?? '')
        setPaymentStatus(d.payment_status)
        setWaiverSigned(d.waiver_signed)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [bookingId])

  function handleSave() {
    if (!data) return
    startSave(async () => {
      try {
        const result = await updateBooking({
          booking_id: data.booking_id,
          child_name: childName,
          date_of_birth: dob,
          category,
          medical_notes: medicalNotes,
          authorised_pickups: authorisedPickups,
          photo_consent: photoConsent,
          parent_name: parentName,
          parent_email: parentEmail,
          parent_phone: parentPhone,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          emergency_contact_relation: emergencyRelation,
          payment_status: paymentStatus,
          waiver_signed: waiverSigned,
        })
        if (result.changes.length) {
          setToast(`Updated: ${result.changes.join(', ')}. Alteration email sent.`)
          setTimeout(() => { setToast(null); onClose() }, 2500)
        } else {
          setToast('No changes detected.')
          setTimeout(() => { setToast(null) }, 2000)
        }
      } catch (e) {
        setToast(`Error: ${(e as Error).message}`)
        setTimeout(() => setToast(null), 4000)
      }
    })
  }

  return (
    <Modal open={!!bookingId} onClose={onClose} title={data ? `Edit — ${data.child_name}` : 'Edit Booking'} width="2xl">
      {loading && (
        <div className="flex items-center justify-center" style={{ padding: '48px 0' }}>
          <span className="text-sm text-white/40">Loading booking…</span>
        </div>
      )}

      {!loading && data && (
        <div className="max-h-[70vh] overflow-y-auto" style={{ padding: '0 4px' }}>
          {/* Child section */}
          <div style={{ marginBottom: 20 }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#967705]" style={{ marginBottom: 10 }}>Child details</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name">
                <input type="text" value={childName} onChange={(e) => setChildName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Date of birth">
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Category">
                <select value={category} onChange={(e) => setCategory(e.target.value as KidsCategory)} className={inputCls}>
                  {(['minis', 'littles', 'teens'] as KidsCategory[]).map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Authorised pickups">
                <input type="text" value={authorisedPickups} onChange={(e) => setAuthorisedPickups(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div style={{ marginTop: 8 }}>
              <Field label="Medical notes / allergies">
                <textarea value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)} rows={2} className={inputCls} />
              </Field>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={photoConsent} onChange={(e) => setPhotoConsent(e.target.checked)} className={checkboxCls} />
              Photo consent
            </label>
          </div>

          {/* Parent section */}
          <div style={{ marginBottom: 20 }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#967705]" style={{ marginBottom: 10 }}>Parent / guardian</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name">
                <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Phone">
                <input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Emergency contact */}
          <div style={{ marginBottom: 20 }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#967705]" style={{ marginBottom: 10 }}>Emergency contact</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Name">
                <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Phone">
                <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Relation">
                <input type="text" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} className={inputCls} placeholder="e.g. Grandparent" />
              </Field>
            </div>
          </div>

          {/* Booking overrides */}
          <div style={{ marginBottom: 16 }}>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#967705]" style={{ marginBottom: 10 }}>Booking</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Payment status">
                <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-white/70" style={{ paddingBottom: 8 }}>
                  <input type="checkbox" checked={waiverSigned} onChange={(e) => setWaiverSigned(e.target.checked)} className={checkboxCls} />
                  Waiver signed
                </label>
              </div>
            </div>
            <p className="mt-1 text-[11px] text-white/30">Changing payment status only updates the database — it does not trigger a Stripe refund or charge.</p>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className="rounded-lg text-sm"
              style={{
                padding: '10px 14px',
                marginBottom: 12,
                background: toast.startsWith('Error') ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                border: `1px solid ${toast.startsWith('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                color: toast.startsWith('Error') ? '#ef4444' : '#22c55e',
              }}
            >
              {toast}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3" style={{ paddingTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#967705] text-sm font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
              style={{ padding: '8px 20px' }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
