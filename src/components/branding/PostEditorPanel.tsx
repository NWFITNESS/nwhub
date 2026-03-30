'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import {
  Sparkles, Download, Copy, Check, X, Send, CheckCircle, AlertCircle,
  Loader2, Clock, Trash2, Image as ImageIcon, Calendar, Move, Images, Layers,
  GripVertical, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MediaPickerModal, MediaPickerMultiModal } from '@/components/media/MediaPicker'
import type { Review } from './ReviewsPanel'
import {
  type Style, type TextStyles, type TemplateRenderProps,
  STYLES, STYLE_DEFAULTS, TEMPLATE_MAP,
} from './templates'

// ─── Types ────────────────────────────────────────────────────────────────────

type SocialPlatform = 'facebook' | 'instagram' | 'linkedin'

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

// ─── Ratio options ────────────────────────────────────────────────────────────

type PlatformTab = 'instagram' | 'linkedin'

interface PostRatio {
  id: string
  label: string
  ratio: string
  width: number
  height: number
  platform: PlatformTab
}

const RATIO_OPTIONS: PostRatio[] = [
  // Instagram
  { id: 'ig-portrait',   label: 'Portrait',   ratio: '4:5',    width: 1080, height: 1350, platform: 'instagram' },
  { id: 'ig-square',     label: 'Square',     ratio: '1:1',    width: 1080, height: 1080, platform: 'instagram' },
  { id: 'ig-landscape',  label: 'Landscape',  ratio: '1.91:1', width: 1080, height: 566,  platform: 'instagram' },
  { id: 'ig-story',      label: 'Story',      ratio: '9:16',   width: 1080, height: 1920, platform: 'instagram' },
  // LinkedIn
  { id: 'li-landscape',  label: 'Landscape',  ratio: '1.91:1', width: 1200, height: 627,  platform: 'linkedin' },
  { id: 'li-square',     label: 'Square',     ratio: '1:1',    width: 1080, height: 1080, platform: 'linkedin' },
  { id: 'li-portrait',   label: 'Portrait',   ratio: '4:5',    width: 1080, height: 1350, platform: 'linkedin' },
  { id: 'li-story',      label: 'Tall',       ratio: '9:16',   width: 1080, height: 1920, platform: 'linkedin' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const FONTS = ['Rajdhani', 'Inter', 'League Spartan'] as const
const TEXT_COLOURS = [
  { label: 'Gold',      value: '#c9a70a' },
  { label: 'White',     value: '#ffffff' },
  { label: 'Off-white', value: 'rgba(255,255,255,0.75)' },
  { label: 'Dark',      value: '#0a0a0a' },
]

const MAX_PREVIEW_W = 460
const MAX_PREVIEW_H = 520

// ─── Focal point picker ──────────────────────────────────────────────────────

function FocalPointPicker({
  imageUrl,
  position,
  onChange,
}: {
  imageUrl: string
  position: { x: number; y: number }
  onChange: (pos: { x: number; y: number }) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
      onChange({ x: Math.round(x), y: Math.round(y) })
    },
    [onChange],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      updatePosition(e.clientX, e.clientY)
    },
    [updatePosition],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return
      updatePosition(e.clientX, e.clientY)
    },
    [dragging, updatePosition],
  )

  const onPointerUp = useCallback(() => setDragging(false), [])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Move size={11} className="text-white/35" />
        <label className="text-[11px] text-white/40">Focal point</label>
        <span className="text-[10px] text-white/25 ml-auto">{position.x}%, {position.y}%</span>
      </div>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-full h-28 rounded-lg overflow-hidden border border-white/[0.1] cursor-crosshair select-none touch-none"
      >
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/30" />
        {/* Crosshair */}
        <div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${position.x}%`, top: `${position.y}%` }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-[#c9a70a] shadow-[0_0_8px_rgba(201,167,10,0.6)]" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[#c9a70a]/60" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#c9a70a]/60" />
        </div>
      </div>
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

type PostType = 'single' | 'carousel'

// Platform carousel limits
const CAROUSEL_LIMITS: Record<string, number> = {
  instagram: 10,
  facebook: 10,
  linkedin: 9,
}

export function PostEditorPanel({ review, onClearReview }: Props) {
  const fullResRef = useRef<HTMLDivElement>(null)

  // ── Post type ─────────────────────────────────────────────────────────────
  const [postType, setPostType] = useState<PostType>('single')
  const [carouselImages, setCarouselImages] = useState<string[]>([])
  const [showMultiPicker, setShowMultiPicker] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  // Max images based on lowest connected platform limit
  const carouselMax = Math.min(...Object.values(CAROUSEL_LIMITS))

  // ── Ratio state ───────────────────────────────────────────────────────────
  const [platformTab, setPlatformTab] = useState<PlatformTab>('instagram')
  const [ratio, setRatio] = useState<PostRatio>(RATIO_OPTIONS[0]) // IG portrait

  const ratiosForTab = RATIO_OPTIONS.filter((r) => r.platform === platformTab)

  // ── Canvas state ──────────────────────────────────────────────────────────
  const [style, setStyle] = useState<Style>('quote')
  const [textStyles, setTextStyles] = useState<TextStyles>(STYLE_DEFAULTS.quote)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })
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
    return toPng(fullResRef.current, { width: ratio.width, height: ratio.height, pixelRatio: 1 })
  }, [ratio])

  const download = useCallback(async () => {
    if (!hasContent) return
    setDownloading(true)
    try {
      const dataUrl = await getImageDataUrl()
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `nw-post-${ratio.id}-${Date.now()}.png`
      a.click()
    } finally { setDownloading(false) }
  }, [hasContent, getImageDataUrl, ratio])

  const canPublish = postType === 'carousel'
    ? carouselImages.length >= 2 && selectedPlatforms.size > 0
    : hasContent && selectedPlatforms.size > 0

  const publish = useCallback(async () => {
    if (!canPublish) return
    setPublishing(true)
    setPublishResults(null)
    try {
      let payload: Record<string, unknown>

      if (postType === 'carousel') {
        payload = {
          imageUrls: carouselImages,
          captions: Object.fromEntries(Array.from(selectedPlatforms).map((p) => [p, captions[p]])),
          platforms: Array.from(selectedPlatforms),
        }
      } else {
        const imageDataUrl = await getImageDataUrl()
        payload = {
          imageDataUrl,
          captions: Object.fromEntries(Array.from(selectedPlatforms).map((p) => [p, captions[p]])),
          platforms: Array.from(selectedPlatforms),
        }
      }

      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      setPublishResults(data.results ?? {})
    } catch (err) {
      setPublishResults({ _error: { ok: false, error: err instanceof Error ? err.message : 'Publish failed' } })
    } finally { setPublishing(false) }
  }, [canPublish, postType, carouselImages, selectedPlatforms, captions, getImageDataUrl])

  const canSchedule = canPublish && !!scheduledAt

  const schedule = useCallback(async () => {
    if (!canSchedule) return
    setScheduling(true)
    try {
      let payload: Record<string, unknown> = {
        captions: Object.fromEntries(Array.from(selectedPlatforms).map((p) => [p, captions[p]])),
        platforms: Array.from(selectedPlatforms),
        scheduledAt: new Date(scheduledAt).toISOString(),
      }

      if (postType === 'carousel') {
        payload.imageUrls = carouselImages
      } else {
        payload.imageDataUrl = await getImageDataUrl()
      }

      const res = await fetch('/api/branding/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setScheduledAt('')
        await loadQueue()
      }
    } finally { setScheduling(false) }
  }, [canSchedule, postType, carouselImages, selectedPlatforms, captions, scheduledAt, getImageDataUrl, loadQueue])

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

  // ── Preview scaling ─────────────────────────────────────────────────────────
  const SCALE = Math.min(MAX_PREVIEW_W / ratio.width, MAX_PREVIEW_H / ratio.height)
  const previewW = ratio.width * SCALE
  const previewH = ratio.height * SCALE

  const TemplateComponent = TEMPLATE_MAP[style]
  const templateProps: TemplateRenderProps = {
    review,
    headline,
    subheadline,
    imageUrl: imageUrl || undefined,
    imagePosition,
    textStyles,
    overlayOpacity,
    canvasWidth: ratio.width,
    canvasHeight: ratio.height,
  }
  const connectedPlatforms = (Object.entries(platforms) as [SocialPlatform, PlatformInfo][]).filter(([, v]) => v.connected)

  const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

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

      {/* Post type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
        <button
          onClick={() => setPostType('single')}
          className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
            postType === 'single' ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-750 text-white/40 hover:text-white/70'
          }`}
        >
          <Layers size={13} /> Single Post
        </button>
        <button
          onClick={() => setPostType('carousel')}
          className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
            postType === 'carousel' ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-750 text-white/40 hover:text-white/70'
          }`}
        >
          <Images size={13} /> Carousel ({carouselImages.length})
        </button>
      </div>

      {/* ── Carousel mode ────────────────────────────────────────────────────── */}
      {postType === 'carousel' && (
        <Section title={`Carousel Images · ${carouselImages.length}/${carouselMax}`}>
          {/* Image strip */}
          {carouselImages.length > 0 && (
            <div className="space-y-1.5">
              {carouselImages.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragOver={(e) => { e.preventDefault() }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (dragIdx === null || dragIdx === i) return
                    const imgs = [...carouselImages]
                    const [moved] = imgs.splice(dragIdx, 1)
                    imgs.splice(i, 0, moved)
                    setCarouselImages(imgs)
                    setDragIdx(null)
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    dragIdx === i ? 'border-[#967705] bg-[#967705]/10 opacity-60' : 'border-white/[0.07] bg-nw-750 hover:border-white/[0.14]'
                  }`}
                >
                  <GripVertical size={14} className="text-white/20 flex-shrink-0" />
                  <span className="text-[10px] text-white/30 font-mono w-4 flex-shrink-0">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-11 h-11 rounded object-cover flex-shrink-0" />
                  <p className="text-[11px] text-white/40 flex-1 truncate">{url.split('/').pop()}</p>
                  <button
                    onClick={() => setCarouselImages((prev) => prev.filter((_, j) => j !== i))}
                    className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add images button */}
          <button
            onClick={() => setShowMultiPicker(true)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-nw-750 hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
          >
            <Plus size={14} />
            <span className="text-xs font-medium">
              {carouselImages.length === 0 ? 'Select images' : 'Add / change images'}
            </span>
          </button>

          {carouselImages.length > 0 && carouselImages.length < 2 && (
            <p className="text-[11px] text-amber-400/70">Minimum 2 images required for carousel</p>
          )}

          <div className="text-[10px] text-white/25 space-y-0.5">
            <p>Instagram: max 10 · Facebook: max 10 · LinkedIn: max 9</p>
            <p>You cannot mix video and images in a carousel</p>
          </div>

          {showMultiPicker && (
            <MediaPickerMultiModal
              selected={carouselImages}
              onDone={(urls) => { setCarouselImages(urls); setShowMultiPicker(false) }}
              onClose={() => setShowMultiPicker(false)}
              max={carouselMax}
            />
          )}
        </Section>
      )}

      {/* ── Single post mode sections ────────────────────────────────────────── */}
      {postType === 'single' && <>

      {/* A — Template */}
      <Section title="Template">
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleStyleChange(s.id)}
              className={`rounded-lg p-2.5 text-left border transition-all ${
                style === s.id
                  ? 'border-[#967705] bg-[#967705]/10 text-[#c9a70a]'
                  : 'border-white/[0.08] bg-nw-750 text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              <p className="font-semibold text-xs">{s.label}</p>
              <p className="text-[10px] mt-0.5 opacity-60 leading-tight">{s.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* A2 — Aspect Ratio */}
      <Section title="Aspect Ratio">
        {/* Platform tabs */}
        <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
          {(['instagram', 'linkedin'] as PlatformTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setPlatformTab(tab)
                const first = RATIO_OPTIONS.find((r) => r.platform === tab)
                if (first) setRatio(first)
              }}
              className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${
                platformTab === tab ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-750 text-white/40 hover:text-white/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Ratio chips */}
        <div className="grid grid-cols-4 gap-1.5">
          {ratiosForTab.map((r) => (
            <button
              key={r.id}
              onClick={() => setRatio(r)}
              className={`flex flex-col items-center gap-1.5 py-2 rounded-lg border transition-all ${
                ratio.id === r.id
                  ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                  : 'border-white/[0.08] bg-nw-750 text-white/40 hover:text-white/70'
              }`}
            >
              {/* Mini aspect ratio thumbnail */}
              <div
                className={`rounded-[2px] border ${ratio.id === r.id ? 'border-[#c9a70a]' : 'border-white/20'}`}
                style={{
                  width: Math.round((r.width / Math.max(r.width, r.height)) * 24),
                  height: Math.round((r.height / Math.max(r.width, r.height)) * 24),
                }}
              />
              <div className="text-center">
                <p className="text-[10px] font-medium leading-tight">{r.label}</p>
                <p className="text-[9px] opacity-50">{r.ratio}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* B — Canvas preview */}
      <Section title="Preview">
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-lg overflow-hidden border border-white/[0.06]"
            style={{ width: previewW, height: previewH, position: 'relative', flexShrink: 0 }}
          >
            <div style={{ transformOrigin: 'top left', transform: `scale(${SCALE})`, width: ratio.width, height: ratio.height, position: 'absolute', top: 0, left: 0 }}>
              <TemplateComponent {...templateProps} />
            </div>
          </div>
          {hasContent && (
            <Button variant="primary" onClick={download} loading={downloading} className="w-full gap-2">
              <Download size={14} />
              {downloading ? 'Exporting…' : `Download PNG (${ratio.width}×${ratio.height})`}
            </Button>
          )}
        </div>

        {/* Hidden full-res */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: ratio.width, height: ratio.height, overflow: 'hidden', pointerEvents: 'none' }}>
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
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-nw-750 border border-white/[0.08]">
              <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 truncate">{imageUrl.split('/').pop()}</p>
                <button onClick={() => setShowMediaPicker(true)} className="text-xs text-[#c9a70a] hover:text-[#967705] transition-colors mt-1">Change image</button>
              </div>
              <button onClick={() => { setImageUrl(''); setImagePosition({ x: 50, y: 50 }) }} className="text-white/30 hover:text-white/70 flex-shrink-0"><X size={15} /></button>
            </div>
            <FocalPointPicker
              imageUrl={imageUrl}
              position={imagePosition}
              onChange={setImagePosition}
            />
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

      </>}{/* end single-post mode */}

      {/* F — Platform captions (both modes) */}
      <Section title="Platform Captions">
        {connectedPlatforms.length === 0 ? (
          <div className="text-center py-4">
            <Send size={16} className="text-white/20 mx-auto mb-2" />
            <p className="text-xs text-white/30">No social accounts connected.</p>
            <a href="/settings" className="text-xs text-[#c9a70a] hover:underline mt-1 inline-block">Connect in Settings</a>
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
            disabled={!canSchedule}
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
            disabled={!canPublish}
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
