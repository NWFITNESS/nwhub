'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel, PanelHeader, PanelBody } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { DarkSelect } from '@/components/ui/DarkSelect'
import { CLASS_COLOUR_PRESETS, DAY_LABELS_LONG, formatTime } from '@/lib/rota'
import type { RotaClassType, RotaTemplateSlot } from '@/lib/rota'

const fieldStyle: React.CSSProperties = {
  padding: '9px 12px', fontSize: 14, width: '100%', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#edf3fb',
  colorScheme: 'dark',
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {children}
    </label>
  )
}
const t5 = (t: string) => (t || '').slice(0, 5)

interface ClassDraft { id?: string; name: string; color: string; paid: boolean }
interface SlotDraft { id?: string; day_of_week: number; start_time: string; end_time: string; class_type_id: string | null; notes: string }

export function SetupClient() {
  const [classTypes, setClassTypes] = useState<RotaClassType[]>([])
  const [template, setTemplate] = useState<RotaTemplateSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [classDraft, setClassDraft] = useState<ClassDraft | null>(null)
  const [slotDraft, setSlotDraft] = useState<SlotDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [weekdayRate, setWeekdayRate] = useState(13)
  const [weekendRate, setWeekendRate] = useState(20)
  const [ratesSaved, setRatesSaved] = useState(false)

  const classMap = useMemo(() => new Map(classTypes.map(c => [c.id, c])), [classTypes])

  const load = useCallback(async () => {
    setLoading(true)
    const [ct, tp, st] = await Promise.all([
      fetch('/api/coach-rota/class-types').then(r => r.json()),
      fetch('/api/coach-rota/template').then(r => r.json()),
      fetch('/api/coach-rota/settings').then(r => r.json()),
    ])
    setClassTypes(ct.classTypes ?? [])
    setTemplate(tp.template ?? [])
    if (st.settings) { setWeekdayRate(Number(st.settings.weekday_rate)); setWeekendRate(Number(st.settings.weekend_rate)) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function saveRates() {
    setSaving(true)
    const res = await fetch('/api/coach-rota/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weekday_rate: weekdayRate, weekend_rate: weekendRate }) })
    setSaving(false)
    if (res.ok) { setRatesSaved(true); setTimeout(() => setRatesSaved(false), 2000) }
  }

  // ── class types ──
  async function saveClass() {
    if (!classDraft) return
    setSaving(true)
    const payload = { name: classDraft.name, color: classDraft.color, paid: classDraft.paid }
    const res = classDraft.id
      ? await fetch('/api/coach-rota/class-types', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: classDraft.id, ...payload }) })
      : await fetch('/api/coach-rota/class-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setSaving(false)
    if (res.ok) { setClassDraft(null); load() }
  }
  async function archiveClass(c: RotaClassType) {
    if (!confirm(`Remove “${c.name}”? Existing sessions keep their colour.`)) return
    await fetch(`/api/coach-rota/class-types?id=${c.id}`, { method: 'DELETE' }); load()
  }

  // ── template slots ──
  async function saveSlot() {
    if (!slotDraft) return
    setSaving(true)
    const body = { day_of_week: slotDraft.day_of_week, start_time: slotDraft.start_time, end_time: slotDraft.end_time, class_type_id: slotDraft.class_type_id, notes: slotDraft.notes }
    const res = slotDraft.id
      ? await fetch('/api/coach-rota/template', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: slotDraft.id, ...body }) })
      : await fetch('/api/coach-rota/template', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    if (res.ok) { setSlotDraft(null); load() }
  }
  async function deleteSlot(s: RotaTemplateSlot) {
    if (!confirm('Remove this template slot?')) return
    await fetch(`/api/coach-rota/template?id=${s.id}`, { method: 'DELETE' }); load()
  }

  const slotsByDay = useMemo(() => {
    const m: Record<number, RotaTemplateSlot[]> = {}
    for (let d = 0; d < 7; d++) m[d] = []
    for (const s of template) m[s.day_of_week]?.push(s)
    for (let d = 0; d < 7; d++) m[d].sort((a, b) => a.start_time.localeCompare(b.start_time))
    return m
  }, [template])

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Coaching" title="Classes & Template" description="Pay rates, colour-coded classes, and the standard weekly timetable" />

      {/* Pay rates */}
      <Panel>
        <PanelHeader title="Pay rates" />
        <PanelBody>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weekday £/hr</span>
              <input type="number" step="0.5" min="0" value={weekdayRate} onChange={e => setWeekdayRate(Number(e.target.value))} style={{ ...fieldStyle, width: 120 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weekend £/hr</span>
              <input type="number" step="0.5" min="0" value={weekendRate} onChange={e => setWeekendRate(Number(e.target.value))} style={{ ...fieldStyle, width: 120 }} />
            </label>
            <Button variant="gold" size="sm" onClick={saveRates} loading={saving}>Save rates</Button>
            {ratesSaved && <span style={{ fontSize: 13, color: '#22c55e' }}>Saved ✓</span>}
          </div>
          <p className="text-nw-400" style={{ fontSize: 12, marginTop: 10 }}>Mon–Fri classes pay the weekday rate, Sat–Sun the weekend rate. Classes marked unpaid (e.g. CF Kids) count hours but £0.</p>
        </PanelBody>
      </Panel>

      {/* Class types */}
      <Panel>
        <PanelHeader title="Class types" action={<Button variant="gold" size="sm" onClick={() => setClassDraft({ name: '', color: CLASS_COLOUR_PRESETS[0], paid: true })}><Plus size={15} /> Add class</Button>} />
        <PanelBody>
          <div className="flex flex-wrap gap-2">
            {loading && <span style={{ color: '#8296b4', fontSize: 14 }}>Loading…</span>}
            {classTypes.map(c => (
              <div key={c.id} className="inline-flex items-center gap-2" style={{ padding: '7px 10px 7px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#edf3fb' }}>{c.name}</span>
                {!c.paid && <span style={{ fontSize: 10, fontWeight: 700, color: '#8296b4', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '1px 5px' }}>UNPAID</span>}
                <button onClick={() => setClassDraft({ id: c.id, name: c.name, color: c.color, paid: c.paid })} style={miniBtn} aria-label="Edit"><Pencil size={12} /></button>
                <button onClick={() => archiveClass(c)} style={miniBtn} aria-label="Remove"><Trash2 size={12} /></button>
              </div>
            ))}
            {!loading && classTypes.length === 0 && <span style={{ color: '#8296b4', fontSize: 14 }}>No class types yet.</span>}
          </div>
        </PanelBody>
      </Panel>

      {/* Weekly template */}
      <Panel>
        <PanelHeader title="Weekly template" action={<Button variant="secondary" size="sm" onClick={() => setSlotDraft({ day_of_week: 0, start_time: '18:00', end_time: '19:00', class_type_id: classTypes[0]?.id ?? null, notes: '' })}><Plus size={15} /> Add slot</Button>} />
        <PanelBody>
          <p className="text-nw-400" style={{ fontSize: 13, marginBottom: 14 }}>These are your standard weekly classes. Use <strong className="text-nw-200">Generate week → From weekly template</strong> on the rota to create them as needs-filled slots.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {DAY_LABELS_LONG.map((label, d) => (
              <div key={d} style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 700, color: '#edf3fb' }}>{label}</div>
                <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {slotsByDay[d].map(s => {
                    const ct = classMap.get(s.class_type_id ?? '')
                    return (
                      <button key={s.id} onClick={() => setSlotDraft({ id: s.id, day_of_week: s.day_of_week, start_time: t5(s.start_time), end_time: t5(s.end_time), class_type_id: s.class_type_id, notes: s.notes ?? '' })}
                        style={{ textAlign: 'left', padding: '7px 9px', borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${ct?.color ?? '#64748b'}`, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#edf3fb' }}><strong>{formatTime(s.start_time)}</strong> {ct?.name ?? ''}</span>
                        <Trash2 size={12} className="text-nw-500" onClick={(e) => { e.stopPropagation(); deleteSlot(s) }} />
                      </button>
                    )
                  })}
                  {slotsByDay[d].length === 0 && <span style={{ fontSize: 12, color: '#5e6e82', padding: '4px 2px' }}>—</span>}
                </div>
              </div>
            ))}
          </div>
        </PanelBody>
      </Panel>

      {/* Class modal */}
      <Modal open={!!classDraft} onClose={() => setClassDraft(null)} title={classDraft?.id ? 'Edit class' : 'Add class'} width="sm">
        {classDraft && (
          <div className="flex flex-col gap-3">
            <Field label="Name"><input style={fieldStyle} value={classDraft.name} placeholder="e.g. WOD, Hyrox" onChange={e => setClassDraft({ ...classDraft, name: e.target.value })} /></Field>
            <Field label="Colour">
              <div className="flex gap-2 flex-wrap" style={{ marginTop: 2 }}>
                {CLASS_COLOUR_PRESETS.map(col => (
                  <button key={col} onClick={() => setClassDraft({ ...classDraft, color: col })} aria-label={col} style={{ width: 28, height: 28, borderRadius: 8, background: col, cursor: 'pointer', border: classDraft.color === col ? '2px solid #fff' : '2px solid transparent' }} />
                ))}
              </div>
            </Field>
            <label className="inline-flex items-center gap-2" style={{ fontSize: 13, color: '#8296b4', cursor: 'pointer' }}>
              <input type="checkbox" checked={classDraft.paid} onChange={e => setClassDraft({ ...classDraft, paid: e.target.checked })} /> Paid (counts toward wages)
            </label>
            <div className="flex justify-end gap-2" style={{ marginTop: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setClassDraft(null)}>Cancel</Button>
              <Button variant="gold" size="sm" onClick={saveClass} loading={saving}>{classDraft.id ? 'Save' : 'Add'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Slot modal */}
      <Modal open={!!slotDraft} onClose={() => setSlotDraft(null)} title={slotDraft?.id ? 'Edit slot' : 'Add template slot'} width="md">
        {slotDraft && (
          <div className="flex flex-col gap-3">
            <Field label="Day">
              <DarkSelect value={String(slotDraft.day_of_week)} onChange={v => setSlotDraft({ ...slotDraft, day_of_week: Number(v) })} style={fieldStyle}
                options={DAY_LABELS_LONG.map((label, d) => ({ value: String(d), label }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start"><input type="time" style={fieldStyle} value={slotDraft.start_time} onChange={e => setSlotDraft({ ...slotDraft, start_time: e.target.value })} /></Field>
              <Field label="End"><input type="time" style={fieldStyle} value={slotDraft.end_time} onChange={e => setSlotDraft({ ...slotDraft, end_time: e.target.value })} /></Field>
            </div>
            <Field label="Class type">
              <DarkSelect value={slotDraft.class_type_id ?? ''} onChange={v => setSlotDraft({ ...slotDraft, class_type_id: v || null })} style={fieldStyle}
                options={[{ value: '', label: '— None —' }, ...classTypes.map(ct => ({ value: ct.id, label: ct.name }))]} />
            </Field>
            <Field label="Notes"><input style={fieldStyle} value={slotDraft.notes} placeholder="Optional" onChange={e => setSlotDraft({ ...slotDraft, notes: e.target.value })} /></Field>
            <div className="flex items-center justify-between gap-2" style={{ marginTop: 8 }}>
              {slotDraft.id ? <Button variant="danger" size="sm" onClick={() => { const s = template.find(x => x.id === slotDraft.id); if (s) deleteSlot(s); setSlotDraft(null) }}><Trash2 size={14} /> Delete</Button> : <span />}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSlotDraft(null)}>Cancel</Button>
                <Button variant="gold" size="sm" onClick={saveSlot} loading={saving}>{slotDraft.id ? 'Save' : 'Add slot'}</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const miniBtn: React.CSSProperties = {
  padding: 4, borderRadius: 6, border: 'none', background: 'transparent', color: '#8296b4', cursor: 'pointer', display: 'flex', alignItems: 'center',
}
