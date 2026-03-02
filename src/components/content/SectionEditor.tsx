'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field } from '@/components/ui/Input'
import { ImageField } from '@/components/media/MediaPicker'
import { Plus, Trash2, GripVertical } from 'lucide-react'

interface SectionEditorProps {
  pageSlug: string
  sectionKey: string
  initialContent: Record<string, unknown>
  onSave: (sectionKey: string, content: Record<string, unknown>) => Promise<void>
  onContentChange?: (content: Record<string, unknown>) => void
  saveLabel?: string
}

// Generic field editor for unknown content
function JsonFallbackEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const [raw, setRaw] = useState(JSON.stringify(content, null, 2))
  const [err, setErr] = useState('')

  return (
    <div>
      <Textarea
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value)
          try {
            onChange(JSON.parse(e.target.value))
            setErr('')
          } catch {
            setErr('Invalid JSON')
          }
        }}
        className="font-mono text-xs min-h-[200px]"
      />
      {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
    </div>
  )
}

function ArrayItemWrapper({
  index,
  onRemove,
  children,
}: {
  index: number
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-white/10 rounded-lg p-4 relative">
      <div className="flex items-center gap-2 mb-3">
        <GripVertical size={14} className="text-white/20 flex-shrink-0" />
        <span className="text-xs text-white/30 font-medium">Item {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto text-white/30 hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {children}
    </div>
  )
}

// Hero section editor
function HeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const s = content as { kicker?: string; heading?: string; subtext?: string; image_url?: string }
  return (
    <div className="space-y-4">
      <Field label="Kicker (small text above heading)">
        <Input value={s.kicker ?? ''} onChange={(e) => onChange({ ...content, kicker: e.target.value })} />
      </Field>
      <Field label="Heading">
        <Textarea value={s.heading ?? ''} onChange={(e) => onChange({ ...content, heading: e.target.value })} className="min-h-[60px]" />
      </Field>
      <Field label="Subtext">
        <Textarea value={s.subtext ?? ''} onChange={(e) => onChange({ ...content, subtext: e.target.value })} />
      </Field>
      <Field label="Background Image">
        <ImageField value={s.image_url ?? ''} onChange={(url) => onChange({ ...content, image_url: url })} />
      </Field>
    </div>
  )
}

// FAQ section editor
function FaqEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const items = (content.items as Array<{ q: string; a: string }>) ?? []

  function updateItem(i: number, field: 'q' | 'a', value: string) {
    const next = items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    onChange({ ...content, items: next })
  }
  function addItem() {
    onChange({ ...content, items: [...items, { q: '', a: '' }] })
  }
  function removeItem(i: number) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      {content.heading !== undefined && (
        <Field label="Section Heading">
          <Input value={String(content.heading ?? '')} onChange={(e) => onChange({ ...content, heading: e.target.value })} />
        </Field>
      )}
      {items.map((item, i) => (
        <ArrayItemWrapper key={i} index={i} onRemove={() => removeItem(i)}>
          <Field label="Question">
            <Input value={item.q} onChange={(e) => updateItem(i, 'q', e.target.value)} />
          </Field>
          <Field label="Answer" className="mt-3">
            <Textarea value={item.a} onChange={(e) => updateItem(i, 'a', e.target.value)} />
          </Field>
        </ArrayItemWrapper>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem} type="button">
        <Plus size={14} /> Add FAQ Item
      </Button>
    </div>
  )
}

// Memberships / pricing cards editor
function MembershipsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const cards = (content.cards as Array<{ title: string; price: string; period: string; desc: string; highlight?: boolean }>) ?? []

  function updateCard(i: number, field: string, value: unknown) {
    const next = cards.map((c, idx) => (idx === i ? { ...c, [field]: value } : c))
    onChange({ ...content, cards: next })
  }
  function addCard() {
    onChange({ ...content, cards: [...cards, { title: '', price: '', period: '/month', desc: '', highlight: false }] })
  }
  function removeCard(i: number) {
    onChange({ ...content, cards: cards.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      {content.heading !== undefined && (
        <Field label="Section Heading">
          <Input value={String(content.heading ?? '')} onChange={(e) => onChange({ ...content, heading: e.target.value })} />
        </Field>
      )}
      {cards.map((card, i) => (
        <ArrayItemWrapper key={i} index={i} onRemove={() => removeCard(i)}>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Title" className="col-span-3">
              <Input value={card.title} onChange={(e) => updateCard(i, 'title', e.target.value)} />
            </Field>
            <Field label="Price">
              <Input value={card.price} onChange={(e) => updateCard(i, 'price', e.target.value)} placeholder="£XX" />
            </Field>
            <Field label="Period">
              <Input value={card.period} onChange={(e) => updateCard(i, 'period', e.target.value)} placeholder="/month" />
            </Field>
            <Field label="Highlight?">
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={!!card.highlight} onChange={(e) => updateCard(i, 'highlight', e.target.checked)} className="w-4 h-4 accent-[#967705]" />
                <span className="text-xs text-white/60">Featured card</span>
              </label>
            </Field>
          </div>
          <Field label="Description" className="mt-3">
            <Textarea value={card.desc} onChange={(e) => updateCard(i, 'desc', e.target.value)} />
          </Field>
        </ArrayItemWrapper>
      ))}
      <Button variant="ghost" size="sm" onClick={addCard} type="button">
        <Plus size={14} /> Add Plan
      </Button>
    </div>
  )
}

// Generic array-of-objects editor
function GenericArrayEditor({ content, onChange, fields }: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  fields: Array<{ key: string; label: string; multiline?: boolean }>
}) {
  const items = (content.items as Array<Record<string, string>>) ?? []

  function updateItem(i: number, field: string, value: string) {
    const next = items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    onChange({ ...content, items: next })
  }
  function addItem() {
    onChange({ ...content, items: [...items, Object.fromEntries(fields.map((f) => [f.key, '']))] })
  }
  function removeItem(i: number) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-3">
      {content.heading !== undefined && (
        <Field label="Section Heading">
          <Input value={String(content.heading ?? '')} onChange={(e) => onChange({ ...content, heading: e.target.value })} />
        </Field>
      )}
      {content.subtext !== undefined && (
        <Field label="Subtext">
          <Textarea value={String(content.subtext ?? '')} onChange={(e) => onChange({ ...content, subtext: e.target.value })} />
        </Field>
      )}
      {items.map((item, i) => (
        <ArrayItemWrapper key={i} index={i} onRemove={() => removeItem(i)}>
          <div className="space-y-3">
            {fields.map((f) =>
              f.key === 'image_url' ? (
                <Field key={f.key} label={f.label}>
                  <ImageField value={item[f.key] ?? ''} onChange={(url) => updateItem(i, f.key, url)} />
                </Field>
              ) : f.multiline ? (
                <Field key={f.key} label={f.label}>
                  <Textarea value={item[f.key] ?? ''} onChange={(e) => updateItem(i, f.key, e.target.value)} />
                </Field>
              ) : (
                <Field key={f.key} label={f.label}>
                  <Input value={item[f.key] ?? ''} onChange={(e) => updateItem(i, f.key, e.target.value)} />
                </Field>
              )
            )}
          </div>
        </ArrayItemWrapper>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem} type="button">
        <Plus size={14} /> Add Item
      </Button>
    </div>
  )
}

const SECTION_EDITORS: Record<string, (props: { content: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) => React.ReactNode> = {
  hero: (p) => <HeroEditor {...p} />,
  faq: (p) => <FaqEditor {...p} />,
  memberships: (p) => <MembershipsEditor {...p} />,
  coaches: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'excerpt', label: 'Excerpt', multiline: true },
      { key: 'image_url', label: 'Image URL' },
    ]} />
  ),
  facilities: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'title', label: 'Title' },
      { key: 'desc', label: 'Description', multiline: true },
      { key: 'image_url', label: 'Image URL' },
    ]} />
  ),
  icon_row: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'num', label: 'Number / Stat' },
      { key: 'title', label: 'Title' },
      { key: 'desc', label: 'Description', multiline: true },
    ]} />
  ),
  training_sessions: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'title', label: 'Title' },
      { key: 'desc', label: 'Description', multiline: true },
      { key: 'image_url', label: 'Image URL' },
    ]} />
  ),
}

export function SectionEditor({ pageSlug, sectionKey, initialContent, onSave, onContentChange, saveLabel = 'Save Section' }: SectionEditorProps) {
  const [content, setContent] = useState<Record<string, unknown>>(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const wrappedOnChange = useCallback((v: Record<string, unknown>) => {
    setContent(v)
    onContentChange?.(v)
  }, [onContentChange])

  const EditorComponent = SECTION_EDITORS[sectionKey]

  async function handleSave() {
    setSaving(true)
    await onSave(sectionKey, content)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {EditorComponent ? (
        EditorComponent({ content, onChange: wrappedOnChange })
      ) : (
        <JsonFallbackEditor content={content} onChange={wrappedOnChange} />
      )}
      <div className="flex justify-end pt-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          loading={saving}
        >
          {saved ? '✓ Saved' : saveLabel}
        </Button>
      </div>
    </div>
  )
}
