'use client'

import { useState, useCallback } from 'react'
import { BrandingStudio } from './BrandingStudio'
import type { Media } from '@/lib/types'
import {
  Pencil, Check, X, Plus, Trash2, Copy, CheckCheck,
  Palette, Type, Mic, Target, Image as ImageIcon, Sparkles,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoreValue {
  id: string
  emoji: string
  title: string
  description: string
}

interface BrandColour {
  id: string
  name: string
  hex: string
  role: string
}

export interface BrandIdentity {
  mission: string
  tagline: string
  strapline: string
  values: CoreValue[]
  colours: BrandColour[]
  logo_ids: string[]
  voice_tone: string
  tone_keywords: string[]
}

interface BrandPageProps {
  identity: BrandIdentity
  media: Media[]
  placeId: string
  guideOnly?: boolean
}

// ─── Default brand colours ────────────────────────────────────────────────────

const DEFAULT_COLOURS: BrandColour[] = [
  { id: 'c1', name: 'Obsidian',     hex: '#0a0f1a', role: 'Primary Background' },
  { id: 'c2', name: 'Slate Deep',   hex: '#0d1625', role: 'Surface / Panel' },
  { id: 'c3', name: 'Gold',         hex: '#967705', role: 'Primary Accent' },
  { id: 'c4', name: 'Gold Bright',  hex: '#c9a70a', role: 'Hover / Heading Accent' },
  { id: 'c5', name: 'White',        hex: '#ffffff', role: 'Primary Text' },
  { id: 'c6', name: 'Muted Text',   hex: 'rgba(255,255,255,0.5)', role: 'Secondary Text' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label, title }: { icon?: React.ElementType; label: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">{label}</span>
      <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />
      <span className="text-[13px] font-medium text-nw-200">{title}</span>
    </div>
  )
}

function EditButton({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-[7px] border px-3 py-[5px] text-xs font-medium transition-colors ${
        editing
          ? 'border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300'
          : 'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-nw-400 hover:text-nw-200 hover:border-[rgba(255,255,255,0.14)]'
      }`}
    >
      {editing ? <Check size={12} /> : <Pencil size={12} />}
      {editing ? 'Done' : 'Edit'}
    </button>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium uppercase tracking-[1px] text-nw-500">{label}</label>
      {children}
    </div>
  )
}

function StaticText({ value, placeholder }: { value: string; placeholder: string }) {
  return (
    <p className={`text-[13px] leading-relaxed ${value ? 'text-nw-300' : 'text-nw-600 italic'}`}>
      {value || placeholder}
    </p>
  )
}

function EditableInput({ value, onChange, placeholder, multiline }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  const cls = 'w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 py-2 text-[13px] text-nw-200 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750'
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${cls} resize-none`} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
}

// ─── Identity Section ─────────────────────────────────────────────────────────

function IdentitySection({ data, editing, onChange }: {
  data: Pick<BrandIdentity, 'mission' | 'tagline' | 'strapline'>
  editing: boolean
  onChange: <K extends 'mission' | 'tagline' | 'strapline'>(k: K, v: string) => void
}) {
  return (
    <div className="space-y-5">
      <FieldRow label="Mission Statement">
        {editing
          ? <EditableInput value={data.mission} onChange={v => onChange('mission', v)} placeholder="Our mission is to…" multiline />
          : <StaticText value={data.mission} placeholder="No mission statement yet — click Edit to add one." />}
      </FieldRow>
      <FieldRow label="Tagline">
        {editing
          ? <EditableInput value={data.tagline} onChange={v => onChange('tagline', v)} placeholder="Short, punchy tagline" />
          : <p className={`text-xl font-semibold tracking-tight ${data.tagline ? 'text-white' : 'text-nw-600 italic text-[13px]'}`}>{data.tagline || 'No tagline yet — click Edit to add one.'}</p>}
      </FieldRow>
      <FieldRow label="Strapline / Sub-tagline">
        {editing
          ? <EditableInput value={data.strapline} onChange={v => onChange('strapline', v)} placeholder="Supporting line beneath the tagline" />
          : <StaticText value={data.strapline} placeholder="No strapline yet." />}
      </FieldRow>
    </div>
  )
}

// ─── Core Values Section ─────────────────────────────────────────────────────

function ValuesSection({ values, editing, onChange, onAdd, onRemove }: {
  values: CoreValue[]
  editing: boolean
  onChange: (id: string, field: keyof CoreValue, v: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {values.map(v => (
          <div key={v.id} className="relative rounded-[8px] border border-[rgba(255,255,255,0.07)] bg-nw-800 p-4 space-y-2 group">
            {editing && (
              <button
                onClick={() => onRemove(v.id)}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
            {editing ? (
              <>
                <input
                  value={v.emoji}
                  onChange={e => onChange(v.id, 'emoji', e.target.value)}
                  className="w-12 text-2xl bg-transparent border-none outline-none text-center"
                  placeholder="🔥"
                  maxLength={2}
                />
                <input
                  value={v.title}
                  onChange={e => onChange(v.id, 'title', e.target.value)}
                  className="block w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1.5 text-[13px] font-medium text-nw-200 placeholder:text-nw-500 outline-none focus:border-[rgba(212,160,23,0.4)]"
                  placeholder="Value name"
                />
                <textarea
                  value={v.description}
                  onChange={e => onChange(v.id, 'description', e.target.value)}
                  rows={2}
                  className="block w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-2 py-1.5 text-[11px] text-nw-400 placeholder:text-nw-500 outline-none focus:border-[rgba(212,160,23,0.4)] resize-none"
                  placeholder="What this value means to us…"
                />
              </>
            ) : (
              <>
                <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[rgba(212,160,23,0.1)] text-xl">{v.emoji}</div>
                <p className="text-[13px] font-medium text-nw-200">{v.title}</p>
                <p className="text-[11px] text-nw-500 leading-relaxed">{v.description}</p>
              </>
            )}
          </div>
        ))}
        {editing && (
          <button
            onClick={onAdd}
            className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] p-4 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50 hover:border-white/20 transition-all min-h-[120px]"
          >
            <Plus size={20} />
            <span className="text-xs">Add value</span>
          </button>
        )}
      </div>
      {values.length === 0 && !editing && (
        <p className="text-sm text-white/20 italic">No core values defined yet — click Edit to add some.</p>
      )}
    </div>
  )
}

// ─── Colours Section ─────────────────────────────────────────────────────────

function CopyHex({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(hex).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors">
      {copied ? <CheckCheck size={10} className="text-green-400" /> : <Copy size={10} />}
      {copied ? 'Copied' : hex}
    </button>
  )
}

function ColoursSection({ colours, editing, onChange, onAdd, onRemove }: {
  colours: BrandColour[]
  editing: boolean
  onChange: (id: string, field: keyof BrandColour, v: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {colours.map(c => (
          <div key={c.id} className="rounded-xl overflow-hidden border border-white/[0.08] group">
            <div
              className="h-20 w-full relative"
              style={{ background: c.hex }}
            >
              {editing && (
                <button
                  onClick={() => onRemove(c.id)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded bg-black/40 text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="p-2.5 bg-white/[0.03] space-y-1.5">
              {editing ? (
                <>
                  <input
                    value={c.name}
                    onChange={e => onChange(c.id, 'name', e.target.value)}
                    className="w-full bg-transparent text-xs font-semibold text-white border-none outline-none focus:underline"
                  />
                  <input
                    value={c.hex}
                    onChange={e => onChange(c.id, 'hex', e.target.value)}
                    className="w-full bg-transparent text-[10px] text-white/40 font-mono border-none outline-none focus:underline"
                  />
                  <input
                    value={c.role}
                    onChange={e => onChange(c.id, 'role', e.target.value)}
                    className="w-full bg-transparent text-[10px] text-white/30 border-none outline-none focus:underline"
                  />
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-white/80">{c.name}</p>
                  <CopyHex hex={c.hex} />
                  <p className="text-[10px] text-white/30">{c.role}</p>
                </>
              )}
            </div>
          </div>
        ))}
        {editing && (
          <button
            onClick={onAdd}
            className="rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] h-[140px] flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50 hover:border-white/20 transition-all"
          >
            <Plus size={18} />
            <span className="text-[10px]">Add colour</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Logo Library Section ─────────────────────────────────────────────────────

function LogoSection({ media, logoIds, editing, onToggle }: {
  media: Media[]
  logoIds: string[]
  editing: boolean
  onToggle: (id: string) => void
}) {
  const images = media.filter(m => m.url)
  return (
    <div className="space-y-3">
      {editing && (
        <p className="text-xs text-white/40">Click an image to mark it as a logo asset.</p>
      )}
      {images.length === 0 && (
        <p className="text-sm text-white/20 italic">No media uploaded yet — visit the Media page to upload logo assets.</p>
      )}
      <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {images.map(m => {
          const selected = logoIds.includes(m.id)
          return (
            <button
              key={m.id}
              onClick={() => editing && onToggle(m.id)}
              disabled={!editing && !selected}
              className={`relative rounded-xl overflow-hidden border aspect-square transition-all duration-200 ${
                selected
                  ? 'border-gold-500/60 ring-1 ring-gold-500/30'
                  : editing
                  ? 'border-white/[0.08] hover:border-white/20'
                  : 'border-white/[0.06]'
              } ${!editing && !selected ? 'opacity-0 w-0 h-0 p-0 border-0' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt ?? m.filename} className="w-full h-full object-contain bg-white/[0.04] p-2" />
              {selected && (
                <div className="absolute inset-0 bg-gold-600/10 flex items-end justify-end p-1.5">
                  <div className="w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center">
                    <Check size={9} className="text-nw-950" />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
      {!editing && logoIds.length === 0 && images.length > 0 && (
        <p className="text-sm text-white/20 italic">No logos selected yet — click Edit to choose from your media library.</p>
      )}
    </div>
  )
}

// ─── Typography Section ───────────────────────────────────────────────────────

function TypographySection() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <p className="text-[9px] font-semibold text-gold-500 uppercase tracking-[0.15em]">Display / Headings</p>
            <p className="text-xs text-white/40">Rajdhani — Geometric Sans</p>
          </div>
        </div>
        <p style={{ fontFamily: 'Rajdhani, sans-serif' }} className="text-5xl font-bold text-white tracking-tight leading-none">Northern Warrior</p>
        <p style={{ fontFamily: 'Rajdhani, sans-serif' }} className="text-2xl font-semibold text-gold-400">Strength. Community. Purpose.</p>
        <p style={{ fontFamily: 'Rajdhani, sans-serif' }} className="text-lg text-white/60">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
        <p style={{ fontFamily: 'Rajdhani, sans-serif' }} className="text-lg text-white/40">abcdefghijklmnopqrstuvwxyz 0123456789</p>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6 space-y-4">
        <div>
          <p className="text-[9px] font-semibold text-gold-500 uppercase tracking-[0.15em]">Body / UI</p>
          <p className="text-xs text-white/40">Inter — Neutral Sans-Serif</p>
        </div>
        <p className="text-base text-white/80 leading-relaxed max-w-prose">We believe in building strong bodies, resilient minds, and lasting community. Every session is designed to challenge and empower — no matter where you're starting from.</p>
        <p className="text-sm text-white/50 leading-relaxed max-w-prose">Paragraph text, UI labels, form inputs, and body copy all use Inter for its exceptional legibility at any size.</p>
        <div className="flex flex-wrap gap-4 pt-2">
          {(['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'] as const).map(size => (
            <div key={size} className="text-center">
              <p className={`${size} text-white/70 font-medium`}>Aa</p>
              <p className="text-[9px] text-white/20 mt-1">{size.replace('text-', '')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Voice & Tone Section ─────────────────────────────────────────────────────

function VoiceSection({ voiceTone, keywords, editing, onVoiceChange, onKeywordAdd, onKeywordRemove }: {
  voiceTone: string
  keywords: string[]
  editing: boolean
  onVoiceChange: (v: string) => void
  onKeywordAdd: (k: string) => void
  onKeywordRemove: (k: string) => void
}) {
  const [newKw, setNewKw] = useState('')

  return (
    <div className="space-y-5">
      <FieldRow label="Voice Description">
        {editing
          ? <EditableInput value={voiceTone} onChange={onVoiceChange} placeholder="Describe your brand voice — confident, inclusive, no-nonsense…" multiline />
          : <StaticText value={voiceTone} placeholder="No voice description yet — click Edit to add one." />}
      </FieldRow>
      <FieldRow label="Tone Keywords">
        <div className="flex flex-wrap gap-2">
          {keywords.map(kw => (
            <span
              key={kw}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] text-white/60 border border-white/[0.08]"
            >
              {kw}
              {editing && (
                <button onClick={() => onKeywordRemove(kw)} className="text-white/30 hover:text-red-400 transition-colors">
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
          {editing && (
            <form
              onSubmit={e => {
                e.preventDefault()
                const trimmed = newKw.trim()
                if (trimmed && !keywords.includes(trimmed)) {
                  onKeywordAdd(trimmed)
                  setNewKw('')
                }
              }}
              className="flex items-center gap-1"
            >
              <input
                value={newKw}
                onChange={e => setNewKw(e.target.value)}
                placeholder="Add keyword…"
                className="px-2.5 py-1 rounded-full text-xs bg-white/[0.04] border border-dashed border-white/[0.12] text-white/50 placeholder:text-white/20 focus:outline-none focus:border-gold-600/30 w-28"
              />
              <button type="submit" className="w-5 h-5 flex items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors">
                <Plus size={10} />
              </button>
            </form>
          )}
        </div>
        {keywords.length === 0 && !editing && (
          <p className="text-sm text-white/20 italic">No tone keywords yet.</p>
        )}
      </FieldRow>
    </div>
  )
}

// ─── Save bar ─────────────────────────────────────────────────────────────────

function SaveBar({ dirty, saving, onSave, onDiscard }: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  if (!dirty) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-nw-800 border border-white/[0.12] shadow-2xl">
      <p className="text-sm text-white/60">You have unsaved changes</p>
      <button
        onClick={onDiscard}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 border border-white/[0.08] hover:text-white/60 transition-colors"
      >
        Discard
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-gold-600 to-gold-400 text-nw-950 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'guide',  label: 'Brand Guide',  icon: Sparkles },
  { id: 'studio', label: 'Post Studio',  icon: ImageIcon },
] as const

type TabId = typeof TABS[number]['id']

// ─── Main Component ───────────────────────────────────────────────────────────

export function BrandPage({ identity: initial, media, placeId, guideOnly = false }: BrandPageProps) {
  const [tab, setTab] = useState<TabId>('guide')
  const [identity, setIdentity] = useState<BrandIdentity>(() => ({
    mission:        initial.mission        ?? '',
    tagline:        initial.tagline        ?? '',
    strapline:      initial.strapline      ?? '',
    values:         initial.values         ?? [],
    colours:        initial.colours?.length ? initial.colours : DEFAULT_COLOURS,
    logo_ids:       initial.logo_ids       ?? [],
    voice_tone:     initial.voice_tone     ?? '',
    tone_keywords:  initial.tone_keywords  ?? [],
  }))
  const [saved, setSaved] = useState<BrandIdentity>(identity)
  const [saving, setSaving] = useState(false)

  // per-section edit toggles
  const [editSection, setEditSection] = useState<string | null>(null)

  const dirty = JSON.stringify(identity) !== JSON.stringify(saved)

  const update = useCallback(<K extends keyof BrandIdentity>(key: K, value: BrandIdentity[K]) => {
    setIdentity(prev => ({ ...prev, [key]: value }))
  }, [])

  const saveAll = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'brand_identity', value: identity }),
      })
      setSaved(identity)
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    setIdentity(saved)
    setEditSection(null)
  }

  const toggleSection = (s: string) => setEditSection(prev => prev === s ? null : s)
  const editing = (s: string) => editSection === s

  return (
    <div className="space-y-6">
      {/* Tab nav — hidden in guideOnly mode */}
      {!guideOnly && (
        <div className="flex gap-1 border-b border-[rgba(255,255,255,0.07)]">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                tab === t.id
                  ? 'border-gold-400 text-gold-300'
                  : 'border-transparent text-nw-400 hover:text-nw-200'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Post Studio tab */}
      {!guideOnly && tab === 'studio' && (
        <BrandingStudio placeId={placeId} />
      )}

      {/* Brand Guide tab */}
      {(guideOnly || tab === 'guide') && (
        <div className="space-y-6">

          {/* Brand Identity */}
          <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <SectionHeader icon={Target} label="Brand Guide" title="Brand Identity" />
              <EditButton editing={editing('identity')} onToggle={() => toggleSection('identity')} />
            </div>
            <IdentitySection
              data={identity}
              editing={editing('identity')}
              onChange={(k, v) => update(k, v)}
            />
          </div>

          {/* Core Values */}
          <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <SectionHeader icon={Sparkles} label="Brand Guide" title="Core Values" />
              <EditButton editing={editing('values')} onToggle={() => toggleSection('values')} />
            </div>
            <ValuesSection
              values={identity.values}
              editing={editing('values')}
              onChange={(id, field, v) => {
                update('values', identity.values.map(val => val.id === id ? { ...val, [field]: v } : val))
              }}
              onAdd={() => update('values', [...identity.values, { id: uid(), emoji: '⚡', title: '', description: '' }])}
              onRemove={id => update('values', identity.values.filter(v => v.id !== id))}
            />
          </div>

          {/* Brand Colours */}
          <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <SectionHeader icon={Palette} label="Brand Guide" title="Brand Colours" />
              <EditButton editing={editing('colours')} onToggle={() => toggleSection('colours')} />
            </div>
            <ColoursSection
              colours={identity.colours}
              editing={editing('colours')}
              onChange={(id, field, v) => {
                update('colours', identity.colours.map(c => c.id === id ? { ...c, [field]: v } : c))
              }}
              onAdd={() => update('colours', [...identity.colours, { id: uid(), name: 'New Colour', hex: '#000000', role: 'Accent' }])}
              onRemove={id => update('colours', identity.colours.filter(c => c.id !== id))}
            />
          </div>

          {/* Logo Library */}
          <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <SectionHeader icon={ImageIcon} label="Brand Guide" title="Logo Library" />
              <EditButton editing={editing('logos')} onToggle={() => toggleSection('logos')} />
            </div>
            <LogoSection
              media={media}
              logoIds={identity.logo_ids}
              editing={editing('logos')}
              onToggle={id => {
                const next = identity.logo_ids.includes(id)
                  ? identity.logo_ids.filter(x => x !== id)
                  : [...identity.logo_ids, id]
                update('logo_ids', next)
              }}
            />
          </div>

          {/* Typography */}
          <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6">
            <SectionHeader icon={Type} label="Brand Guide" title="Typography" />
            <TypographySection />
          </div>

          {/* Voice & Tone */}
          <div className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <SectionHeader icon={Mic} label="Brand Guide" title="Voice &amp; Tone" />
              <EditButton editing={editing('voice')} onToggle={() => toggleSection('voice')} />
            </div>
            <VoiceSection
              voiceTone={identity.voice_tone}
              keywords={identity.tone_keywords}
              editing={editing('voice')}
              onVoiceChange={v => update('voice_tone', v)}
              onKeywordAdd={k => update('tone_keywords', [...identity.tone_keywords, k])}
              onKeywordRemove={k => update('tone_keywords', identity.tone_keywords.filter(x => x !== k))}
            />
          </div>

        </div>
      )}

      <SaveBar dirty={dirty} saving={saving} onSave={saveAll} onDiscard={discard} />
    </div>
  )
}
