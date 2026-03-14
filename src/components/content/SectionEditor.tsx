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

// String array editor (plain string[] items — stations, perks, how_it_works)
function StringArrayEditor({
  content,
  onChange,
  label = 'Item',
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  label?: string
}) {
  const items = (content.items as string[]) ?? []

  function updateItem(i: number, value: string) {
    const next = items.map((s, idx) => (idx === i ? value : s))
    onChange({ ...content, items: next })
  }
  function addItem() {
    onChange({ ...content, items: [...items, ''] })
  }
  function removeItem(i: number) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <ArrayItemWrapper key={i} index={i} onRemove={() => removeItem(i)}>
          <Input value={item} onChange={(e) => updateItem(i, e.target.value)} />
        </ArrayItemWrapper>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem} type="button">
        <Plus size={14} /> Add {label}
      </Button>
    </div>
  )
}

// Single text field editor (hwpo, terms)
function SingleTextEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  return (
    <Field label="Content">
      <Textarea
        value={(content.text as string) ?? ''}
        onChange={(e) => onChange({ ...content, text: e.target.value })}
        className="min-h-[120px]"
      />
    </Field>
  )
}

// Single URL editor (embed_url)
function SingleUrlEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  return (
    <Field label="URL">
      <Input
        value={(content.url as string) ?? ''}
        onChange={(e) => onChange({ ...content, url: e.target.value })}
        placeholder="https://..."
      />
    </Field>
  )
}

// Contact block editor (home contact_block — address array, whatsapp, email)
function ContactBlockEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const s = content as { address?: string[]; whatsapp?: string; email?: string }
  const addressStr = (s.address ?? []).join('\n')
  return (
    <div className="space-y-4">
      <Field label="Address (one line per entry)">
        <Textarea
          value={addressStr}
          onChange={(e) =>
            onChange({ ...content, address: e.target.value.split('\n').filter(Boolean) })
          }
          className="min-h-[80px]"
        />
      </Field>
      <Field label="WhatsApp Number">
        <Input
          value={s.whatsapp ?? ''}
          onChange={(e) => onChange({ ...content, whatsapp: e.target.value })}
          placeholder="+447..."
        />
      </Field>
      <Field label="Email">
        <Input
          value={s.email ?? ''}
          onChange={(e) => onChange({ ...content, email: e.target.value })}
        />
      </Field>
    </div>
  )
}

// Contact details editor (contact page details section — email, address string)
function ContactDetailsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const s = content as { email?: string; address?: string | string[] }
  const addressStr = Array.isArray(s.address) ? s.address.join('\n') : (s.address ?? '')
  return (
    <div className="space-y-4">
      <Field label="Email">
        <Input
          value={s.email ?? ''}
          onChange={(e) => onChange({ ...content, email: e.target.value })}
        />
      </Field>
      <Field label="Address">
        <Textarea
          value={addressStr}
          onChange={(e) => onChange({ ...content, address: e.target.value })}
          className="min-h-[80px]"
        />
      </Field>
    </div>
  )
}

// Form enquiry types editor (contact form dropdown options)
function FormEnquiryEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const types = (content.enquiry_types as string[]) ?? []

  function updateType(i: number, value: string) {
    const next = types.map((t, idx) => (idx === i ? value : t))
    onChange({ ...content, enquiry_types: next })
  }
  function addType() {
    onChange({ ...content, enquiry_types: [...types, ''] })
  }
  function removeType(i: number) {
    onChange({ ...content, enquiry_types: types.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/40 mb-3">Options shown in the contact form dropdown</p>
      {types.map((type, i) => (
        <ArrayItemWrapper key={i} index={i} onRemove={() => removeType(i)}>
          <Input value={type} onChange={(e) => updateType(i, e.target.value)} />
        </ArrayItemWrapper>
      ))}
      <Button variant="ghost" size="sm" onClick={addType} type="button">
        <Plus size={14} /> Add Option
      </Button>
    </div>
  )
}

// Options editor for start-here (kicker, title, desc, image_url + nested buttons)
function OptionsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  type ButtonItem = { label: string; href: string; variant: string }
  type OptionItem = { kicker?: string; title: string; desc: string; image_url?: string; buttons: ButtonItem[] }
  const items = (content.items as OptionItem[]) ?? []

  function updateItem(i: number, field: string, value: unknown) {
    const next = items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    onChange({ ...content, items: next })
  }
  function addItem() {
    onChange({ ...content, items: [...items, { kicker: '', title: '', desc: '', image_url: '', buttons: [] }] })
  }
  function removeItem(i: number) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }
  function updateButton(itemIdx: number, btnIdx: number, field: string, value: string) {
    const item = items[itemIdx]
    const buttons = item.buttons.map((b, bi) => (bi === btnIdx ? { ...b, [field]: value } : b))
    updateItem(itemIdx, 'buttons', buttons)
  }
  function addButton(itemIdx: number) {
    const item = items[itemIdx]
    updateItem(itemIdx, 'buttons', [...item.buttons, { label: '', href: '', variant: 'primary' }])
  }
  function removeButton(itemIdx: number, btnIdx: number) {
    const item = items[itemIdx]
    updateItem(itemIdx, 'buttons', item.buttons.filter((_, bi) => bi !== btnIdx))
  }

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <ArrayItemWrapper key={i} index={i} onRemove={() => removeItem(i)}>
          <div className="space-y-3">
            <Field label="Kicker">
              <Input value={item.kicker ?? ''} onChange={(e) => updateItem(i, 'kicker', e.target.value)} />
            </Field>
            <Field label="Title">
              <Input value={item.title} onChange={(e) => updateItem(i, 'title', e.target.value)} />
            </Field>
            <Field label="Description">
              <Textarea value={item.desc} onChange={(e) => updateItem(i, 'desc', e.target.value)} />
            </Field>
            <Field label="Image">
              <ImageField value={item.image_url ?? ''} onChange={(url) => updateItem(i, 'image_url', url)} />
            </Field>
            <div>
              <p className="text-xs text-white/40 mb-2">Buttons</p>
              <div className="space-y-2 pl-3 border-l border-white/10">
                {item.buttons.map((btn, bi) => (
                  <div key={bi} className="flex gap-2 items-end">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Field label="Label">
                        <Input value={btn.label} onChange={(e) => updateButton(i, bi, 'label', e.target.value)} />
                      </Field>
                      <Field label="Link">
                        <Input value={btn.href} onChange={(e) => updateButton(i, bi, 'href', e.target.value)} />
                      </Field>
                      <Field label="Style">
                        <Input
                          value={btn.variant}
                          onChange={(e) => updateButton(i, bi, 'variant', e.target.value)}
                          placeholder="primary/outline"
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeButton(i, bi)}
                      className="text-white/30 hover:text-red-400 transition-colors mb-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addButton(i)} type="button">
                  <Plus size={12} /> Add Button
                </Button>
              </div>
            </div>
          </div>
        </ArrayItemWrapper>
      ))}
      <Button variant="ghost" size="sm" onClick={addItem} type="button">
        <Plus size={14} /> Add Option
      </Button>
    </div>
  )
}

// Social Carousel section editor
function SocialCarouselEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const s = content as { heading?: string; subtext?: string; ig_url?: string; speed?: number }
  const items = (content.items as Array<{ image_url: string; permalink: string }>) ?? []

  function updateItem(i: number, field: string, value: string) {
    const next = items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    onChange({ ...content, items: next })
  }
  function addItem() {
    onChange({ ...content, items: [...items, { image_url: '', permalink: '' }] })
  }
  function removeItem(i: number) {
    onChange({ ...content, items: items.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="Section Heading">
        <Input value={s.heading ?? ''} onChange={(e) => onChange({ ...content, heading: e.target.value })} />
      </Field>
      <Field label="Subtext">
        <Textarea value={s.subtext ?? ''} onChange={(e) => onChange({ ...content, subtext: e.target.value })} />
      </Field>
      <Field label="Instagram Profile URL">
        <Input
          value={s.ig_url ?? ''}
          onChange={(e) => onChange({ ...content, ig_url: e.target.value })}
          placeholder="https://www.instagram.com/yourhandle/"
        />
      </Field>
      <Field label="Scroll Speed">
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-white/30 w-8">Fast</span>
          <input
            type="range"
            min={20}
            max={120}
            step={5}
            value={s.speed ?? 55}
            onChange={(e) => onChange({ ...content, speed: Number(e.target.value) })}
            className="flex-1 accent-[#967705]"
          />
          <span className="text-[10px] text-white/30 w-8 text-right">Slow</span>
        </div>
      </Field>
      <div className="space-y-3">
        {items.map((item, i) => (
          <ArrayItemWrapper key={i} index={i} onRemove={() => removeItem(i)}>
            <Field label="Image">
              <ImageField value={item.image_url} onChange={(url) => updateItem(i, 'image_url', url)} />
            </Field>
            <Field label="Post URL" className="mt-3">
              <Input
                value={item.permalink}
                onChange={(e) => updateItem(i, 'permalink', e.target.value)}
                placeholder="https://www.instagram.com/p/..."
              />
            </Field>
          </ArrayItemWrapper>
        ))}
        <Button variant="ghost" size="sm" onClick={addItem} type="button">
          <Plus size={14} /> Add Photo
        </Button>
      </div>
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
  social_carousel: (p) => <SocialCarouselEditor {...p} />,
  plans: (p) => <MembershipsEditor {...p} />,
  sessions: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type (e.g. Coached)' },
      { key: 'desc', label: 'Description', multiline: true },
      { key: 'image_url', label: 'Image' },
      { key: 'link', label: 'Link URL' },
    ]} />
  ),
  specialist: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'desc', label: 'Description', multiline: true },
      { key: 'image_url', label: 'Image' },
      { key: 'link', label: 'Link URL' },
    ]} />
  ),
  hwpo: (p) => <SingleTextEditor {...p} />,
  stations: (p) => <StringArrayEditor {...p} label="Station" />,
  training_blocks: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'title', label: 'Title' },
      { key: 'desc', label: 'Description', multiline: true },
      { key: 'image_url', label: 'Image' },
    ]} />
  ),
  age_groups: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'name', label: 'Name' },
      { key: 'ages', label: 'Age Range' },
      { key: 'desc', label: 'Description', multiline: true },
      { key: 'image_url', label: 'Image' },
    ]} />
  ),
  how_it_works: (p) => <StringArrayEditor {...p} label="Step" />,
  perks: (p) => <StringArrayEditor {...p} label="Perk" />,
  discounts: (p) => (
    <GenericArrayEditor {...p} fields={[
      { key: 'label', label: 'Discount Name' },
      { key: 'desc', label: 'Description', multiline: true },
    ]} />
  ),
  terms: (p) => <SingleTextEditor {...p} />,
  embed_url: (p) => <SingleUrlEditor {...p} />,
  options: (p) => <OptionsEditor {...p} />,
  contact_block: (p) => <ContactBlockEditor {...p} />,
  form: (p) => <FormEnquiryEditor {...p} />,
  details: (p) => <ContactDetailsEditor {...p} />,
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
