'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Filter, Plus, GripVertical, Trash2, Edit3, X, ChevronDown, ChevronRight } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface RuleCondition {
  field: string
  op: string
  value: string | boolean
}

interface RuleAction {
  category?: string
  flag?: boolean
  destination?: string
  extract_invoice?: boolean
  create_task?: boolean
  task_priority?: string
}

interface Rule {
  id: string
  name: string
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  action: RuleAction
  match_type: 'all' | 'any'
}

const FIELD_OPTIONS = [
  { value: 'from', label: 'From' },
  { value: 'subject', label: 'Subject' },
  { value: 'body', label: 'Body' },
  { value: 'from_domain', label: 'From Domain' },
  { value: 'has_attachment', label: 'Has Attachment' },
  { value: 'attachment_type', label: 'Attachment Type' },
]

const TEXT_OPS = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'ends_with', label: 'ends with' },
  { value: 'regex', label: 'matches regex' },
]

const BOOL_OPS = [
  { value: 'equals', label: 'is' },
]

const CATEGORIES = [
  { value: 'needs_attention', label: 'Needs Attention' },
  { value: 'new_lead', label: 'New Lead' },
  { value: 'receipt_notification', label: 'Receipt' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'spam', label: 'Spam' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const DESTINATIONS = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'archive', label: 'Archive' },
  { value: 'junk', label: 'Junk' },
]

// ── Main Component ───────────────────────────────────────────────────────────

export function RuleBuilder() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  async function loadRules() {
    setLoading(true)
    try {
      const res = await fetch('/api/inbox/rules')
      if (res.ok) setRules(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadRules() }, [])

  async function toggleEnabled(rule: Rule) {
    await fetch('/api/inbox/rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
    })
    loadRules()
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this rule?')) return
    await fetch('/api/inbox/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadRules()
  }

  async function handleDragEnd(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return
    const reordered = [...rules]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)

    // Update priorities: each rule gets priority = (index + 1) * 10
    const updates = reordered.map((r, i) => ({ id: r.id, priority: (i + 1) * 10 }))
    setRules(reordered.map((r, i) => ({ ...r, priority: (i + 1) * 10 })))

    for (const u of updates) {
      await fetch('/api/inbox/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u),
      })
    }
  }

  const activeCount = rules.filter(r => r.enabled).length

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 overflow-hidden">
      {/* Header — click to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between transition-colors hover:bg-nw-700"
        style={{ padding: '14px 20px', minHeight: 48 }}
      >
        <div className="flex items-center gap-2.5">
          <Filter size={15} className="text-nw-400" />
          <span className="text-[13px] font-medium text-nw-200">Filter Rules</span>
          {activeCount > 0 && <Badge variant="gold">{activeCount} active</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <span
              onClick={(e) => { e.stopPropagation(); setShowNew(true) }}
              className="flex items-center gap-1 text-[11px] font-medium text-gold-300 hover:text-gold-200 transition-colors cursor-pointer"
              style={{ padding: '4px 8px' }}
            >
              <Plus size={12} /> New Rule
            </span>
          )}
          {expanded ? <ChevronDown size={14} className="text-nw-500" /> : <ChevronRight size={14} className="text-nw-500" />}
        </div>
      </button>

      {/* Rule list */}
      {expanded && (
        <div className="border-t border-[rgba(255,255,255,0.06)]">
          {loading ? (
            <div style={{ padding: 20 }} className="text-[13px] text-nw-400">Loading rules...</div>
          ) : rules.length === 0 ? (
            <div style={{ padding: 20 }} className="text-center">
              <p className="text-[13px] text-nw-400">No rules yet</p>
              <p className="text-[11px] text-nw-500 mt-1">Rules run after AI classification and can override its decisions</p>
            </div>
          ) : (
            rules.map((rule, idx) => (
              <div
                key={rule.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (dragIdx !== null) handleDragEnd(dragIdx, idx); setDragIdx(null) }}
                className={`flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] last:border-b-0 transition-colors ${
                  !rule.enabled ? 'opacity-50' : ''
                }`}
                style={{ padding: '10px 20px' }}
              >
                <GripVertical size={14} className="text-nw-600 cursor-grab flex-shrink-0" />

                {/* Toggle */}
                <button
                  onClick={() => toggleEnabled(rule)}
                  className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                    rule.enabled
                      ? 'bg-gold-400/20 border-gold-400/40 text-gold-300'
                      : 'bg-transparent border-nw-600 text-transparent'
                  }`}
                  style={{ minHeight: 20, minWidth: 20 }}
                >
                  {rule.enabled && <span className="text-[10px]">✓</span>}
                </button>

                {/* Name + condition count */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-nw-200 truncate">{rule.name}</p>
                  <p className="text-[10px] text-nw-500">
                    {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} · match {rule.match_type}
                  </p>
                </div>

                {/* Actions */}
                <button
                  onClick={() => setEditingRule(rule)}
                  className="text-nw-400 hover:text-nw-200 transition-colors"
                  style={{ padding: 4, minHeight: 32, minWidth: 32 }}
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="text-nw-400 hover:text-red-400 transition-colors"
                  style={{ padding: 4, minHeight: 32, minWidth: 32 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* New/Edit modal */}
      {(showNew || editingRule) && (
        <RuleEditorModal
          rule={editingRule}
          onClose={() => { setShowNew(false); setEditingRule(null) }}
          onSaved={() => { setShowNew(false); setEditingRule(null); loadRules() }}
        />
      )}
    </div>
  )
}

// ── Rule Editor Modal ────────────────────────────────────────────────────────

function RuleEditorModal({ rule, onClose, onSaved }: { rule: Rule | null; onClose: () => void; onSaved: () => void }) {
  const isNew = !rule

  const [name, setName] = useState(rule?.name ?? '')
  const [matchType, setMatchType] = useState<'all' | 'any'>(rule?.match_type ?? 'all')
  const [conditions, setConditions] = useState<RuleCondition[]>(rule?.conditions ?? [{ field: 'from', op: 'contains', value: '' }])
  const [action, setAction] = useState<RuleAction>(rule?.action ?? {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addCondition() {
    setConditions([...conditions, { field: 'from', op: 'contains', value: '' }])
  }

  function removeCondition(idx: number) {
    setConditions(conditions.filter((_, i) => i !== idx))
  }

  function updateCondition(idx: number, updates: Partial<RuleCondition>) {
    setConditions(conditions.map((c, i) => i === idx ? { ...c, ...updates } : c))
  }

  async function save() {
    if (!name.trim()) { setError('Name is required'); return }
    if (conditions.length === 0) { setError('At least one condition is required'); return }
    const hasAction = action.category || action.flag || action.destination || action.extract_invoice || action.create_task
    if (!hasAction) { setError('At least one action is required'); return }

    // Validate regex conditions
    for (const c of conditions) {
      if (c.op === 'regex') {
        try { new RegExp(String(c.value)) } catch { setError(`Invalid regex: ${c.value}`); return }
      }
    }

    setSaving(true)
    setError(null)
    try {
      const body = isNew
        ? { name, match_type: matchType, conditions, action }
        : { id: rule!.id, name, match_type: matchType, conditions, action }

      const res = await fetch('/api/inbox/rules', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) onSaved()
      else setError((await res.json()).error ?? 'Failed to save')
    } catch { setError('Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'New Rule' : `Edit: ${rule!.name}`} width="lg">
      <div className="flex flex-col gap-4" style={{ padding: 0 }}>
        {/* Name */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Rule Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)]"
            style={{ padding: '8px 12px' }}
            placeholder="e.g. GoCardless failed payments"
          />
        </div>

        {/* Match type */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Match</label>
          <div className="flex gap-3">
            {(['all', 'any'] as const).map(t => (
              <label key={t} className="flex items-center gap-1.5 text-[13px] text-nw-200 cursor-pointer">
                <input type="radio" checked={matchType === t} onChange={() => setMatchType(t)} className="accent-[#c9a70a]" />
                {t === 'all' ? 'All conditions' : 'Any condition'}
              </label>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-2">Conditions</label>
          <div className="flex flex-col gap-2">
            {conditions.map((c, idx) => {
              const isBool = c.field === 'has_attachment'
              const ops = isBool ? BOOL_OPS : TEXT_OPS
              return (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={c.field}
                    onChange={e => updateCondition(idx, { field: e.target.value, op: e.target.value === 'has_attachment' ? 'equals' : c.op, value: e.target.value === 'has_attachment' ? true : '' })}
                    className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
                    style={{ padding: '6px 8px' }}
                  >
                    {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <select
                    value={c.op}
                    onChange={e => updateCondition(idx, { op: e.target.value })}
                    className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
                    style={{ padding: '6px 8px' }}
                  >
                    {ops.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {isBool ? (
                    <select
                      value={String(c.value)}
                      onChange={e => updateCondition(idx, { value: e.target.value === 'true' })}
                      className="flex-1 rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
                      style={{ padding: '6px 8px' }}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      value={String(c.value)}
                      onChange={e => updateCondition(idx, { value: e.target.value })}
                      className="flex-1 rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
                      style={{ padding: '6px 8px' }}
                      placeholder="value"
                    />
                  )}
                  <button onClick={() => removeCondition(idx)} className="text-nw-500 hover:text-red-400" style={{ padding: 4 }}>
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
          <button onClick={addCondition} className="mt-2 text-[11px] font-medium text-gold-300 hover:text-gold-200 flex items-center gap-1">
            <Plus size={11} /> Add condition
          </button>
        </div>

        {/* Actions */}
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-2">Then</label>
          <div className="flex flex-col gap-2.5">
            {/* Set category */}
            <label className="flex items-center gap-2 text-[13px] text-nw-200">
              <input type="checkbox" checked={action.category != null} onChange={e => setAction(a => e.target.checked ? { ...a, category: 'needs_attention' } : (() => { const { category: _, ...rest } = a; return rest })())} className="accent-[#c9a70a]" />
              Set category to
              <select
                value={action.category ?? ''}
                onChange={e => setAction(a => ({ ...a, category: e.target.value }))}
                disabled={action.category == null}
                className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none disabled:opacity-40"
                style={{ padding: '4px 8px' }}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>

            {/* Flag */}
            <label className="flex items-center gap-2 text-[13px] text-nw-200">
              <input type="checkbox" checked={action.flag === true} onChange={e => setAction(a => e.target.checked ? { ...a, flag: true } : (() => { const { flag: _, ...rest } = a; return rest })())} className="accent-[#c9a70a]" />
              Flag email
            </label>

            {/* Move to */}
            <label className="flex items-center gap-2 text-[13px] text-nw-200">
              <input type="checkbox" checked={action.destination != null} onChange={e => setAction(a => e.target.checked ? { ...a, destination: 'inbox' } : (() => { const { destination: _, ...rest } = a; return rest })())} className="accent-[#c9a70a]" />
              Move to
              <select
                value={action.destination ?? ''}
                onChange={e => setAction(a => ({ ...a, destination: e.target.value }))}
                disabled={action.destination == null}
                className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none disabled:opacity-40"
                style={{ padding: '4px 8px' }}
              >
                {DESTINATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>

            {/* Extract invoice */}
            <label className="flex items-center gap-2 text-[13px] text-nw-200">
              <input type="checkbox" checked={action.extract_invoice === true} onChange={e => setAction(a => e.target.checked ? { ...a, extract_invoice: true } : (() => { const { extract_invoice: _, ...rest } = a; return rest })())} className="accent-[#c9a70a]" />
              Extract invoice PDF
            </label>

            {/* Create task */}
            <label className="flex items-center gap-2 text-[13px] text-nw-200">
              <input type="checkbox" checked={action.create_task === true} onChange={e => setAction(a => e.target.checked ? { ...a, create_task: true } : (() => { const { create_task: _, ...rest } = a; return rest })())} className="accent-[#c9a70a]" />
              Create task with priority
              <select
                value={action.task_priority ?? 'medium'}
                onChange={e => setAction(a => ({ ...a, task_priority: e.target.value }))}
                disabled={!action.create_task}
                className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none disabled:opacity-40"
                style={{ padding: '4px 8px' }}
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-[12px] text-red-400">{error}</p>}

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="default" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="sm" onClick={save} loading={saving}>
            {isNew ? 'Create Rule' : 'Save Rule'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
