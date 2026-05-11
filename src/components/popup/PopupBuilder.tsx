'use client'

import { useState, useEffect, useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Type, ImageIcon, MousePointer, Star, Tag, Minus,
  Eye, EyeOff, Save, Upload, Undo2, Settings,
} from 'lucide-react'
import { BlockRenderer } from './BlockRenderer'
import { StylePanel } from './StylePanel'
import type { PopupBlock, PopupDesign, BlockStyle } from './types'
import { DEFAULT_DESIGN, BLOCK_DEFAULTS } from './types'
import { createClient } from '@supabase/supabase-js'

const ResponsiveGridLayout = WidthProvider(Responsive)

const BLOCK_TYPES = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'button', label: 'Button', icon: MousePointer },
  { type: 'icon', label: 'Icon', icon: Star },
  { type: 'badge', label: 'Badge', icon: Tag },
  { type: 'divider', label: 'Divider', icon: Minus },
] as const

const DISPLAY_MODES = [
  { value: 'first_visit', label: 'First visit only', desc: 'Shows once, then never again' },
  { value: 'once_per_session', label: 'Once per session', desc: 'Shows once per browser session' },
  { value: 'every_page', label: 'Every page', desc: 'Shows once on each page' },
  { value: 'every_refresh', label: 'Every refresh', desc: 'Shows on every page load' },
] as const

interface Props {
  initial?: { published?: PopupDesign; draft?: PopupDesign }
}

function normalizeDesign(raw: unknown): PopupDesign {
  if (!raw || typeof raw !== 'object') return DEFAULT_DESIGN
  const d = raw as Record<string, unknown>
  // If it has a blocks array, it's the new format
  if (Array.isArray(d.blocks)) return { ...DEFAULT_DESIGN, ...d, blocks: d.blocks } as PopupDesign
  // Legacy flat format — start fresh with defaults, preserve enabled/display_mode
  return {
    ...DEFAULT_DESIGN,
    enabled: typeof d.enabled === 'boolean' ? d.enabled : true,
    display_mode: (d.display_mode as PopupDesign['display_mode']) ?? 'first_visit',
  }
}

export function PopupBuilder({ initial }: Props) {
  const [design, setDesign] = useState<PopupDesign>(normalizeDesign(initial?.draft ?? initial?.published))
  const [published, setPublished] = useState<PopupDesign | null>(initial?.published ? normalizeDesign(initial.published) : null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAiModal, setShowAiModal] = useState(false)

  const selectedBlock = (design.blocks ?? []).find(b => b.id === selectedId) ?? null
  const hasChanges = JSON.stringify(design) !== JSON.stringify(published ?? DEFAULT_DESIGN)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Block CRUD ─────────────────────────────────────────────────────────

  function addBlock(type: string) {
    const defaults = BLOCK_DEFAULTS[type]
    if (!defaults) return
    const maxY = design.blocks.reduce((max, b) => Math.max(max, b.y + b.h), 0)
    const block: PopupBlock = {
      id: `block_${Date.now()}`,
      type: defaults.type!,
      x: type === 'button' ? 2 : 0,
      y: maxY,
      w: defaults.w!,
      h: defaults.h!,
      content: defaults.content!,
      style: { ...(defaults.style as BlockStyle) },
    }
    setDesign(d => ({ ...d, blocks: [...d.blocks, block] }))
    setSelectedId(block.id)
  }

  function updateBlock(id: string, updates: Partial<PopupBlock>) {
    setDesign(d => ({
      ...d,
      blocks: d.blocks.map(b => b.id === id ? { ...b, ...updates } : b),
    }))
  }

  function deleteBlock(id: string) {
    setDesign(d => ({ ...d, blocks: d.blocks.filter(b => b.id !== id) }))
    if (selectedId === id) setSelectedId(null)
  }

  // ── Grid layout sync ───────────────────────────────────────────────────

  const handleLayoutChange = useCallback((layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    setDesign(d => ({
      ...d,
      blocks: d.blocks.map(b => {
        const l = layout.find(item => item.i === b.id)
        if (!l) return b
        return { ...b, x: l.x, y: l.y, w: l.w, h: l.h }
      }),
    }))
  }, [])

  // ── Save / Publish ─────────────────────────────────────────────────────

  async function saveDraft() {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'popup_settings',
          value: { published, draft: design },
        }),
      })
      showToast('Draft saved')
    } catch { showToast('Save failed') }
    finally { setSaving(false) }
  }

  async function publishDesign() {
    setPublishing(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'popup_settings',
          value: { published: design, draft: null },
        }),
      })
      setPublished(design)
      showToast('Published — live on website')
    } catch { showToast('Publish failed') }
    finally { setPublishing(false) }
  }

  function discardDraft() {
    if (!confirm('Discard all changes?')) return
    setDesign(published ?? DEFAULT_DESIGN)
    setSelectedId(null)
  }

  async function generateWithAI() {
    setGenerating(true)
    try {
      const res = await fetch('/api/popup/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt || 'Design a promotional popup for a functional fitness gym' }),
      })
      if (!res.ok) { showToast('AI generation failed'); return }
      const data = await res.json()
      if (data.blocks && Array.isArray(data.blocks)) {
        setDesign(d => ({
          ...d,
          blocks: data.blocks,
          backgroundColor: data.backgroundColor ?? d.backgroundColor,
          width: data.width ?? d.width,
          height: data.height ?? d.height,
          borderRadius: data.borderRadius ?? d.borderRadius,
          dismiss_text: data.dismiss_text ?? d.dismiss_text,
        }))
        showToast(`Generated ${data.blocks.length} blocks — tweak as needed`)
      }
    } catch { showToast('AI generation failed') }
    finally { setGenerating(false); setShowAiModal(false); setAiPrompt('') }
  }

  // ── Layout ─────────────────────────────────────────────────────────────

  const gridLayout = design.blocks.map(b => ({
    i: b.id,
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
    minW: 1,
    minH: 1,
  }))

  return (
    <div className="flex flex-col gap-4">
      {/* Status bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750" style={{ padding: '12px 20px' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDesign(d => ({ ...d, enabled: !d.enabled }))}
            className={`flex items-center gap-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-[0.6px] transition-colors ${
              design.enabled
                ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.1)] text-[#4ade80]'
                : 'border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.1)] text-red-400'
            }`}
            style={{ padding: '5px 12px', minHeight: 32 }}
          >
            {design.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
            {design.enabled ? 'Enabled' : 'Disabled'}
          </button>

          {published?.enabled !== design.enabled && (
            <Badge variant="amber">Unpublished change</Badge>
          )}

          <select
            value={design.display_mode}
            onChange={e => setDesign(d => ({ ...d, display_mode: e.target.value as PopupDesign['display_mode'] }))}
            className="rounded-lg border border-[rgba(255,255,255,0.09)] bg-transparent text-[11px] font-bold text-nw-400 outline-none"
            style={{ padding: '5px 10px' }}
          >
            {DISPLAY_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => setShowAiModal(true)} loading={generating}>
            <Star size={12} /> AI Generate
          </Button>
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={discardDraft}>
              <Undo2 size={12} /> Discard
            </Button>
          )}
          <Button variant="default" size="sm" onClick={saveDraft} loading={saving} disabled={!hasChanges}>
            <Save size={12} /> Save Draft
          </Button>
          <Button variant="gold" size="sm" onClick={publishDesign} loading={publishing}>
            <Upload size={12} /> Publish
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="rounded-xl border border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.08)] text-[13px] text-gold-300" style={{ padding: '8px 16px' }}>
          {toast}
        </div>
      )}

      {/* Main builder area */}
      <div className="flex gap-4" style={{ minHeight: 600 }}>
        {/* Left sidebar — palette + style panel */}
        <div className="w-[240px] flex-shrink-0 flex flex-col gap-4">
          {/* Block palette */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 overflow-hidden">
            <div className="border-b border-[rgba(255,255,255,0.06)]" style={{ padding: '10px 16px' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">Add Block</p>
            </div>
            <div className="grid grid-cols-2 gap-1" style={{ padding: 8 }}>
              {BLOCK_TYPES.map(bt => (
                <button
                  key={bt.type}
                  onClick={() => addBlock(bt.type)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-transparent text-nw-400 hover:text-gold-300 hover:border-[rgba(212,160,23,0.2)] hover:bg-[rgba(212,160,23,0.05)] transition-colors"
                  style={{ padding: '10px 6px', minHeight: 56 }}
                >
                  <bt.icon size={16} />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.6px]">{bt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Canvas settings toggle */}
          <button
            onClick={() => { setShowSettings(!showSettings); setSelectedId(null) }}
            className={`flex items-center gap-2 rounded-xl border text-[11px] font-medium transition-colors ${
              showSettings
                ? 'border-[rgba(212,160,23,0.3)] bg-[rgba(212,160,23,0.1)] text-gold-300'
                : 'border-[rgba(255,255,255,0.08)] text-nw-400 hover:text-nw-200'
            }`}
            style={{ padding: '8px 12px' }}
          >
            <Settings size={13} /> Popup Settings
          </button>

          {/* Style panel or canvas settings */}
          {(selectedBlock || showSettings) && (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-750 overflow-hidden overflow-y-auto" style={{ padding: 16, maxHeight: 500 }}>
              {showSettings ? (
                <CanvasSettings design={design} onUpdate={updates => setDesign(d => ({ ...d, ...updates }))} />
              ) : selectedBlock ? (
                <StylePanel
                  block={selectedBlock}
                  onUpdate={updates => updateBlock(selectedBlock.id, updates)}
                  onDelete={() => deleteBlock(selectedBlock.id)}
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col items-center">
          <div
            className="rounded-2xl border border-[rgba(255,255,255,0.11)] overflow-hidden relative"
            style={{
              width: Math.min(design.width, 480),
              minHeight: design.height,
              backgroundColor: design.backgroundColor,
              borderRadius: design.borderRadius,
              backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={() => { setSelectedId(null); setShowSettings(false) }}
          >
            {design.blocks.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px] text-center" style={{ padding: 40 }}>
                <div>
                  <p className="text-[14px] text-white/30 mb-2">Empty canvas</p>
                  <p className="text-[11px] text-white/15">Click a block type on the left to add it</p>
                </div>
              </div>
            ) : (
              <ResponsiveGridLayout
                layouts={{ lg: gridLayout }}
                breakpoints={{ lg: 0 }}
                cols={{ lg: 12 }}
                rowHeight={20}
                margin={[4, 4]}
                isDraggable
                isResizable
                onLayoutChange={(layout) => handleLayoutChange(layout)}
                draggableHandle=".block-drag"
                useCSSTransforms
              >
                {design.blocks.map(block => (
                  <div
                    key={block.id}
                    className="block-drag"
                    onClick={e => { e.stopPropagation(); setSelectedId(block.id); setShowSettings(false) }}
                  >
                    <BlockRenderer
                      block={block}
                      selected={selectedId === block.id}
                    />
                  </div>
                ))}
              </ResponsiveGridLayout>
            )}

            {/* Dismiss text preview */}
            {design.dismiss_text && (
              <div className="text-center" style={{ padding: '8px 16px 16px' }}>
                <span className="text-[11px] text-white/30">{design.dismiss_text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50" onClick={() => setShowAiModal(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 flex items-center justify-center" style={{ padding: 20 }}>
            <div
              className="bg-nw-750 rounded-2xl border border-[rgba(255,255,255,0.12)] w-full max-w-md"
              style={{ padding: 24 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-brand text-lg font-bold text-white mb-1">AI Popup Generator</h3>
              <p className="text-[12px] text-nw-400 mb-4">Describe what you want and AI will design the layout. You can tweak everything after.</p>

              <textarea
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. A popup promoting our 2-week free trial with a hero image, bold headline, and a gold CTA button"
                className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)] resize-none"
                style={{ padding: '10px 12px', minHeight: 100 }}
              />

              <div className="flex gap-2 mt-2 text-[10px] text-nw-500 flex-wrap">
                {['2-week free trial promo', 'Kids classes announcement', 'HYROX event signup', 'New year membership offer'].map(s => (
                  <button
                    key={s}
                    onClick={() => setAiPrompt(s)}
                    className="rounded-lg border border-[rgba(255,255,255,0.08)] hover:border-[rgba(212,160,23,0.2)] hover:text-gold-300 transition-colors"
                    style={{ padding: '4px 8px' }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="default" size="sm" onClick={() => setShowAiModal(false)}>Cancel</Button>
                <Button variant="gold" size="sm" onClick={generateWithAI} loading={generating} disabled={!aiPrompt.trim()}>
                  <Star size={12} /> Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Canvas Settings Panel ────────────────────────────────────────────────────

function CanvasSettings({ design, onUpdate }: { design: PopupDesign; onUpdate: (u: Partial<PopupDesign>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">Popup Settings</p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Width</label>
          <input
            type="number"
            value={design.width}
            onChange={e => onUpdate({ width: Number(e.target.value) })}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
            style={{ padding: '6px 10px' }}
            min={280} max={600}
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Height</label>
          <input
            type="number"
            value={design.height}
            onChange={e => onUpdate({ height: Number(e.target.value) })}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
            style={{ padding: '6px 10px' }}
            min={300} max={800}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Background</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={design.backgroundColor}
            onChange={e => onUpdate({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border-0 cursor-pointer"
          />
          <input
            value={design.backgroundColor}
            onChange={e => onUpdate({ backgroundColor: e.target.value })}
            className="flex-1 rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[11px] text-white outline-none font-mono"
            style={{ padding: '4px 8px' }}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Background Image</label>
        <input
          value={design.backgroundImage ?? ''}
          onChange={e => onUpdate({ backgroundImage: e.target.value || undefined })}
          placeholder="https://..."
          className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
          style={{ padding: '6px 10px' }}
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Border Radius</label>
        <input
          type="number"
          value={design.borderRadius}
          onChange={e => onUpdate({ borderRadius: Number(e.target.value) })}
          className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
          style={{ padding: '6px 10px' }}
          min={0} max={32}
        />
      </div>

      <div>
        <label className="text-[10px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">Dismiss Text</label>
        <input
          value={design.dismiss_text}
          onChange={e => onUpdate({ dismiss_text: e.target.value })}
          className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
          style={{ padding: '6px 10px' }}
        />
      </div>
    </div>
  )
}
