'use client'

import { useState } from 'react'
import { ChevronDown, Film } from 'lucide-react'
import type { Style, TextStyles } from '../templates'
import type { Review } from '../ReviewsPanel'
import type { PostRatio, PlatformTab } from './RatioSelector'
import type { SocialPlatform } from './Toolbar'
import { TemplateGrid } from './TemplateGrid'
import { TextEditor } from './TextEditor'
import { ImageControls } from './ImageControls'
import { RatioSelector } from './RatioSelector'
import { CaptionEditor } from './CaptionEditor'
import { VideoTrimmer } from './VideoTrimmer'
import { CoverPicker } from './CoverPicker'
import { MediaPickerModal } from '@/components/media/MediaPicker'

interface PlatformInfo { connected: boolean; label: string; subtitle?: string }

interface Props {
  // Template
  style: Style
  onStyleChange: (s: Style) => void
  // Text
  headline: string
  subheadline: string
  onHeadlineChange: (v: string) => void
  onSubheadlineChange: (v: string) => void
  textStyles: TextStyles
  onTextStylesChange: (s: TextStyles) => void
  // Image
  imageUrl: string
  onImageChange: (url: string) => void
  imagePosition: { x: number; y: number }
  onPositionChange: (pos: { x: number; y: number }) => void
  overlayOpacity: number
  onOverlayChange: (v: number) => void
  filter: string
  onFilterChange: (id: string) => void
  // Ratio
  platformTab: PlatformTab
  onPlatformTabChange: (tab: PlatformTab) => void
  ratio: PostRatio
  onRatioChange: (r: PostRatio) => void
  // Caption
  review: Review | null
  caption: string
  onCaptionChange: (v: string) => void
  hashtags: string
  onHashtagsChange: (v: string) => void
  platforms: Record<SocialPlatform, PlatformInfo>
  selectedPlatforms: Set<SocialPlatform>
  onTogglePlatform: (p: SocialPlatform) => void
  captions: Record<SocialPlatform, string>
  onCaptionsChange: (c: Record<SocialPlatform, string>) => void
  // Mode
  isCarousel: boolean
  isReel: boolean
  // Video (reel mode)
  videoUrl: string
  onVideoChange: (url: string) => void
  videoDuration: number
  trimStart: number
  trimEnd: number
  onTrimStartChange: (v: number) => void
  onTrimEndChange: (v: number) => void
  coverTime: number | null
  onCoverTimeChange: (t: number | null) => void
  customCoverUrl: string
  onCustomCoverChange: (url: string) => void
}

interface AccordionSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  accent?: boolean
}

function AccordionSection({ title, defaultOpen = true, children, accent }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`border-b border-white/[0.06] ${accent ? 'bg-[#967705]/[0.03]' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">{title}</span>
        <ChevronDown
          size={12}
          className={`text-white/30 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export function DesignPanel({
  style, onStyleChange,
  headline, subheadline, onHeadlineChange, onSubheadlineChange,
  textStyles, onTextStylesChange,
  imageUrl, onImageChange, imagePosition, onPositionChange,
  overlayOpacity, onOverlayChange, filter, onFilterChange,
  platformTab, onPlatformTabChange, ratio, onRatioChange,
  review, caption, onCaptionChange, hashtags, onHashtagsChange,
  platforms, selectedPlatforms, onTogglePlatform,
  captions, onCaptionsChange,
  isCarousel, isReel,
  videoUrl, onVideoChange, videoDuration,
  trimStart, trimEnd, onTrimStartChange, onTrimEndChange,
  coverTime, onCoverTimeChange, customCoverUrl, onCustomCoverChange,
}: Props) {
  const [showVideoPicker, setShowVideoPicker] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Design</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isReel ? (
          <>
            {/* Video picker */}
            <AccordionSection title="Video">
              <div className="space-y-3">
                {videoUrl ? (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-nw-750 border border-white/[0.08]">
                    <Film size={16} className="text-[#c9a70a] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/60 truncate">{videoUrl.split('/').pop()}</p>
                      <button onClick={() => setShowVideoPicker(true)} className="text-[10px] text-[#c9a70a] hover:text-[#967705] transition-colors mt-0.5">
                        Change video
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowVideoPicker(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-nw-750 hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
                  >
                    <Film size={16} />
                    <div className="text-left">
                      <p className="text-xs font-medium">Pick video from media</p>
                      <p className="text-[10px] text-white/30 mt-0.5">MP4, WebM, MOV supported</p>
                    </div>
                  </button>
                )}
              </div>
            </AccordionSection>

            {/* Trim controls */}
            {videoUrl && videoDuration > 0 && (
              <AccordionSection title="Trim & Clip">
                <VideoTrimmer
                  duration={videoDuration}
                  trimStart={trimStart}
                  trimEnd={trimEnd}
                  onTrimStartChange={onTrimStartChange}
                  onTrimEndChange={onTrimEndChange}
                />
              </AccordionSection>
            )}

            {/* Cover image */}
            {videoUrl && videoDuration > 0 && (
              <AccordionSection title="Cover Image">
                <CoverPicker
                  videoSrc={videoUrl}
                  duration={videoDuration}
                  trimStart={trimStart}
                  trimEnd={trimEnd}
                  coverTime={coverTime}
                  onCoverTimeChange={onCoverTimeChange}
                  customCoverUrl={customCoverUrl}
                  onCustomCoverChange={onCustomCoverChange}
                />
              </AccordionSection>
            )}
          </>
        ) : !isCarousel ? (
          <>
            <AccordionSection title="Template">
              <TemplateGrid selected={style} onSelect={onStyleChange} />
            </AccordionSection>

            <AccordionSection title="Text & Font">
              <TextEditor
                headline={headline}
                subheadline={subheadline}
                onHeadlineChange={onHeadlineChange}
                onSubheadlineChange={onSubheadlineChange}
                textStyles={textStyles}
                onTextStylesChange={onTextStylesChange}
              />
            </AccordionSection>

            <AccordionSection title="Image & Filters">
              <ImageControls
                imageUrl={imageUrl}
                onImageChange={onImageChange}
                imagePosition={imagePosition}
                onPositionChange={onPositionChange}
                overlayOpacity={overlayOpacity}
                onOverlayChange={onOverlayChange}
                filter={filter}
                onFilterChange={onFilterChange}
              />
            </AccordionSection>

            <AccordionSection title="Format & Ratio">
              <RatioSelector
                platformTab={platformTab}
                onPlatformTabChange={onPlatformTabChange}
                ratio={ratio}
                onRatioChange={onRatioChange}
              />
            </AccordionSection>
          </>
        ) : null}

        <AccordionSection title="Caption & AI" accent>
          <CaptionEditor
            review={review}
            style={style}
            headline={headline}
            onHeadlineChange={onHeadlineChange}
            onSubheadlineChange={onSubheadlineChange}
            caption={caption}
            onCaptionChange={onCaptionChange}
            hashtags={hashtags}
            onHashtagsChange={onHashtagsChange}
            platforms={platforms}
            selectedPlatforms={selectedPlatforms}
            onTogglePlatform={onTogglePlatform}
            captions={captions}
            onCaptionsChange={onCaptionsChange}
          />
        </AccordionSection>
      </div>

      {/* Video picker modal */}
      {showVideoPicker && (
        <MediaPickerModal
          value={videoUrl}
          onSelect={(url) => { onVideoChange(url); setShowVideoPicker(false) }}
          onClose={() => setShowVideoPicker(false)}
        />
      )}
    </div>
  )
}
