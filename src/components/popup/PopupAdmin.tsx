'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImageField } from '@/components/media/MediaPicker'
import { Save, Send, Eye, EyeOff, RotateCcw, Monitor, Smartphone } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type DisplayMode = 'first_visit' | 'once_per_session' | 'every_page' | 'every_refresh'

interface PopupData {
  enabled: boolean
  display_mode: DisplayMode
  image_url: string
  image_focus_x: number // 0–100
  image_focus_y: number // 0–100
  badge_text: string
  heading: string
  heading_gold: string
  description: string
  button_text: string
  button_link: string
  dismiss_text: string
}

const DISPLAY_MODE_OPTIONS: { value: DisplayMode; label: string; desc: string }[] = [
  { value: 'first_visit', label: 'First visit only', desc: 'Shows once per browser — never again after dismissed' },
  { value: 'once_per_session', label: 'Once per session', desc: 'Shows once per browsing session (resets when browser closes)' },
  { value: 'every_page', label: 'Every page', desc: 'Shows once on each new page the visitor opens' },
  { value: 'every_refresh', label: 'Every page load', desc: 'Shows on every page load including refreshes' },
]

const DEFAULTS: PopupData = {
  enabled: true,
  display_mode: 'first_visit',
  image_url: '',
  image_focus_x: 50,
  image_focus_y: 50,
  badge_text: 'Limited offer',
  heading: '2 Weeks',
  heading_gold: 'Free',
  description: 'Try everything we offer — no commitment, no card details. Just turn up and see what Northern Warrior is all about.',
  button_text: 'Start your free trial',
  button_link: '/start-here',
  dismiss_text: "No thanks, I'll look around first",
}

const SETTING_KEY = 'popup_settings'

// ── Helpers ──────────────────────────────────────────────────────────────────

function useTheme() {
  const [light, setLight] = useState(false)
  useEffect(() => {
    setLight(document.documentElement.classList.contains('nw-light'))
    const obs = new MutationObserver(() => setLight(document.documentElement.classList.contains('nw-light')))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return light
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PopupAdmin() {
  const light = useTheme()

  // Published = what's live on the website right now
  const [published, setPublished] = useState<PopupData | null>(null)
  // Draft = local edits (starts as published, diverges when user edits)
  const [draft, setDraft] = useState<PopupData>(DEFAULTS)
  // Saved draft in DB (draft_content column equivalent)
  const [savedDraft, setSavedDraft] = useState<PopupData | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as { published?: PopupData; draft?: PopupData }
          const pub = val.published ?? null
          const dft = val.draft ?? null
          setPublished(pub)
          setSavedDraft(dft)
          // Show draft if exists, else published, else defaults
          setDraft(dft ?? pub ?? DEFAULTS)
        }
        setLoading(false)
      })
  }, [])

  // ── Dirty check ──────────────────────────────────────────────────────────

  const compareTo = savedDraft ?? published ?? DEFAULTS
  const hasUnsavedChanges = JSON.stringify(draft) !== JSON.stringify(compareTo)
  const hasDraftChanges = savedDraft !== null && JSON.stringify(savedDraft) !== JSON.stringify(published ?? DEFAULTS)
  const isPublished = published !== null

  // ── Toast ────────────────────────────────────────────────────────────────

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Save draft ───────────────────────────────────────────────────────────

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: SETTING_KEY,
          value: { published: published ?? undefined, draft },
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSavedDraft(draft)
      showToast('Draft saved', 'success')
    } catch {
      showToast('Failed to save draft', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Publish ──────────────────────────────────────────────────────────────

  async function handlePublish() {
    setPublishing(true)
    try {
      const toPublish = savedDraft ?? draft
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: SETTING_KEY,
          value: { published: toPublish, draft: undefined },
        }),
      })
      if (!res.ok) throw new Error('Failed to publish')
      setPublished(toPublish)
      setDraft(toPublish)
      setSavedDraft(null)
      showToast('Popup published — live on the website', 'success')
    } catch {
      showToast('Failed to publish', 'error')
    } finally {
      setPublishing(false)
    }
  }

  // ── Discard draft ────────────────────────────────────────────────────────

  async function handleDiscard() {
    const fallback = published ?? DEFAULTS
    setDraft(fallback)
    setSavedDraft(null)
    // Clear draft from DB
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: SETTING_KEY,
        value: { published: published ?? undefined },
      }),
    })
    showToast('Draft discarded', 'success')
  }

  // ── Field updater ────────────────────────────────────────────────────────

  function update<K extends keyof PopupData>(key: K, value: PopupData[K]) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  // ── Colours ──────────────────────────────────────────────────────────────

  const bg = light ? '#ffffff' : '#0d1017'
  const cardBg = light ? '#f8f9fb' : '#111825'
  const borderCol = light ? '#e2e5ea' : '#1e2e48'
  const inputBg = light ? '#ffffff' : '#0a0d16'
  const inputBorder = light ? '#d1d5db' : 'rgba(255,255,255,0.1)'
  const textPrimary = light ? '#111827' : '#ffffff'
  const textSecondary = light ? '#6b7280' : 'rgba(255,255,255,0.5)'
  const textMuted = light ? '#9ca3af' : 'rgba(255,255,255,0.3)'
  const gold = light ? '#b8870f' : '#c9a84c'
  const goldBright = light ? '#d4a017' : '#f5c842'
  const goldDim = light ? 'rgba(184,135,15,0.08)' : 'rgba(201,168,76,0.1)'
  const goldBorder = light ? 'rgba(184,135,15,0.25)' : 'rgba(201,168,76,0.3)'
  const dangerBg = light ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.1)'
  const dangerBorder = light ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.2)'
  const dangerText = light ? '#dc2626' : '#f87171'
  const successBg = light ? 'rgba(34,197,94,0.08)' : 'rgba(34,197,94,0.1)'
  const successBorder = light ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.2)'
  const successText = light ? '#16a34a' : '#4ade80'

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 120, background: cardBg, borderRadius: 16, border: `1px solid ${borderCol}` }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  // ── Label + Input helpers ────────────────────────────────────────────────

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 6, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: inputBg, border: `1px solid ${inputBorder}`,
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: textPrimary,
    outline: 'none', transition: 'border-color 0.15s',
  }
  const textareaStyle: React.CSSProperties = {
    ...inputStyle, minHeight: 80, resize: 'vertical' as const, fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="lg:!flex-row lg:!items-start">
      {/* ── LEFT: Form ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Status bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
          background: cardBg, borderRadius: 14, border: `1px solid ${borderCol}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: draft.enabled
              ? (isPublished ? '#22c55e' : gold)
              : '#ef4444',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>
            {!isPublished ? 'Not published' : draft.enabled ? 'Live on website' : 'Disabled'}
          </span>
          {hasDraftChanges && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: goldDim, color: gold, border: `1px solid ${goldBorder}`,
              marginLeft: 4,
            }}>
              DRAFT
            </span>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => update('enabled', !draft.enabled)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                background: draft.enabled ? dangerBg : successBg,
                color: draft.enabled ? dangerText : successText,
              }}
            >
              {draft.enabled ? <><EyeOff size={14} /> Disable</> : <><Eye size={14} /> Enable</>}
            </button>
          </div>
        </div>

        {/* Display mode */}
        <div style={{
          padding: 20, background: cardBg, borderRadius: 14,
          border: `1px solid ${borderCol}`,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>Display Frequency</p>
          <p style={{ fontSize: 11, color: textMuted, marginBottom: 14 }}>Control when the popup appears for visitors</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DISPLAY_MODE_OPTIONS.map(opt => {
              const selected = (draft.display_mode ?? 'first_visit') === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => update('display_mode', opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${selected ? goldBorder : borderCol}`,
                    background: selected ? goldDim : 'transparent',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${selected ? gold : textMuted}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: gold }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selected ? textPrimary : textSecondary }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{opt.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Image section */}
        <div style={{
          padding: 20, background: cardBg, borderRadius: 14,
          border: `1px solid ${borderCol}`,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>Image</p>
          <ImageField
            value={draft.image_url}
            onChange={url => update('image_url', url)}
            label="Popup hero image"
          />

          {/* Focus point */}
          <div style={{ marginTop: 16 }}>
            <p style={labelStyle}>Image Focus Point</p>
            <p style={{ fontSize: 11, color: textMuted, marginBottom: 10 }}>
              Click on the image to set the focus point, or adjust manually below.
            </p>
            {draft.image_url ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
                <div
                  style={{
                    position: 'relative', width: 200, maxWidth: '100%', height: 130, borderRadius: 10,
                    overflow: 'hidden', border: `1px solid ${borderCol}`, cursor: 'crosshair',
                    flexShrink: 0,
                  }}
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
                    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
                    update('image_focus_x', x)
                    update('image_focus_y', y)
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.image_url}
                    alt="Focus preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Focus point indicator */}
                  <div style={{
                    position: 'absolute',
                    left: `${draft.image_focus_x}%`,
                    top: `${draft.image_focus_y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 18, height: 18, borderRadius: '50%',
                    border: '2px solid white',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4)',
                    background: 'rgba(201,168,76,0.6)',
                    pointerEvents: 'none',
                  }} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>X %</label>
                    <input
                      type="number" min={0} max={100}
                      value={draft.image_focus_x}
                      onChange={e => update('image_focus_x', Math.min(100, Math.max(0, Number(e.target.value))))}
                      style={{ ...inputStyle, width: 70, textAlign: 'center' as const }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Y %</label>
                    <input
                      type="number" min={0} max={100}
                      value={draft.image_focus_y}
                      onChange={e => update('image_focus_y', Math.min(100, Math.max(0, Number(e.target.value))))}
                      style={{ ...inputStyle, width: 70, textAlign: 'center' as const }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: textMuted, fontStyle: 'italic' }}>
                Select an image first to set focus point
              </p>
            )}
          </div>
        </div>

        {/* Content section */}
        <div style={{
          padding: 20, background: cardBg, borderRadius: 14,
          border: `1px solid ${borderCol}`,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>Content</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Badge */}
            <div>
              <label style={labelStyle}>Badge Text</label>
              <input
                value={draft.badge_text}
                onChange={e => update('badge_text', e.target.value)}
                placeholder="e.g. Limited offer"
                style={inputStyle}
              />
            </div>

            {/* Heading */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={labelStyle}>Heading</label>
                <input
                  value={draft.heading}
                  onChange={e => update('heading', e.target.value)}
                  placeholder="e.g. 2 Weeks"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={labelStyle}>
                  Heading <span style={{ color: gold }}>(Gold text)</span>
                </label>
                <input
                  value={draft.heading_gold}
                  onChange={e => update('heading_gold', e.target.value)}
                  placeholder="e.g. Free"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={draft.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Supporting text below the heading"
                style={textareaStyle}
              />
            </div>
          </div>
        </div>

        {/* Button section */}
        <div style={{
          padding: 20, background: cardBg, borderRadius: 14,
          border: `1px solid ${borderCol}`,
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>Button & Link</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={labelStyle}>Button Text</label>
                <input
                  value={draft.button_text}
                  onChange={e => update('button_text', e.target.value)}
                  placeholder="e.g. Start your free trial"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <label style={labelStyle}>Button Link</label>
                <input
                  value={draft.button_link}
                  onChange={e => update('button_link', e.target.value)}
                  placeholder="e.g. /start-here"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Dismiss Text</label>
              <input
                value={draft.dismiss_text}
                onChange={e => update('dismiss_text', e.target.value)}
                placeholder="e.g. No thanks, I'll look around first"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: 16,
          background: cardBg, borderRadius: 14, border: `1px solid ${borderCol}`,
          position: 'sticky', bottom: 0, zIndex: 10,
        }}>
          {(hasUnsavedChanges || hasDraftChanges) && (
            <button
              onClick={handleDiscard}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: `1px solid ${borderCol}`,
                background: 'transparent', color: textSecondary,
                transition: 'all 0.15s',
              }}
            >
              <RotateCcw size={14} /> Discard
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleSaveDraft}
            disabled={saving || !hasUnsavedChanges}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: saving || !hasUnsavedChanges ? 'not-allowed' : 'pointer',
              border: `1px solid ${goldBorder}`,
              background: goldDim, color: gold,
              opacity: saving || !hasUnsavedChanges ? 0.4 : 1,
              transition: 'all 0.15s',
            }}
          >
            <Save size={14} /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: publishing ? 'not-allowed' : 'pointer',
              border: 'none',
              background: `linear-gradient(135deg, ${gold}, ${goldBright})`,
              color: light ? '#ffffff' : '#07090f',
              opacity: publishing ? 0.6 : 1,
              boxShadow: `0 2px 12px rgba(201,168,76,0.3)`,
              transition: 'all 0.15s',
            }}
          >
            <Send size={14} /> {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      {/* ── RIGHT: Preview ──────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0 }} className="w-full lg:w-[420px] lg:sticky lg:top-6">
        {/* Preview header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: textSecondary }}>Preview</p>
          <div style={{
            display: 'flex', gap: 2, background: light ? '#f0f2f5' : 'rgba(255,255,255,0.04)',
            borderRadius: 8, padding: 2,
          }}>
            {([['desktop', Monitor], ['mobile', Smartphone]] as const).map(([device, Icon]) => (
              <button
                key={device}
                onClick={() => setPreviewDevice(device)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  background: previewDevice === device ? (light ? '#ffffff' : 'rgba(255,255,255,0.1)') : 'transparent',
                  color: previewDevice === device ? textPrimary : textMuted,
                  boxShadow: previewDevice === device ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Icon size={12} /> {device.charAt(0).toUpperCase() + device.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Preview frame */}
        <div style={{
          background: 'rgba(0,0,0,0.7)', borderRadius: 20,
          border: `1px solid ${borderCol}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: previewDevice === 'mobile' ? '40px 60px' : 24,
          minHeight: 500,
        }}>
          {/* Popup card */}
          <div style={{
            width: previewDevice === 'mobile' ? 280 : '100%',
            maxWidth: previewDevice === 'mobile' ? 280 : 380,
            borderRadius: 24, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            background: '#0A0A0A',
            boxShadow: '0 0 80px rgba(150,119,5,0.15)',
            opacity: draft.enabled ? 1 : 0.4,
            transition: 'opacity 0.3s',
          }}>
            {/* Image area */}
            <div style={{
              position: 'relative',
              height: previewDevice === 'mobile' ? 140 : 180,
              overflow: 'hidden',
            }}>
              {draft.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.image_url}
                  alt="Preview"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    objectPosition: `${draft.image_focus_x}% ${draft.image_focus_y}%`,
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  background: 'linear-gradient(135deg, rgba(150,119,5,0.3), #0A0A0A)',
                }} />
              )}
              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, #0A0A0A, rgba(10,10,10,0.6), transparent)',
              }} />
              {/* Close button */}
              <div style={{
                position: 'absolute', right: 8, top: 8,
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </div>
              {/* Badge */}
              {draft.badge_text && (
                <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)' }}>
                  <span style={{
                    display: 'inline-block', borderRadius: 999,
                    border: '1px solid rgba(201,167,10,0.3)',
                    background: 'rgba(150,119,5,0.2)',
                    padding: '4px 14px', fontSize: 9, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 2,
                    color: '#C9A70A', backdropFilter: 'blur(4px)',
                    whiteSpace: 'nowrap',
                  }}>
                    {draft.badge_text}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ textAlign: 'center', padding: previewDevice === 'mobile' ? '18px 20px 22px' : '22px 28px 28px' }}>
              <h2 style={{
                fontSize: previewDevice === 'mobile' ? 22 : 28,
                fontWeight: 700, color: '#ffffff', margin: 0,
                letterSpacing: '-0.02em',
              }}>
                {draft.heading}{' '}
                <span style={{ color: '#C9A70A' }}>{draft.heading_gold}</span>
              </h2>
              {draft.description && (
                <p style={{
                  fontSize: previewDevice === 'mobile' ? 12 : 13,
                  lineHeight: 1.6, color: 'rgba(255,255,255,0.6)',
                  margin: '10px auto 0', maxWidth: 260,
                }}>
                  {draft.description}
                </p>
              )}

              {/* CTA button */}
              {draft.button_text && (
                <div style={{
                  marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 6,
                  borderRadius: 12,
                  background: 'linear-gradient(to right, #967705, #C9A70A)',
                  padding: previewDevice === 'mobile' ? '10px 22px' : '12px 28px',
                  fontSize: previewDevice === 'mobile' ? 12 : 13,
                  fontWeight: 700, color: '#ffffff',
                  boxShadow: '0 4px 24px rgba(150,119,5,0.35)',
                }}>
                  {draft.button_text}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </div>
              )}

              {/* Dismiss */}
              {draft.dismiss_text && (
                <p style={{
                  marginTop: 12, fontSize: 10, color: 'rgba(255,255,255,0.3)',
                }}>
                  {draft.dismiss_text}
                </p>
              )}
            </div>
          </div>

          {/* Disabled overlay label */}
          {!draft.enabled && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '6px 16px', borderRadius: 8,
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: 12, fontWeight: 700,
              pointerEvents: 'none',
            }}>
              DISABLED
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: toast.type === 'success' ? successBg : dangerBg,
          border: `1px solid ${toast.type === 'success' ? successBorder : dangerBorder}`,
          color: toast.type === 'success' ? successText : dangerText,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
