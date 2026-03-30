'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  Sparkles, Download, Copy, Check, X, Send, CheckCircle, AlertCircle,
  Loader2, Clock, Trash2, Image as ImageIcon, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MediaPickerModal } from '@/components/media/MediaPicker'
import type { Review } from './ReviewsPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

type Style = 'quote' | 'bold' | 'minimal'
type SocialPlatform = 'facebook' | 'instagram' | 'linkedin'

interface TextStyles {
  headlineFont: string
  headlineSize: number
  bodyFont: string
  bodySize: number
  textColor: string
}

interface PlatformInfo { connected: boolean; label: string; subtitle?: string }
interface PublishResult { ok: boolean; post_id?: string; error?: string }

interface ScheduledPost {
  id: string
  platforms: string[]
  captions: Record<string, string>
  scheduled_at: string
  status: string
  image_url: string
}

// ─── Style defaults ───────────────────────────────────────────────────────────

const STYLE_DEFAULTS: Record<Style, TextStyles> = {
  quote:   { headlineFont: 'Rajdhani', headlineSize: 54, bodyFont: 'Inter', bodySize: 30, textColor: '#c9a70a' },
  bold:    { headlineFont: 'Rajdhani', headlineSize: 86, bodyFont: 'Inter', bodySize: 28, textColor: '#ffffff' },
  minimal: { headlineFont: 'Inter',    headlineSize: 38, bodyFont: 'Inter', bodySize: 38, textColor: '#ffffff' },
}

const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: 'quote',   label: 'Quote',   desc: 'Elegant centred quote card' },
  { id: 'bold',    label: 'Bold',    desc: 'High-impact headline design' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, understated layout' },
]

const FONTS = ['Rajdhani', 'Inter', 'League Spartan'] as const
const TEXT_COLOURS = [
  { label: 'Gold',      value: '#c9a70a' },
  { label: 'White',     value: '#ffffff' },
  { label: 'Off-white', value: 'rgba(255,255,255,0.75)' },
  { label: 'Dark',      value: '#0a0a0a' },
]

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

// ─── Templates ────────────────────────────────────────────────────────────────

interface TemplateRenderProps {
  review: Review | null
  headline: string
  subheadline: string
  imageUrl?: string
  textStyles: TextStyles
  overlayOpacity: number
}

function TemplateQuote({ review, headline, subheadline, imageUrl, textStyles, overlayOpacity }: TemplateRenderProps) {
  return (
    <div style={{ width: 1080, height: 1080, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
        </>
      )}
      {!imageUrl && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(201,167,10,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      )}
      <div style={{ position: 'absolute', top: 32, left: 32, width: 40, height: 40, borderTop: '2px solid #c9a70a', borderLeft: '2px solid #c9a70a', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: 32, right: 32, width: 40, height: 40, borderTop: '2px solid #c9a70a', borderRight: '2px solid #c9a70a', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: 32, left: 32, width: 40, height: 40, borderBottom: '2px solid #c9a70a', borderLeft: '2px solid #c9a70a', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: 32, right: 32, width: 40, height: 40, borderBottom: '2px solid #c9a70a', borderRight: '2px solid #c9a70a', zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {review && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
            {Array.from({ length: review.rating }).map((_, i) => (
              <svg key={i} width={32} height={32} viewBox="0 0 20 20" fill="#c9a70a"><path d={STAR_PATH} /></svg>
            ))}
          </div>
        )}
        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize, fontWeight: 700, letterSpacing: '-0.5px', textAlign: 'center', marginBottom: 32, lineHeight: 1.1, fontFamily: `${textStyles.headlineFont}, sans-serif` }}>
          &ldquo;{headline}&rdquo;
        </p>
        {review && (
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: textStyles.bodySize, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginBottom: 40, maxWidth: 860, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>
            {review.text.length > 220 ? review.text.slice(0, 220) + '…' : review.text}
          </p>
        )}
        {subheadline && !review && (
          <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: textStyles.bodySize, textAlign: 'center', lineHeight: 1.6, marginBottom: 40, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>
        )}
        {review && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, letterSpacing: 1, marginBottom: 40, fontFamily: 'Arial, sans-serif' }}>— {review.author_name}</p>}
        <div style={{ width: 280, height: 1, background: 'linear-gradient(90deg, transparent, #c9a70a, transparent)', marginBottom: 32 }} />
        <p style={{ color: '#c9a70a', fontSize: 20, fontWeight: 700, letterSpacing: '0.3em', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>NORTHERN WARRIOR</p>
      </div>
    </div>
  )
}

function TemplateBold({ review, headline, subheadline, imageUrl, textStyles, overlayOpacity }: TemplateRenderProps) {
  return (
    <div style={{ width: 1080, height: 1080, background: '#161616', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', position: 'relative', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', overflow: 'hidden' }}>
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, #161616 ${100 - overlayOpacity}%, rgba(22,22,22,0.7) 70%, rgba(22,22,22,0.3) 100%)` }} />
        </>
      )}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: 'linear-gradient(180deg, #c9a70a 0%, #967705 100%)', zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: imageUrl ? '58%' : '100%' }}>
        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize, fontWeight: 900, lineHeight: 1.0, marginBottom: 32, letterSpacing: '-2px', textTransform: 'uppercase', fontFamily: `${textStyles.headlineFont}, sans-serif` }}>
          {headline}
        </p>
        <div style={{ width: 120, height: 4, background: '#c9a70a', marginBottom: 40, borderRadius: 2 }} />
        {subheadline && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: textStyles.bodySize, marginBottom: 32, lineHeight: 1.4, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>}
        {review && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 28, lineHeight: 1.65, marginBottom: 48 }}>&ldquo;{review.text.length > 200 ? review.text.slice(0, 200) + '…' : review.text}&rdquo;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: review.rating }).map((_, i) => (
                  <svg key={i} width={28} height={28} viewBox="0 0 20 20" fill="#c9a70a"><path d={STAR_PATH} /></svg>
                ))}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 22 }}>{review.author_name} · Northern Warrior</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TemplateMinimal({ review, headline, imageUrl, textStyles, overlayOpacity }: TemplateRenderProps) {
  return (
    <div style={{ width: 1080, height: 1080, background: '#111111', display: 'flex', flexDirection: 'column', justifyContent: imageUrl ? 'flex-end' : 'center', padding: '100px', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
      {imageUrl && (
        <>
          <img src={imageUrl} alt="" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', width: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', background: `linear-gradient(180deg, rgba(17,17,17,${1 - overlayOpacity / 100}) 30%, #111111 100%)` }} />
        </>
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {review ? (
          <>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: textStyles.bodySize, lineHeight: 1.7, marginBottom: 56, fontStyle: 'italic', fontFamily: `${textStyles.bodyFont}, sans-serif` }}>
              &ldquo;{review.text.length > 220 ? review.text.slice(0, 220) + '…' : review.text}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <p style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, fontFamily: 'Arial, sans-serif', marginBottom: 6 }}>{review.author_name}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 22, fontFamily: 'Arial, sans-serif', letterSpacing: 1 }}>Northern Warrior Fitness</p>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: review.rating }).map((_, i) => (
                  <svg key={i} width={30} height={30} viewBox="0 0 20 20" fill="#c9a70a"><path d={STAR_PATH} /></svg>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize, fontWeight: 700, lineHeight: 1.3, marginBottom: 40, fontFamily: `${textStyles.headlineFont}, sans-serif` }}>{headline}</p>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, transparent, #c9a70a 30%, #c9a70a 70%, transparent)' }} />
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 space-y-4 ${accent ? 'border-[#967705]/30 bg-[#967705]/5' : 'border-white/[0.07] bg-[#0a0a0a]'}`}>
      <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">{title}</p>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  review: Review | null
  onClearReview: () => void
}

export function PostEditorPanel({ review, onClearReview }: Props) {
  const fullResRef = useRef<HTMLDivElement>(null)

  // ── Canvas state ──────────────────────────────────────────────────────────
  const [style, setStyle] = useState<Style>('quote')
  const [textStyles, setTextStyles] = useState<TextStyles>(STYLE_DEFAULTS.quote)
  const [imageUrl, setImageUrl] = useState('')
  const [overlayOpacity, setOverlayOpacity] = useState(72)
  const [showMediaPicker, setShowMediaPicker] = useState(false)

  // ── Content state ─────────────────────────────────────────────────────────
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const hasContent = headline.length > 0

  // ── AI state ──────────────────────────────────────────────────────────────
  const [freePrompt, setFreePrompt] = useState('')
  const [generating, setGenerating] = useState(false)

  // ── Export state ──────────────────────────────────────────────────────────
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  // ── Social state ──────────────────────────────────────────────────────────
  const [platforms, setPlatforms] = useState<Record<SocialPlatform, PlatformInfo>>({
    facebook:  { connected: false, label: 'Facebook' },
    instagram: { connected: false, label: 'Instagram' },
    linkedin:  { connected: false, label: 'LinkedIn' },
  })
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SocialPlatform>>(new Set())
  const [captions, setCaptions] = useState<Record<SocialPlatform, string>>({ facebook: '', instagram: '', linkedin: '' })
  const [publishing, setPublishing] = useState(false)
  const [publishResults, setPublishResults] = useState<Record<string, PublishResult> | null>(null)

  // ── Schedule state ────────────────────────────────────────────────────────
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [loadingQueue, setLoadingQueue] = useState(false)

  // Load connection status on mount
  useEffect(() => {
    fetch('/api/social/connections')
      .then((r) => r.json())
      .then((data) => {
        setPlatforms({
          facebook:  { connected: data.facebook?.connected ?? false,  label: 'Facebook',  subtitle: data.facebook?.page_name },
          instagram: { connected: data.instagram?.connected ?? false, label: 'Instagram', subtitle: data.instagram?.username ? `@${data.instagram.username}` : undefined },
          linkedin:  { connected: data.linkedin?.connected ?? false,  label: 'LinkedIn',  subtitle: data.linkedin?.organization_name },
        })
        const pre = new Set<SocialPlatform>()
        if (data.facebook?.connected)  pre.add('facebook')
        if (data.instagram?.connected) pre.add('instagram')
        if (data.linkedin?.connected)  pre.add('linkedin')
        setSelectedPlatforms(pre)
      })
      .catch(() => {})
  }, [])

  // Load scheduled queue
  const loadQueue = useCallback(async () => {
    setLoadingQueue(true)
    try {
      const res = await fetch('/api/branding/schedule')
      const data = await res.json()
      setScheduledPosts(data.posts ?? [])
    } catch { /* non-critical */ }
    finally { setLoadingQueue(false) }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  // Reset text styles when style changes
  const handleStyleChange = (s: Style) => {
    setStyle(s)
    setTextStyles(STYLE_DEFAULTS[s])
    setHeadline('')
    setSubheadline('')
    setPublishResults(null)
  }

  const generate = useCallback(async () => {
    setGenerating(true)
    setPublishResults(null)
    try {
      const body = review
        ? { review, style }
        : { prompt: freePrompt || 'Create an engaging post for Northern Warrior Fitness', style }
      const res = await fetch('/api/branding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setHeadline(data.headline ?? '')
      setSubheadline(data.subheadline ?? '')
      setCaption(data.caption ?? '')
      const tags = (data.hashtags ?? []).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')
      setHashtags(tags)
      const fullCaption = tags ? `${data.caption}\n\n${tags}` : data.caption
      setCaptions({ facebook: fullCaption, instagram: fullCaption, linkedin: data.caption ?? '' })
    } finally {
      setGenerating(false)
    }
  }, [review, style, freePrompt])

  const getImageDataUrl = useCallback(async (): Promise<string> => {
    if (!fullResRef.current) throw new Error('Canvas ref not ready')
    return toPng(fullResRef.current, { width: 1080, height: 1080, pixelRatio: 1 })
  }, [])

  const download = useCallback(async () => {
    if (!hasContent) return
    setDownloading(true)
    try {
      const dataUrl = await getImageDataUrl()
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `nw-post-${Date.now()}.png`
      a.click()
    } finally { setDownloading(false) }
  }, [hasContent, getImageDataUrl])

  const publish = useCallback(async () => {
    if (!hasContent || selectedPlatforms.size === 0) return
    setPublishing(true)
    setPublishResults(null)
    try {
      const imageDataUrl = await getImageDataUrl()
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          captions: Object.fromEntries(Array.from(selectedPlatforms).map((p) => [p, captions[p]])),
          platforms: Array.from(selectedPlatforms),
        }),
      })
      const data = await res.json()
      setPublishResults(data.results ?? {})
    } catch (err) {
      setPublishResults({ _error: { ok: false, error: err instanceof Error ? err.message : 'Publish failed' } })
    } finally { setPublishing(false) }
  }, [hasContent, selectedPlatforms, captions, getImageDataUrl])

  const schedule = useCallback(async () => {
    if (!hasContent || selectedPlatforms.size === 0 || !scheduledAt) return
    setScheduling(true)
    try {
      const imageDataUrl = await getImageDataUrl()
      const res = await fetch('/api/branding/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          captions: Object.fromEntries(Array.from(selectedPlatforms).map((p) => [p, captions[p]])),
          platforms: Array.from(selectedPlatforms),
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      })
      if (res.ok) {
        setScheduledAt('')
        await loadQueue()
      }
    } finally { setScheduling(false) }
  }, [hasContent, selectedPlatforms, captions, scheduledAt, getImageDataUrl, loadQueue])

  const cancelScheduled = useCallback(async (id: string) => {
    await fetch(`/api/branding/schedule/${id}`, { method: 'DELETE' })
    await loadQueue()
  }, [loadQueue])

  const copyCaption = useCallback(async () => {
    if (!caption) return
    await navigator.clipboard.writeText(hashtags ? `${caption}\n\n${hashtags}` : caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [caption, hashtags])

  const SCALE = 0.42
  const TemplateComponent = style === 'quote' ? TemplateQuote : style === 'bold' ? TemplateBold : TemplateMinimal
  const templateProps = { review, headline, subheadline, imageUrl: imageUrl || undefined, textStyles, overlayOpacity }
  const connectedPlatforms = (Object.entries(platforms) as [SocialPlatform, PlatformInfo][]).filter(([, v]) => v.connected)

  return (
    <div className="p-5 space-y-4">

      {/* Active review chip */}
      {review && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#967705]/10 border border-[#967705]/30">
          <div className="flex gap-0.5">
            {Array.from({ length: review.rating }).map((_, i) => (
              <svg key={i} width={12} height={12} viewBox="0 0 20 20" fill="#c9a70a"><path d={STAR_PATH} /></svg>
            ))}
          </div>
          <p className="text-xs text-[#c9a70a] font-medium flex-1 truncate">{review.author_name}</p>
          <button onClick={onClearReview} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      {/* A — Template */}
      <Section title="Template">
        <div className="grid grid-cols-3 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStyleChange(s.id)}
              className={`rounded-lg p-3 text-left border transition-all ${
                style === s.id
                  ? 'border-[#967705] bg-[#967705]/10 text-[#c9a70a]'
                  : 'border-white/[0.08] bg-nw-750 text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              <p className="font-semibold text-sm">{s.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{s.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* B — Canvas preview */}
      <Section title="Preview">
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-lg overflow-hidden border border-white/[0.06]" style={{ width: 1080 * SCALE, height: 1080 * SCALE, position: 'relative', flexShrink: 0 }}>
            <div style={{ transformOrigin: 'top left', transform: `scale(${SCALE})`, width: 1080, height: 1080, position: 'absolute', top: 0, left: 0 }}>
              <TemplateComponent {...templateProps} />
            </div>
          </div>
          {hasContent && (
            <Button variant="primary" onClick={download} loading={downloading} className="w-full gap-2">
              <Download size={14} />
              {downloading ? 'Exporting…' : 'Download PNG (1080×1080)'}
            </Button>
          )}
        </div>

        {/* Hidden full-res */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: 1080, height: 1080, overflow: 'hidden', pointerEvents: 'none' }}>
          <div ref={fullResRef}>
            <TemplateComponent {...templateProps} />
          </div>
        </div>
      </Section>

      {/* C — Text & font */}
      <Section title="Text & Font">
        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Headline</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Results That Speak Volumes"
              className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Subheadline <span className="text-white/20">(optional)</span></label>
            <input
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              placeholder="Supporting statement…"
              className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50"
            />
          </div>

          {/* Font family */}
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Headline font</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => setTextStyles((prev) => ({ ...prev, headlineFont: f }))}
                  className={`py-1.5 rounded-lg text-xs border transition-all ${
                    textStyles.headlineFont === f
                      ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                      : 'border-white/[0.08] bg-nw-750 text-white/45 hover:text-white/70'
                  }`}
                  style={{ fontFamily: `${f}, sans-serif` }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Headline size */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-white/40">Headline size</label>
              <span className="text-[11px] text-white/40">{textStyles.headlineSize}px</span>
            </div>
            <input
              type="range" min={32} max={88} step={2}
              value={textStyles.headlineSize}
              onChange={(e) => setTextStyles((prev) => ({ ...prev, headlineSize: Number(e.target.value) }))}
              className="w-full accent-[#c9a70a]"
            />
          </div>

          {/* Text colour */}
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Headline colour</label>
            <div className="flex gap-2">
              {TEXT_COLOURS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTextStyles((prev) => ({ ...prev, textColor: c.value }))}
                  title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    textStyles.textColor === c.value ? 'border-white scale-110' : 'border-transparent hover:border-white/40'
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* D — Media */}
      <Section title="Background Image">
        {imageUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-nw-750 border border-white/[0.08]">
            <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/50 truncate">{imageUrl.split('/').pop()}</p>
              <button onClick={() => setShowMediaPicker(true)} className="text-xs text-[#c9a70a] hover:text-[#967705] transition-colors mt-1">Change image</button>
            </div>
            <button onClick={() => setImageUrl('')} className="text-white/30 hover:text-white/70 flex-shrink-0"><X size={15} /></button>
          </div>
        ) : (
          <button
            onClick={() => setShowMediaPicker(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-nw-750 hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
          >
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <ImageIcon size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Pick from media library</p>
              <p className="text-xs text-white/30 mt-0.5">Used as background photo in the template</p>
            </div>
          </button>
        )}
        {imageUrl && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-white/40">Overlay darkness</label>
              <span className="text-[11px] text-white/40">{overlayOpacity}%</span>
            </div>
            <input
              type="range" min={0} max={90} step={5}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-full accent-[#c9a70a]"
            />
          </div>
        )}
      </Section>

      {/* E — AI Generator */}
      <Section title="AI Post Creator" accent>
        {!review && (
          <div>
            <label className="text-[11px] text-white/40 block mb-1.5">Describe your post <span className="text-white/20">(or pick a review on the left)</span></label>
            <textarea
              value={freePrompt}
              onChange={(e) => setFreePrompt(e.target.value)}
              rows={2}
              placeholder="e.g. Celebrating our new Hyrox class launch in Egremont…"
              className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50 resize-none"
            />
          </div>
        )}
        <Button variant="primary" onClick={generate} loading={generating} className="w-full gap-2">
          <Sparkles size={14} />
          {generating ? 'Generating…' : hasContent ? 'Regenerate with AI' : 'Generate with AI'}
        </Button>
        {caption && (
          <div className="rounded-lg bg-nw-750 border border-white/[0.06] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/35 uppercase tracking-widest">Caption preview</p>
              <button onClick={copyCaption} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#c9a70a] transition-colors">
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-white/65 leading-relaxed">{caption}</p>
            {hashtags && <p className="text-sm text-[#c9a70a]/70">{hashtags}</p>}
          </div>
        )}
      </Section>

      {/* F — Platform captions */}
      <Section title="Platform Captions">
        {connectedPlatforms.length === 0 ? (
          <div className="text-center py-4">
            <Send size={16} className="text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/30">No social accounts connected.</p>
            <a href="/settings" className="text-xs text-[#c9a70a] hover:underline mt-1 inline-block">Connect in Settings →</a>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {connectedPlatforms.map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedPlatforms((prev) => {
                      const next = new Set(prev)
                      next.has(id) ? next.delete(id) : next.add(id)
                      return next
                    })
                    setPublishResults(null)
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedPlatforms.has(id)
                      ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                      : 'border-white/[0.08] bg-nw-750 text-white/45 hover:text-white/70'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded flex-shrink-0 border flex items-center justify-center ${selectedPlatforms.has(id) ? 'border-[#c9a70a] bg-[#c9a70a]' : 'border-white/25'}`}>
                    {selectedPlatforms.has(id) && <Check size={9} className="text-black" strokeWidth={3} />}
                  </span>
                  {info.label}
                  {info.subtitle && <span className="text-white/30">· {info.subtitle}</span>}
                </button>
              ))}
            </div>
            {selectedPlatforms.size > 0 && (
              <div className="space-y-3">
                {Array.from(selectedPlatforms).map((id) => (
                  <div key={id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] text-white/35 uppercase tracking-widest">{platforms[id].label}</label>
                      <span className="text-[10px] text-white/25">{captions[id].length} chars</span>
                    </div>
                    <textarea
                      value={captions[id]}
                      onChange={(e) => setCaptions((prev) => ({ ...prev, [id]: e.target.value }))}
                      rows={3}
                      className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50 resize-none"
                      placeholder={`Caption for ${platforms[id].label}…`}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      {/* G — Publish / Schedule */}
      <Section title="Publish">
        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
          <button
            onClick={() => setScheduleMode(false)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${!scheduleMode ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-750 text-white/40 hover:text-white/70'}`}
          >
            Publish Now
          </button>
          <button
            onClick={() => setScheduleMode(true)}
            className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${scheduleMode ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-750 text-white/40 hover:text-white/70'}`}
          >
            <Calendar size={12} /> Schedule
          </button>
        </div>

        {scheduleMode && (
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-[#967705]/50"
          />
        )}

        {scheduleMode ? (
          <Button
            variant="primary"
            onClick={schedule}
            loading={scheduling}
            disabled={!hasContent || selectedPlatforms.size === 0 || !scheduledAt}
            className="w-full gap-2"
          >
            <Clock size={14} />
            {scheduling ? 'Scheduling…' : `Schedule for ${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}`}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={publish}
            loading={publishing}
            disabled={!hasContent || selectedPlatforms.size === 0}
            className="w-full gap-2"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {publishing ? 'Publishing…' : `Publish to ${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}`}
          </Button>
        )}

        {/* Publish results */}
        {publishResults && (
          <div className="space-y-2">
            {Object.entries(publishResults).map(([platform, result]) => (
              <div key={platform} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${result.ok ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'}`}>
                {result.ok ? <CheckCircle size={14} className="flex-shrink-0" /> : <AlertCircle size={14} className="flex-shrink-0" />}
                <span className="font-medium capitalize">{platform}</span>
                <span className="text-xs opacity-70">{result.ok ? 'Published successfully' : result.error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scheduled queue */}
        {scheduledPosts.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="text-[10px] text-white/35 uppercase tracking-widest">Scheduled Queue</p>
            {loadingQueue ? (
              <p className="text-xs text-white/30">Loading…</p>
            ) : (
              scheduledPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-nw-750 border border-white/[0.07]">
                  <Clock size={13} className="text-[#c9a70a] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 capitalize">{post.platforms.join(', ')}</p>
                    <p className="text-[11px] text-white/35">
                      {new Date(post.scheduled_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => cancelScheduled(post.id)} className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </Section>

      {/* Media picker */}
      {showMediaPicker && (
        <MediaPickerModal
          value={imageUrl}
          onSelect={(url) => { setImageUrl(url); setShowMediaPicker(false) }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  )
}
