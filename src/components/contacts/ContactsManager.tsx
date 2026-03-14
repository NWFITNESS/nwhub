'use client'

import { useState, useRef } from 'react'
import { Pencil, Trash2, Upload, Plus, Search, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { format } from 'date-fns'
import type { Contact } from '@/lib/types'

// ---------------------------------------------------------------------------
// Phone normalisation
// ---------------------------------------------------------------------------
function normaliseUKPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('447') && digits.length === 12) return `+${digits}`
  if (digits.startsWith('07') && digits.length === 11) return `+44${digits.slice(1)}`
  if (digits.startsWith('44') && digits.length === 12) return `+${digits}`
  return null
}

// ---------------------------------------------------------------------------
// Client-side CSV parser
// ---------------------------------------------------------------------------
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current.trim())
  return fields
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  return {
    headers: parseCsvLine(lines[0]),
    rows: lines.slice(1).map(parseCsvLine),
  }
}

// ---------------------------------------------------------------------------
// Auto-mapping
// ---------------------------------------------------------------------------
const FIELD_ALIASES: Record<string, string[]> = {
  first_name: ['first_name', 'firstname', 'first', 'given_name', 'forename', 'name'],
  last_name:  ['last_name', 'lastname', 'last', 'surname', 'family_name'],
  email:      ['email', 'email_address', 'e_mail', 'emailaddress'],
  phone:      ['phone', 'mobile', 'phone_number', 'mobile_number', 'telephone', 'tel', 'cell'],
  groups:     ['groups', 'group', 'tags', 'tag', 'category', 'categories', 'membership'],
  notes:      ['notes', 'note', 'comments', 'comment', 'remarks', 'description'],
}

const IMPORT_FIELDS = [
  { key: 'first_name', label: 'First name', required: true },
  { key: 'last_name',  label: 'Last name',  required: false },
  { key: 'email',      label: 'Email',       required: false },
  { key: 'phone',      label: 'Phone (UK)',  required: false },
  { key: 'groups',     label: 'Groups',      required: false },
  { key: 'notes',      label: 'Notes',       required: false },
] as const

function autoMap(headers: string[]): Record<string, string> {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[\s\-\.]+/g, '_').replace(/[^a-z_]/g, '')
  const result: Record<string, string> = {}
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    const found = headers.find((h) => aliases.includes(norm(h)))
    if (found) result[field] = found
  }
  return result
}

// ---------------------------------------------------------------------------
// Source badge colours
// ---------------------------------------------------------------------------
const sourceBadge: Record<string, string> = {
  manual:      'bg-white/5 text-white/50 border-white/10',
  import:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  squarespace: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  wodboard:    'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

// ---------------------------------------------------------------------------
// Tag input
// ---------------------------------------------------------------------------
function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag…',
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setInput('')
  }

  return (
    <div className="flex flex-wrap gap-1.5 min-h-[38px] px-3 py-2 rounded-lg bg-[#111] border border-white/10 focus-within:border-[#967705]/60 transition-colors">
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[#967705]/20 text-[#c9a70a] border border-[#967705]/30">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-white transition-colors">
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input) }
          else if (e.key === 'Backspace' && input === '' && tags.length > 0) onChange(tags.slice(0, -1))
        }}
        onBlur={() => { if (input.trim()) addTag(input) }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-white outline-none placeholder:text-white/25"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared form sub-components
// ---------------------------------------------------------------------------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors"
    />
  )
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyContacts({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-white/[0.08] px-8 py-16 flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center">
        <Search size={20} className="text-white/20" />
      </div>
      <p className="text-white/40 text-sm">No contacts yet.</p>
      <Button variant="primary" size="sm" onClick={onAdd}>
        <Plus size={15} />Add your first contact
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface Props { initialContacts: Contact[] }

type FormState = {
  first_name: string; last_name: string; email: string; phone: string
  groups: string[]; notes: string; status: 'active' | 'inactive'
}

const emptyForm: FormState = {
  first_name: '', last_name: '', email: '', phone: '', groups: [], notes: '', status: 'active',
}

type ImportStep = 'upload' | 'map' | 'result'

export function ContactsManager({ initialContacts }: Props) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [search, setSearch]     = useState('')
  const [groupFilter, setGroupFilter] = useState('all')

  // Modals
  const [addEditModal, setAddEditModal] = useState(false)
  const [editTarget, setEditTarget]     = useState<Contact | null>(null)
  const [importModal, setImportModal]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)

  // Contact form
  const [form, setForm]         = useState<FormState>(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState('')

  // Import
  const [importStep, setImportStep]       = useState<ImportStep>('upload')
  const [csvHeaders, setCsvHeaders]       = useState<string[]>([])
  const [csvRows, setCsvRows]             = useState<string[][]>([])
  const [fieldMap, setFieldMap]           = useState<Record<string, string>>({})
  const [importResult, setImportResult]   = useState<{ inserted: number; errors: { row: number; reason: string }[] } | null>(null)
  const [importing, setImporting]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Delete
  const [deleting, setDeleting] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [newGroupInput, setNewGroupInput]     = useState('')
  const [bulkAssigning, setBulkAssigning]     = useState(false)

  // Derived
  const allGroups = Array.from(new Set(contacts.flatMap((c) => c.groups))).sort()
  const filtered  = contacts.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q)
    const matchGroup = groupFilter === 'all' || c.groups.includes(groupFilter)
    return matchSearch && matchGroup
  })

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))
  const someFilteredSelected = filtered.some((c) => selectedIds.has(c.id))

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => { const next = new Set(prev); filtered.forEach((c) => next.delete(c.id)); return next })
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); filtered.forEach((c) => next.add(c.id)); return next })
    }
  }

  async function handleBulkAddGroup(group: string) {
    const trimmed = group.trim().toLowerCase()
    if (!trimmed || !selectedIds.size) return
    setBulkAssigning(true)
    const res = await fetch('/api/contacts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds), action: 'add_group', group: trimmed }),
    })
    if (res.ok) {
      setContacts((prev) =>
        prev.map((c) =>
          selectedIds.has(c.id) && !c.groups.includes(trimmed)
            ? { ...c, groups: [...c.groups, trimmed] }
            : c
        )
      )
    }
    setBulkAssigning(false)
  }

  function handleNewGroupSubmit() {
    const g = newGroupInput.trim()
    if (!g) return
    handleBulkAddGroup(g)
    setNewGroupInput('')
    setShowNewGroupInput(false)
  }

  // -------------------------------------------------------------------------
  // Add / edit modal
  // -------------------------------------------------------------------------
  function openAdd() {
    setEditTarget(null); setForm(emptyForm); setFormError(''); setAddEditModal(true)
  }
  function openEdit(contact: Contact) {
    setEditTarget(contact)
    setForm({
      first_name: contact.first_name, last_name: contact.last_name,
      email: contact.email ?? '', phone: contact.phone ?? '',
      groups: contact.groups, notes: contact.notes ?? '', status: contact.status,
    })
    setFormError(''); setAddEditModal(true)
  }

  async function handleSave() {
    setSaving(true); setFormError('')
    const phone = form.phone.trim() ? normaliseUKPhone(form.phone.trim()) : null
    if (form.phone.trim() && !phone) {
      setFormError('Not a valid UK mobile (07xxx or +447xxx).'); setSaving(false); return
    }
    const body = {
      first_name: form.first_name.trim(), last_name: form.last_name.trim(),
      email: form.email.trim() || null, phone,
      groups: form.groups, notes: form.notes.trim() || null, status: form.status,
    }
    const url    = editTarget ? `/api/contacts/${editTarget.id}` : '/api/contacts'
    const method = editTarget ? 'PATCH' : 'POST'
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }))
      setFormError(error ?? 'Failed to save.'); setSaving(false); return
    }
    const saved: Contact = await res.json()
    setContacts((prev) => editTarget ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev])
    setAddEditModal(false); setSaving(false)
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/contacts/${deleteTarget.id}`, { method: 'DELETE' })
    setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    setDeleteTarget(null); setDeleting(false)
  }

  // -------------------------------------------------------------------------
  // Import — file select → parse → map step
  // -------------------------------------------------------------------------
  function openImport() {
    setImportStep('upload'); setImportResult(null)
    setCsvHeaders([]); setCsvRows([]); setFieldMap({})
    setImportModal(true)
  }

  function handleFileSelect(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)
      setCsvHeaders(headers)
      setCsvRows(rows.filter((r) => r.some((c) => c.trim())))
      setFieldMap(autoMap(headers))
      setImportStep('map')
    }
    reader.readAsText(file)
  }

  // -------------------------------------------------------------------------
  // Import — confirm mapping → POST JSON
  // -------------------------------------------------------------------------
  async function handleConfirmImport() {
    setImporting(true)

    function getCol(field: string, row: string[]): string | null {
      const col = fieldMap[field]
      if (!col) return null
      const idx = csvHeaders.indexOf(col)
      return idx >= 0 ? (row[idx]?.trim() || null) : null
    }

    const mapped = csvRows.map((row) => ({
      first_name: getCol('first_name', row) ?? '',
      last_name:  getCol('last_name', row) ?? '',
      email:      getCol('email', row),
      phone:      getCol('phone', row),
      groups:     (getCol('groups', row) ?? '').split(';').map((g) => g.trim().toLowerCase()).filter(Boolean),
      notes:      getCol('notes', row),
    })).filter((c) => c.first_name || c.email || c.phone)

    const res = await fetch('/api/contacts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: mapped }),
    })
    const json = await res.json()
    // Normalise: API may return { error } on failure — ensure shape is always { inserted, errors }
    const result = res.ok
      ? json
      : { inserted: 0, errors: [{ row: 0, reason: json.error ?? 'Import failed' }] }
    setImportResult(result)
    setImportStep('result')
    setImporting(false)

    const freshRes = await fetch('/api/contacts')
    if (freshRes.ok) {
      const freshData = await freshRes.json()
      if (Array.isArray(freshData)) setContacts(freshData)
    }
  }

  // -------------------------------------------------------------------------
  // Map step helpers
  // -------------------------------------------------------------------------
  function getPreviewValue(field: string): string {
    const col = fieldMap[field]
    if (!col) return '—'
    const idx = csvHeaders.indexOf(col)
    const val = csvRows[0]?.[idx]?.trim()
    return val ? `"${val}"` : '—'
  }

  const mappedFields = IMPORT_FIELDS.filter((f) => fieldMap[f.key])
  const previewRows  = csvRows.slice(0, 3)

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            style={{ paddingLeft: '2.25rem' }}
            className="w-full pr-4 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10" />
        </div>
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white focus:outline-none focus:border-[#967705]/60 transition-colors"
        >
          <option value="all">All groups</option>
          {allGroups.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <Button variant="secondary" size="sm" onClick={openImport}>
          <Upload size={14} />Import
        </Button>
        <Button variant="primary" size="sm" onClick={openAdd}>
          <Plus size={14} />Add Contact
        </Button>
      </div>

      {/* Bulk selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center flex-wrap gap-2 px-4 py-3 rounded-xl border border-[#967705]/25 bg-[#967705]/5 mb-4">
          <span className="text-sm font-medium text-[#c9a70a]">{selectedIds.size} selected</span>
          <button onClick={() => setSelectedIds(new Set())} className="p-1 rounded text-white/30 hover:text-white transition-colors" aria-label="Clear selection">
            <X size={13} />
          </button>
          <div className="h-4 w-px bg-white/[0.12] mx-0.5" />
          <span className="text-xs text-white/40">Add to group:</span>
          {allGroups.map((g) => (
            <button
              key={g}
              onClick={() => handleBulkAddGroup(g)}
              disabled={bulkAssigning}
              className="px-2.5 py-1 rounded-full text-xs bg-[#967705]/15 text-[#c9a70a] border border-[#967705]/25 hover:bg-[#967705]/30 transition-colors disabled:opacity-50"
            >
              {g}
            </button>
          ))}
          {showNewGroupInput ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNewGroupSubmit()
                  if (e.key === 'Escape') { setShowNewGroupInput(false); setNewGroupInput('') }
                }}
                onBlur={() => { if (!newGroupInput.trim()) setShowNewGroupInput(false) }}
                placeholder="Group name…"
                className="px-2.5 py-1 rounded-lg bg-[#111] border border-[#967705]/40 text-xs text-white placeholder:text-white/25 focus:outline-none w-32"
              />
              <Button variant="primary" size="sm" onClick={handleNewGroupSubmit} disabled={!newGroupInput.trim()}>Add</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewGroupInput(true)}
              className="px-2.5 py-1 rounded-full text-xs text-white/40 border border-white/10 hover:border-white/25 hover:text-white/70 transition-colors"
            >
              + New group
            </button>
          )}
          {bulkAssigning && <span className="text-xs text-white/30 animate-pulse ml-1">Saving…</span>}
        </div>
      )}

      {/* Table */}
      {contacts.length === 0 ? (
        <EmptyContacts onAdd={openAdd} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="pl-6 pr-2 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected }}
                    onChange={toggleSelectAll}
                    className="accent-[#967705] w-4 h-4 cursor-pointer rounded"
                  />
                </th>
                {['Name', 'Email', 'Phone', 'Groups', 'Source', 'Added', ''].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-white/30">No contacts match your search</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors ${selectedIds.has(c.id) ? 'bg-[#967705]/5' : ''}`}>
                  <td className="pl-6 pr-2 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="accent-[#967705] w-4 h-4 cursor-pointer rounded"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{c.first_name} {c.last_name}</td>
                  <td className="px-6 py-4 text-white/60">{c.email ?? '—'}</td>
                  <td className="px-6 py-4 text-white/60 font-mono text-xs">{c.phone ?? '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.groups.length === 0 ? (
                        <span className="text-white/25">—</span>
                      ) : c.groups.map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded-full text-xs bg-[#967705]/15 text-[#c9a70a] border border-[#967705]/25">{g}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${sourceBadge[c.source] ?? sourceBadge.manual}`}>
                      {c.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/40 text-xs">{format(new Date(c.created_at), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-md text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors" aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Modal                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Modal open={addEditModal} onClose={() => setAddEditModal(false)} title={editTarget ? 'Edit Contact' : 'Add Contact'} width="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              <TextInput value={form.first_name} onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} placeholder="John" />
            </Field>
            <Field label="Last name">
              <TextInput value={form.last_name} onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} placeholder="Smith" />
            </Field>
          </div>
          <Field label="Email">
            <TextInput type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} placeholder="john@example.com" />
          </Field>
          <Field label="UK Phone (+44…)">
            <TextInput type="tel" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="07700 000000 or +447700000000" />
          </Field>
          <Field label="Groups (press Enter or comma to add)">
            <TagInput tags={form.groups} onChange={(groups) => setForm((f) => ({ ...f, groups }))} placeholder="members, vip…" />
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3} placeholder="Optional notes…"
              className="w-full px-3 py-2 rounded-lg bg-[#111] border border-white/10 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/60 transition-colors resize-none"
            />
          </Field>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">Status</span>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: f.status === 'active' ? 'inactive' : 'active' }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.status === 'active' ? 'bg-[#967705]' : 'bg-white/15'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.status === 'active' ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-white/60">{form.status}</span>
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setAddEditModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              {editTarget ? 'Save changes' : 'Add contact'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Import Modal                                                         */}
      {/* ------------------------------------------------------------------ */}
      <Modal
        open={importModal}
        onClose={() => setImportModal(false)}
        title={importStep === 'upload' ? 'Import Contacts' : importStep === 'map' ? 'Map Columns' : 'Import Complete'}
        width={importStep === 'map' ? 'xl' : 'lg'}
      >
        {/* Step 1 — Upload */}
        {importStep === 'upload' && (
          <div className="space-y-5">
            <div className="rounded-lg bg-[#0d0d0d] border border-white/[0.07] p-4 text-sm text-white/50 space-y-1.5">
              <p className="font-medium text-white/70">Any CSV format works</p>
              <p>Upload your file and we&apos;ll let you map the columns to the right fields on the next step.</p>
              <p className="text-white/35">Download the template if you&apos;re starting fresh.</p>
            </div>
            <a href="/api/contacts/template" download>
              <Button variant="secondary" size="sm"><Download size={14} />Download template CSV</Button>
            </a>
            <div
              className="rounded-xl border-2 border-dashed border-white/[0.1] hover:border-[#967705]/40 transition-colors p-8 flex flex-col items-center gap-3 cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
            >
              <Upload size={24} className="text-white/20" />
              <p className="text-sm text-white/50">Drag & drop CSV file, or <span className="text-[#c9a70a] underline underline-offset-2">browse</span></p>
              <p className="text-xs text-white/25">.csv files only</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
            </div>
          </div>
        )}

        {/* Step 2 — Map */}
        {importStep === 'map' && (
          <div className="space-y-5">
            <p className="text-sm text-white/50">
              Match your CSV columns to our contact fields. Anything set to <span className="text-white/70">(skip)</span> will be ignored.
            </p>

            {/* Mapping table */}
            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-36">Our field</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Your CSV column</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-48">Preview (first row)</th>
                  </tr>
                </thead>
                <tbody>
                  {IMPORT_FIELDS.map((f) => (
                    <tr key={f.key} className="border-b border-white/[0.04] last:border-0">
                      <td className="px-4 py-2.5 text-white/70 text-xs font-medium">
                        {f.label}
                        {f.required && <span className="ml-1 text-red-400">*</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={fieldMap[f.key] ?? ''}
                          onChange={(e) => setFieldMap((m) => ({ ...m, [f.key]: e.target.value }))}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#111] border border-white/10 text-sm text-white focus:outline-none focus:border-[#967705]/60 transition-colors"
                        >
                          <option value="">(skip)</option>
                          {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 text-white/40 text-xs font-mono truncate max-w-[180px]">
                        {getPreviewValue(f.key)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Data preview */}
            {mappedFields.length > 0 && previewRows.length > 0 && (
              <div>
                <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Data preview — first {previewRows.length} rows</p>
                <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {mappedFields.map((f) => (
                          <th key={f.key} className="px-3 py-2 text-left font-medium text-white/30 whitespace-nowrap">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri} className="border-b border-white/[0.04] last:border-0">
                          {mappedFields.map((f) => {
                            const idx = csvHeaders.indexOf(fieldMap[f.key] ?? '')
                            return (
                              <td key={f.key} className="px-3 py-2 text-white/55 max-w-[160px] truncate">
                                {row[idx]?.trim() || <span className="text-white/20">—</span>}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs text-white/35">{csvRows.length} rows to import</span>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={() => setImportStep('upload')}>← Back</Button>
                <Button variant="primary" size="sm" onClick={handleConfirmImport} loading={importing}>
                  Import {csvRows.length} rows →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Result */}
        {importStep === 'result' && importResult && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <span className="text-green-400 text-lg">✓</span>
              <p className="text-green-400 font-medium">
                {importResult.inserted} contact{importResult.inserted !== 1 ? 's' : ''} imported
              </p>
            </div>
            {(importResult.errors?.length ?? 0) > 0 && (
              <div className="rounded-lg border border-red-500/20 overflow-hidden">
                <p className="px-4 py-2 text-xs font-medium text-red-400 bg-red-500/10 border-b border-red-500/20">
                  {importResult.errors?.length} row{importResult.errors?.length !== 1 ? 's' : ''} skipped
                </p>
                <div className="divide-y divide-white/[0.05] max-h-48 overflow-y-auto">
                  {importResult.errors.map((err) => (
                    <div key={err.row} className="px-4 py-2 text-xs text-white/50">
                      <span className="text-white/30">Row {err.row}:</span> {err.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between gap-3 pt-2 border-t border-white/10">
              <Button variant="ghost" size="sm" onClick={() => { setImportStep('upload'); setImportResult(null) }}>
                Import another file
              </Button>
              <Button variant="primary" size="sm" onClick={() => setImportModal(false)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete contact"
        message={`Delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
