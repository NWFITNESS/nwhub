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
import { VideoTrimmer } from './studio/VideoTrimmer'
import { CoverPicker } from './studio/CoverPicker'
import { MusicPicker } from './studio/MusicPicker'
import { ChevronDown, Film } from 'lucide-react'
import { MediaPickerModal } from '../media/MediaPicker'

interface PlatformInfo { connected: boolean; label: string; subtitle?: string }
interface PublishResult { ok: boolean; post_id?: string; error?: string }
interface MusicTrack {
  id: string
  name: string
  artist: string
  duration_seconds: number
  preview_url: string | null
  isrc: string | null
}

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

// Reel ratio (fixed 9:16)
const REEL_RATIO: PostRatio = { id: 'reel-916', label: 'Reel', ratio: '9:16', width: 1080, height: 1920, platform: 'instagram' }

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

  // ── Video / Reel state ─────────────────────────────────────────────────────
  const [videoUrl, setVideoUrl] = useState('')
  const [videoDuration, setVideoDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [coverTime, setCoverTime] = useState<number | null>(null)
  const [customCoverUrl, setCustomCoverUrl] = useState('')
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null)
  const [showMobileVideoPicker, setShowMobileVideoPicker] = useState(false)

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
  const activeRatio = postType === 'reel' ? REEL_RATIO : ratio

  const getImageDataUrl = useCallback(async (): Promise<string> => {
    if (!fullResRef.current) throw new Error('Canvas ref not ready')
    return toPng(fullResRef.current, { width: activeRatio.width, height: activeRatio.height, pixelRatio: 1 })
  }, [activeRatio])

  const saveToMedia = useCallback(async () => {
    if (!hasContent) return
    setSaving(true)
    setSaved(false)
    try {
      const dataUrl = await getImageDataUrl()
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `nw-post-${activeRatio.id}-${Date.now()}.png`, { type: 'image/png' })
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
  }, [hasContent, getImageDataUrl, activeRatio, headline])

  // ── Publish ───────────────────────────────────────────────────────────────
  const canPublish = postType === 'carousel'
    ? carouselImages.length >= 2 && selectedPlatforms.size > 0
    : postType === 'reel'
    ? !!videoUrl && selectedPlatforms.size > 0
    : hasContent && selectedPlatforms.size > 0

  const publish = useCallback(async () => {
    if (!canPublish) return
    setPublishResults(null)
    try {
      if (postType === 'reel') {
        // Video publish flow
        const res = await fetch('/api/social/publish-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl,
            captions: Object.fromEntries(Array.from(selectedPlatforms).map((p) => [p, captions[p]])),
            platforms: Array.from(selectedPlatforms),
            coverUrl: customCoverUrl || undefined,
            shareToFeed: true,
            audioName: selectedMusic?.name || undefined,
          }),
        })
        const data = await res.json()
        setPublishResults(data.results ?? {})
      } else {
        // Image publish flow (single or carousel)
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
      }
    } catch (err) {
      setPublishResults({ _error: { ok: false, error: err instanceof Error ? err.message : 'Publish failed' } })
    }
  }, [canPublish, postType, videoUrl, customCoverUrl, selectedMusic, carouselImages, selectedPlatforms, captions, getImageDataUrl])

  const schedule = useCallback(async (scheduledAt: string) => {
    if (!canPublish) return
    let payload: Record<string, unknown> = {
      captions: Object.fromEntries(Array.from(selectedPlatforms).map((p) => [p, captions[p]])),
      platforms: Array.from(selectedPlatforms),
      scheduledAt: new Date(scheduledAt).toISOString(),
    }
    if (postType === 'carousel') {
      payload.imageUrls = carouselImages
    } else if (postType === 'reel') {
      payload.videoUrl = videoUrl
      payload.coverUrl = customCoverUrl || undefined
      payload.audioName = selectedMusic?.name || undefined
    } else {
      payload.imageDataUrl = await getImageDataUrl()
    }
    await fetch('/api/branding/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }, [canPublish, postType, videoUrl, customCoverUrl, selectedMusic, carouselImages, selectedPlatforms, captions, getImageDataUrl])

  // ── Template props ────────────────────────────────────────────────────────
  const templateProps: TemplateRenderProps = {
    review,
    headline,
    subheadline,
    imageUrl: imageUrl || undefined,
    imagePosition,
    textStyles,
    overlayOpacity,
    canvasWidth: activeRatio.width,
    canvasHeight: activeRatio.height,
  }

  const isCarousel = postType === 'carousel'
  const isReel = postType === 'reel'

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
            videoUrl={videoUrl}
            videoDuration={videoDuration}
            trimStart={trimStart}
            trimEnd={trimEnd}
          />
        </div>

        {/* Centre: Live preview */}
        <div className="flex-1 overflow-auto bg-nw-950">
          <Preview
            style={style}
            templateProps={templateProps}
            ratio={activeRatio}
            filter={filter}
            fullResRef={fullResRef}
            carouselMode={isCarousel}
            carouselImages={carouselImages}
            activeSlide={activeSlide}
            onSlideChange={setActiveSlide}
            reelMode={isReel}
            videoUrl={videoUrl}
            trimStart={trimStart}
            trimEnd={trimEnd}
            coverTime={coverTime}
            onVideoDurationReady={setVideoDuration}
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
            isReel={isReel}
            videoUrl={videoUrl}
            onVideoChange={setVideoUrl}
            videoDuration={videoDuration}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onTrimStartChange={setTrimStart}
            onTrimEndChange={setTrimEnd}
            coverTime={coverTime}
            onCoverTimeChange={setCoverTime}
            customCoverUrl={customCoverUrl}
            onCustomCoverChange={setCustomCoverUrl}
            selectedMusic={selectedMusic}
            onMusicChange={setSelectedMusic}
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
            ratio={activeRatio}
            filter={filter}
            fullResRef={fullResRef}
            carouselMode={isCarousel}
            carouselImages={carouselImages}
            activeSlide={activeSlide}
            onSlideChange={setActiveSlide}
            reelMode={isReel}
            videoUrl={videoUrl}
            trimStart={trimStart}
            trimEnd={trimEnd}
            coverTime={coverTime}
            onVideoDurationReady={setVideoDuration}
          />
        </div>

        {/* Accordion controls */}
        <div className="bg-nw-900 border-t border-white/[0.06]">
          {isReel && (
            <>
              <MobileAccordion title="Video" defaultOpen>
                <div className="space-y-3">
                  {videoUrl ? (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-nw-750 border border-white/[0.08]">
                      <Film size={16} className="text-[#c9a70a] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/60 truncate">{videoUrl.split('/').pop()}</p>
                        <button onClick={() => setShowMobileVideoPicker(true)} className="text-[10px] text-[#c9a70a]">Change</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowMobileVideoPicker(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-nw-750 hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
                    >
                      <Film size={16} />
                      <span className="text-xs">Pick video from media</span>
                    </button>
                  )}
                </div>
              </MobileAccordion>

              {videoUrl && videoDuration > 0 && (
                <MobileAccordion title="Trim & Clip">
                  <VideoTrimmer
                    duration={videoDuration}
                    trimStart={trimStart}
                    trimEnd={trimEnd}
                    onTrimStartChange={setTrimStart}
                    onTrimEndChange={setTrimEnd}
                  />
                </MobileAccordion>
              )}

              {videoUrl && videoDuration > 0 && (
                <MobileAccordion title="Cover Image">
                  <CoverPicker
                    videoSrc={videoUrl}
                    duration={videoDuration}
                    trimStart={trimStart}
                    trimEnd={trimEnd}
                    coverTime={coverTime}
                    onCoverTimeChange={setCoverTime}
                    customCoverUrl={customCoverUrl}
                    onCustomCoverChange={setCustomCoverUrl}
                  />
                </MobileAccordion>
              )}

              {videoUrl && (
                <MobileAccordion title="Music">
                  <MusicPicker selected={selectedMusic} onSelect={setSelectedMusic} />
                </MobileAccordion>
              )}
            </>
          )}

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

          {!isCarousel && !isReel && (
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

      {/* Mobile video picker */}
      {showMobileVideoPicker && (
        <MediaPickerModal
          value={videoUrl}
          onSelect={(url) => { setVideoUrl(url); setShowMobileVideoPicker(false) }}
          onClose={() => setShowMobileVideoPicker(false)}
        />
      )}
    </div>
  )
}
