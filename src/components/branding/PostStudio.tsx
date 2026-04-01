'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toPng } from 'html-to-image'
import { type Style, type TextStyles, STYLE_DEFAULTS, type TemplateRenderProps } from './templates'
import type { Review } from './ReviewsPanel'
import { Toolbar, type PostType, type SocialPlatform } from './studio/Toolbar'
import { LayersPanel } from './studio/LayersPanel'
import { Preview } from './studio/Preview'
import { DesignPanel } from './studio/DesignPanel'
import { PublishBar } from './studio/PublishBar'
import { RATIO_OPTIONS, type PostRatio, type PlatformTab } from './studio/RatioSelector'
import { FILTERS } from './studio/FilterStrip'

// ── Accordion for mobile ────────────────────────────────────────────────────
import { TemplateGrid } from './studio/TemplateGrid'
import { TextEditor } from './studio/TextEditor'
import { ImageControls } from './studio/ImageControls'
import { RatioSelector } from './studio/RatioSelector'
import { CaptionEditor } from './studio/CaptionEditor'
import { CarouselSlides } from './studio/CarouselSlides'
import { ChevronDown } from 'lucide-react'

interface PlatformInfo { connected: boolean; label: string; subtitle?: string }
interface PublishResult { ok: boolean; post_id?: string; error?: string }

function MobileAccordion({ title, children, defaultOpen = false, accent }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; accent?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`border-b border-white/[0.06] ${accent ? 'bg-[#967705]/[0.03]' : ''}`}>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-4 py-3 text-left">
        <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">{title}</span>
        <ChevronDown size={14} className={`text-white/30 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export function PostStudio() {
  const searchParams = useSearchParams()
  const fullResRef = useRef<HTMLDivElement>(null)

  // ── Post type ──────────────────────────────────────────────────────────────
  const [postType, setPostType] = useState<PostType>('single')

  // ── Review state ───────────────────────────────────────────────────────────
  const [review, setReview] = useState<Review | null>(null)

  // ── Template state ─────────────────────────────────────────────────────────
  const [style, setStyle] = useState<Style>('quote')
  const [textStyles, setTextStyles] = useState<TextStyles>(STYLE_DEFAULTS.quote)

  // ── Content state ──────────────────────────────────────────────────────────
  const [headline, setHeadline] = useState('')
  const [subheadline, setSubheadline] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')

  // ── Image state ────────────────────────────────────────────────────────────
  const [imageUrl, setImageUrl] = useState('')
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })
  const [overlayOpacity, setOverlayOpacity] = useState(72)
  const [filter, setFilter] = useState('none')

  // ── Ratio state ────────────────────────────────────────────────────────────
  const [platformTab, setPlatformTab] = useState<PlatformTab>('instagram')
  const [ratio, setRatio] = useState<PostRatio>(RATIO_OPTIONS[0])

  // ── Carousel state ─────────────────────────────────────────────────────────
  const [carouselImages, setCarouselImages] = useState<string[]>([])
  const [activeSlide, setActiveSlide] = useState(0)

  // ── Social state ───────────────────────────────────────────────────────────
  const [platforms, setPlatforms] = useState<Record<SocialPlatform, PlatformInfo>>({
    facebook:  { connected: false, label: 'Facebook' },
    instagram: { connected: false, label: 'Instagram' },
    linkedin:  { connected: false, label: 'LinkedIn' },
  })
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SocialPlatform>>(new Set())
  const [captions, setCaptions] = useState<Record<SocialPlatform, string>>({ facebook: '', instagram: '', linkedin: '' })
  const [publishResults, setPublishResults] = useState<Record<string, PublishResult> | null>(null)

  // ── Export state ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasContent = headline.length > 0

  // ── Load connections on mount ──────────────────────────────────────────────
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

  // ── Load review from query param ──────────────────────────────────────────
  useEffect(() => {
    const reviewId = searchParams.get('review')
    if (!reviewId) return
    fetch(`/api/branding/reviews?id=${reviewId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.review) {
          setReview(data.review)
          setHeadline(data.review.text?.slice(0, 80) ?? '')
        }
      })
      .catch(() => {})
  }, [searchParams])

  // ── Style change handler ──────────────────────────────────────────────────
  const handleStyleChange = (s: Style) => {
    setStyle(s)
    setTextStyles(STYLE_DEFAULTS[s])
    setHeadline('')
    setSubheadline('')
    setPublishResults(null)
  }

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
    setPublishResults(null)
  }

  // ── Export helpers ────────────────────────────────────────────────────────
  const getImageDataUrl = useCallback(async (): Promise<string> => {
    if (!fullResRef.current) throw new Error('Canvas ref not ready')
    return toPng(fullResRef.current, { width: ratio.width, height: ratio.height, pixelRatio: 1 })
  }, [ratio])

  const saveToMedia = useCallback(async () => {
    if (!hasContent) return
    setSaving(true)
    setSaved(false)
    try {
      const dataUrl = await getImageDataUrl()
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `nw-post-${ratio.id}-${Date.now()}.png`, { type: 'image/png' })
      const form = new FormData()
      form.append('file', file)
      form.append('alt', headline || 'Social post')
      form.append('category', 'social')
      const uploadRes = await fetch('/api/media', { method: 'POST', body: form })
      if (uploadRes.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally { setSaving(false) }
  }, [hasContent, getImageDataUrl, ratio, headline])

  // ── Publish ───────────────────────────────────────────────────────────────
  const canPublish = postType === 'carousel'
    ? carouselImages.length >= 2 && selectedPlatforms.size > 0
    : hasContent && selectedPlatforms.size > 0

  const publish = useCallback(async () => {
    if (!canPublish) return
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
    }
  }, [canPublish, postType, carouselImages, selectedPlatforms, captions, getImageDataUrl])

  const schedule = useCallback(async (scheduledAt: string) => {
    if (!canPublish) return
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
    await fetch('/api/branding/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }, [canPublish, postType, carouselImages, selectedPlatforms, captions, getImageDataUrl])

  // ── Template props ────────────────────────────────────────────────────────
  const filterCss = FILTERS.find(f => f.id === filter)?.css
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

  const isCarousel = postType === 'carousel'

  return (
    <div className="flex flex-col h-full">
      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <Toolbar
        postType={postType}
        onPostTypeChange={setPostType}
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={togglePlatform}
        onSaveToMedia={saveToMedia}
        saving={saving}
        saved={saved}
        hasContent={hasContent}
        review={review}
        onClearReview={() => setReview(null)}
        carouselCount={carouselImages.length}
      />

      {/* ── DESKTOP: 3-column layout ──────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Left: Layers panel */}
        <div className="w-[240px] flex-shrink-0 border-r border-white/[0.06] bg-nw-900 overflow-hidden">
          <LayersPanel
            postType={postType}
            headline={headline}
            subheadline={subheadline}
            imageUrl={imageUrl}
            carouselImages={carouselImages}
            onCarouselImagesChange={setCarouselImages}
            activeSlide={activeSlide}
            onActiveSlideChange={setActiveSlide}
          />
        </div>

        {/* Centre: Live preview */}
        <div className="flex-1 overflow-auto bg-nw-950">
          <Preview
            style={style}
            templateProps={templateProps}
            ratio={ratio}
            filter={filter}
            fullResRef={fullResRef}
            carouselMode={isCarousel}
            carouselImages={carouselImages}
            activeSlide={activeSlide}
            onSlideChange={setActiveSlide}
          />
        </div>

        {/* Right: Design panel */}
        <div className="w-[280px] flex-shrink-0 border-l border-white/[0.06] bg-nw-900 overflow-hidden">
          <DesignPanel
            style={style}
            onStyleChange={handleStyleChange}
            headline={headline}
            subheadline={subheadline}
            onHeadlineChange={setHeadline}
            onSubheadlineChange={setSubheadline}
            textStyles={textStyles}
            onTextStylesChange={setTextStyles}
            imageUrl={imageUrl}
            onImageChange={setImageUrl}
            imagePosition={imagePosition}
            onPositionChange={setImagePosition}
            overlayOpacity={overlayOpacity}
            onOverlayChange={setOverlayOpacity}
            filter={filter}
            onFilterChange={setFilter}
            platformTab={platformTab}
            onPlatformTabChange={setPlatformTab}
            ratio={ratio}
            onRatioChange={setRatio}
            review={review}
            caption={caption}
            onCaptionChange={setCaption}
            hashtags={hashtags}
            onHashtagsChange={setHashtags}
            platforms={platforms}
            selectedPlatforms={selectedPlatforms}
            onTogglePlatform={togglePlatform}
            captions={captions}
            onCaptionsChange={setCaptions}
            isCarousel={isCarousel}
          />
        </div>
      </div>

      {/* ── MOBILE: stacked layout ────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="bg-nw-950 flex-shrink-0" style={{ minHeight: '55vh' }}>
          <Preview
            style={style}
            templateProps={templateProps}
            ratio={ratio}
            filter={filter}
            fullResRef={fullResRef}
            carouselMode={isCarousel}
            carouselImages={carouselImages}
            activeSlide={activeSlide}
            onSlideChange={setActiveSlide}
          />
        </div>

        {/* Accordion controls */}
        <div className="bg-nw-900 border-t border-white/[0.06]">
          {isCarousel && (
            <MobileAccordion title="Slides" defaultOpen>
              <CarouselSlides
                images={carouselImages}
                onImagesChange={setCarouselImages}
                activeSlide={activeSlide}
                onActiveSlideChange={setActiveSlide}
              />
            </MobileAccordion>
          )}

          {!isCarousel && (
            <>
              <MobileAccordion title="Template" defaultOpen>
                <TemplateGrid selected={style} onSelect={handleStyleChange} />
              </MobileAccordion>

              <MobileAccordion title="Text & Font">
                <TextEditor
                  headline={headline}
                  subheadline={subheadline}
                  onHeadlineChange={setHeadline}
                  onSubheadlineChange={setSubheadline}
                  textStyles={textStyles}
                  onTextStylesChange={setTextStyles}
                />
              </MobileAccordion>

              <MobileAccordion title="Image & Filters">
                <ImageControls
                  imageUrl={imageUrl}
                  onImageChange={setImageUrl}
                  imagePosition={imagePosition}
                  onPositionChange={setImagePosition}
                  overlayOpacity={overlayOpacity}
                  onOverlayChange={setOverlayOpacity}
                  filter={filter}
                  onFilterChange={setFilter}
                />
              </MobileAccordion>

              <MobileAccordion title="Format & Ratio">
                <RatioSelector
                  platformTab={platformTab}
                  onPlatformTabChange={setPlatformTab}
                  ratio={ratio}
                  onRatioChange={setRatio}
                />
              </MobileAccordion>
            </>
          )}

          <MobileAccordion title="Caption & AI" accent>
            <CaptionEditor
              review={review}
              style={style}
              headline={headline}
              onHeadlineChange={setHeadline}
              onSubheadlineChange={setSubheadline}
              caption={caption}
              onCaptionChange={setCaption}
              hashtags={hashtags}
              onHashtagsChange={setHashtags}
              platforms={platforms}
              selectedPlatforms={selectedPlatforms}
              onTogglePlatform={togglePlatform}
              captions={captions}
              onCaptionsChange={setCaptions}
            />
          </MobileAccordion>
        </div>
      </div>

      {/* ── PUBLISH BAR ───────────────────────────────────────────────────── */}
      <PublishBar
        canPublish={canPublish}
        selectedPlatforms={selectedPlatforms}
        onPublish={publish}
        onSchedule={schedule}
        publishResults={publishResults}
      />
    </div>
  )
}
