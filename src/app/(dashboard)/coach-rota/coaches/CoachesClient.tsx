'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Mail, Phone, Trash2, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { CLASS_COLOUR_PRESETS } from '@/lib/rota'
import type { RotaCoach } from '@/lib/rota'

const fieldStyle: React.CSSProperties = {
  padding: '9px 12px', fontSize: 14, width: '100%', borderRadius: 10,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#edf3fb',
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#8296b4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      {children}
    </label>
  )
}

interface Draft { id?: string; name: string; email: string; phone: string; color: string; active: boolean }

export function CoachesClient() {
  const [coaches, setCoaches] = useState<RotaCoach[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/coach-rota/coaches').then(r => r.json())
    setCoaches(res.coaches ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  function openNew() { setErr(null); setDraft({ name: '', email: '', phone: '', color: CLASS_COLOUR_PRESETS[0], active: true }) }
  function openEdit(c: RotaCoach) { setErr(null); setDraft({ id: c.id, name: c.name, email: c.email, phone: c.phone ?? '', color: c.color ?? CLASS_COLOUR_PRESETS[0], active: c.active }) }

  async function save() {
    if (!draft) return
    setSaving(true); setErr(null)
    const res = draft.id
      ? await fetch('/api/coach-rota/coaches', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: draft.id, name: draft.name, phone: draft.phone, color: draft.color, active: draft.active }) })
      : await fetch('/api/coach-rota/coaches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
    setSaving(false)
    if (!res.ok) { const e = await res.json().catch(() => ({})); setErr(e.error ?? 'Save failed'); return }
    setDraft(null); load()
  }

  async function deactivate(c: RotaCoach) {
    if (!confirm(`Deactivate ${c.name}? Their past hours are kept, but they won’t be assignable.`)) return
    await fetch(`/api/coach-rota/coaches?id=${c.id}`, { method: 'DELETE' })
    load()
  }

  async function activate(c: RotaCoach) {
    if (!confirm(`Turn on login for ${c.name}? Nothing is sent to them — they can then sign in at /coach with a link they request themselves.`)) return
    setActivating(c.id)
    const res = await fetch('/api/coach-rota/coaches/activate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) })
    setActivating(null)
    if (!res.ok) { const e = await res.json().catch(() => ({})); alert(e.error ?? 'Could not activate'); return }
    load()
  }

  const active = coaches.filter(c => c.active)
  const inactive = coaches.filter(c => !c.active)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Coaching" title="Coaches" description={`${active.length} active`} actions={<Button variant="gold" size="sm" onClick={openNew}><Plus size={15} /> Add coach</Button>} />

      <Panel>
        <div style={{ padding: 8 }}>
          {loading && <p style={{ padding: 16, color: '#8296b4', fontSize: 14 }}>Loading…</p>}
          {!loading && coaches.length === 0 && <p style={{ padding: 16, color: '#8296b4', fontSize: 14 }}>No coaches yet. Add your first coach to get started.</p>}
          {[...active, ...inactive].map(c => (
            <div key={c.id} className="flex items-center gap-3" style={{ padding: '12px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: c.active ? 1 : 0.55 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: c.color ?? '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{c.name.slice(0, 1).toUpperCase()}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#edf3fb' }}>{c.name}</span>
                  {!c.active && <Badge variant="paused">Inactive</Badge>}
                  {c.user_id ? <Badge variant="green">Login on</Badge> : <Badge variant="amber">No login</Badge>}
                </div>
                <div className="flex items-center gap-3" style={{ fontSize: 12, color: '#8296b4', marginTop: 2 }}>
                  <span className="inline-flex items-center gap-1"><Mail size={11} />{c.email}</span>
                  {c.phone && <span className="inline-flex items-center gap-1"><Phone size={11} />{c.phone}</span>}
                </div>
              </div>
              {c.active && !c.user_id && (
                <Button variant="secondary" size="sm" onClick={() => activate(c)} loading={activating === c.id}>Activate login</Button>
              )}
              <button onClick={() => openEdit(c)} style={iconBtn} aria-label="Edit"><Pencil size={14} /></button>
              {c.active && <button onClick={() => deactivate(c)} style={iconBtn} aria-label="Deactivate"><Trash2 size={14} /></button>}
            </div>
          ))}
        </div>
      </Panel>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit coach' : 'Add coach'} width="md">
        {draft && (
          <div className="flex flex-col gap-3">
            <Field label="Name"><input style={fieldStyle} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="Email (their login)"><input style={{ ...fieldStyle, opacity: draft.id ? 0.6 : 1 }} type="email" value={draft.email} disabled={!!draft.id} onChange={e => setDraft({ ...draft, email: e.target.value })} /></Field>
            <Field label="Phone"><input style={fieldStyle} value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} /></Field>
            <Field label="Colour (on the rota)">
              <div className="flex gap-2 flex-wrap" style={{ marginTop: 2 }}>
                {CLASS_COLOUR_PRESETS.map(col => (
                  <button key={col} onClick={() => setDraft({ ...draft, color: col })} aria-label={col} style={{ width: 26, height: 26, borderRadius: 8, background: col, cursor: 'pointer', border: draft.color === col ? '2px solid #fff' : '2px solid transparent' }} />
                ))}
              </div>
            </Field>
            {draft.id && (
              <label className="inline-flex items-center gap-2" style={{ fontSize: 13, color: '#8296b4', cursor: 'pointer' }}>
                <input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} /> Active
              </label>
            )}
            {!draft.id && <p style={{ fontSize: 12, color: '#8296b4' }}>They’ll log in at <strong className="text-nw-300">/coach</strong> with a magic link sent to this email.</p>}
            {err && <p style={{ fontSize: 13, color: '#f87171' }}>{err}</p>}
            <div className="flex justify-end gap-2" style={{ marginTop: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
              <Button variant="gold" size="sm" onClick={save} loading={saving}>{draft.id ? 'Save' : 'Add coach'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)',
  color: '#8296b4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
