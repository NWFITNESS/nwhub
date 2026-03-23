'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Sparkles, Download, Copy, Check, ChevronUp, ChevronDown, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { MediaPickerModal } from '@/components/media/MediaPicker'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Review {
  author_name: string
  rating: number
  text: string
  time: number
  relative_time_description: string
  profile_photo_url: string
}

interface GeneratedContent {
  headline: string
  subheadline: string
  caption: string
  hashtags: string[]
}

type Style = 'quote' | 'bold' | 'minimal'

// ─── Star helpers ─────────────────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i < rating ? '#c9a70a' : 'none'} stroke="#c9a70a" strokeWidth="1.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

// ─── Post Templates ───────────────────────────────────────────────────────────

interface TemplateProps {
  review: Review
  content: GeneratedContent
  imageUrl?: string
}

function TemplateQuote({ review, content, imageUrl }: TemplateProps) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        position: 'relative',
        fontFamily: 'Georgia, serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Background image (if provided) */}
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            crossOrigin="anonymous"
          />
          {/* Dark overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)' }} />
        </>
      )}

      {/* Gold dot pattern overlay */}
      {!imageUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(201,167,10,0.08) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 32, left: 32, width: 40, height: 40, borderTop: '2px solid #c9a70a', borderLeft: '2px solid #c9a70a', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: 32, right: 32, width: 40, height: 40, borderTop: '2px solid #c9a70a', borderRight: '2px solid #c9a70a', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: 32, left: 32, width: 40, height: 40, borderBottom: '2px solid #c9a70a', borderLeft: '2px solid #c9a70a', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: 32, right: 32, width: 40, height: 40, borderBottom: '2px solid #c9a70a', borderRight: '2px solid #c9a70a', zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Stars */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
          {Array.from({ length: review.rating }).map((_, i) => (
            <svg key={i} width={32} height={32} viewBox="0 0 20 20" fill="#c9a70a">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Headline */}
        <p style={{ color: '#c9a70a', fontSize: 54, fontWeight: 700, letterSpacing: '-0.5px', textAlign: 'center', marginBottom: 32, lineHeight: 1.1, fontFamily: 'Arial, sans-serif' }}>
          &ldquo;{content.headline}&rdquo;
        </p>

        {/* Review text */}
        <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 30, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginBottom: 40, maxWidth: 860 }}>
          {review.text.length > 220 ? review.text.slice(0, 220) + '…' : review.text}
        </p>

        {/* Author */}
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, letterSpacing: 1, marginBottom: 40, fontFamily: 'Arial, sans-serif' }}>
          — {review.author_name}
        </p>

        {/* Gold rule */}
        <div style={{ width: 280, height: 1, background: 'linear-gradient(90deg, transparent, #c9a70a, transparent)', marginBottom: 32 }} />

        {/* Brand */}
        <p style={{ color: '#c9a70a', fontSize: 20, fontWeight: 700, letterSpacing: '0.3em', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>
          NORTHERN WARRIOR
        </p>
      </div>
    </div>
  )
}

function TemplateBold({ review, content, imageUrl }: TemplateProps) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: '#161616',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        position: 'relative',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Background image (right half with gradient fade) */}
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%', objectFit: 'cover' }}
            crossOrigin="anonymous"
          />
          {/* Fade left so text stays readable */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #161616 45%, rgba(22,22,22,0.7) 70%, rgba(22,22,22,0.3) 100%)' }} />
        </>
      )}

      {/* Left gold accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 10,
          background: 'linear-gradient(180deg, #c9a70a 0%, #967705 100%)',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: imageUrl ? '58%' : '100%' }}>
        {/* Headline */}
        <p style={{ color: '#ffffff', fontSize: 86, fontWeight: 900, lineHeight: 1.0, marginBottom: 32, letterSpacing: '-2px', textTransform: 'uppercase' }}>
          {content.headline}
        </p>

        {/* Gold divider */}
        <div style={{ width: 120, height: 4, background: '#c9a70a', marginBottom: 40, borderRadius: 2 }} />

        {/* Subheadline */}
        {content.subheadline && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 30, marginBottom: 32, lineHeight: 1.4 }}>
            {content.subheadline}
          </p>
        )}

        {/* Review text */}
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 28, lineHeight: 1.65, marginBottom: 48 }}>
          &ldquo;{review.text.length > 200 ? review.text.slice(0, 200) + '…' : review.text}&rdquo;
        </p>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: review.rating }).map((_, i) => (
              <svg key={i} width={28} height={28} viewBox="0 0 20 20" fill="#c9a70a">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 22 }}>
            {review.author_name} · Northern Warrior
          </span>
        </div>
      </div>
    </div>
  )
}

function TemplateMinimal({ review, content, imageUrl }: TemplateProps) {
  return (
    <div
      style={{
        width: 1080,
        height: 1080,
        background: '#111111',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: imageUrl ? 'flex-end' : 'center',
        padding: '100px',
        position: 'relative',
        fontFamily: 'Georgia, serif',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Background image (top portion) */}
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', width: '100%', objectFit: 'cover' }}
            crossOrigin="anonymous"
          />
          {/* Fade to bg */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(180deg, rgba(17,17,17,0) 30%, #111111 100%)' }} />
        </>
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Review text */}
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 38, lineHeight: 1.7, marginBottom: 56, fontStyle: 'italic' }}>
          &ldquo;{review.text.length > 220 ? review.text.slice(0, 220) + '…' : review.text}&rdquo;
        </p>

        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, fontFamily: 'Arial, sans-serif', marginBottom: 6 }}>
              {review.author_name}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 22, fontFamily: 'Arial, sans-serif', letterSpacing: 1 }}>
              Northern Warrior Fitness
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: review.rating }).map((_, i) => (
              <svg key={i} width={30} height={30} viewBox="0 0 20 20" fill="#c9a70a">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gold line */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, transparent, #c9a70a 30%, #c9a70a 70%, transparent)' }} />
    </div>
  )
}

// ─── Post Generator Panel ─────────────────────────────────────────────────────

const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: 'quote', label: 'Quote', desc: 'Elegant, centred quote card' },
  { id: 'bold', label: 'Bold', desc: 'High-impact headline design' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, understated layout' },
]

function PostGenerator({ review, onClose }: { review: Review; onClose: () => void }) {
  const [style, setStyle] = useState<Style>('quote')
  const [imageUrl, setImageUrl] = useState<string>('')
  const [showMediaPicker, setShowMediaPicker] = useState(false)
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fullResRef = useRef<HTMLDivElement>(null)

  const generate = useCallback(async () => {
    setGenerating(true)
    setContent(null)
    try {
      const res = await fetch('/api/branding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review, style }),
      })
      const data = await res.json()
      setContent(data)
    } finally {
      setGenerating(false)
    }
  }, [review, style])

  const download = useCallback(async () => {
    if (!fullResRef.current || !content) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(fullResRef.current, { width: 1080, height: 1080, pixelRatio: 1 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `nw-post-${review.author_name.toLowerCase().replace(/\s+/g, '-')}.png`
      a.click()
    } finally {
      setDownloading(false)
    }
  }, [content, review.author_name])

  const copyCaption = useCallback(async () => {
    if (!content) return
    const text = `${content.caption}\n\n${content.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  const PostTemplate = style === 'quote' ? TemplateQuote : style === 'bold' ? TemplateBold : TemplateMinimal
  const SCALE = 0.36

  return (
    <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#0f0f0f] p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Create Instagram Post</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors text-sm">
          Close
        </button>
      </div>

      {/* Step 1 — Style picker */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Choose a template</p>
        <div className="grid grid-cols-3 gap-3">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setStyle(s.id); setContent(null) }}
              className={`rounded-lg p-3 text-left border transition-all ${
                style === s.id
                  ? 'border-[#967705] bg-[#967705]/10 text-[#c9a70a]'
                  : 'border-white/[0.08] bg-[#161616] text-white/50 hover:border-white/20 hover:text-white/80'
              }`}
            >
              <p className="font-semibold text-sm">{s.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 1b — Optional image */}
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Background image <span className="normal-case text-white/25">(optional)</span></p>
        {imageUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#161616] border border-white/[0.08]">
            <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 truncate">{imageUrl.split('/').pop()}</p>
              <button
                onClick={() => setShowMediaPicker(true)}
                className="text-xs text-[#c9a70a] hover:text-[#967705] transition-colors mt-1"
              >
                Change image
              </button>
            </div>
            <button
              onClick={() => { setImageUrl(''); setContent(null) }}
              className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
              title="Remove image"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowMediaPicker(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-[#161616] hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
          >
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <ImageIcon size={16} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Add from media library</p>
              <p className="text-xs text-white/30 mt-0.5">Used as background photo in the post</p>
            </div>
          </button>
        )}
      </div>

      {/* Step 2 — Generate */}
      <Button
        variant="primary"
        onClick={generate}
        loading={generating}
        className="w-full gap-2"
      >
        <Sparkles size={15} />
        {generating ? 'Generating…' : content ? 'Regenerate with AI' : 'Generate with AI'}
      </Button>

      {/* Step 3 — Preview + Download */}
      {content && (
        <>
          {/* Scaled preview */}
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Preview</p>
            <div
              className="rounded-lg overflow-hidden"
              style={{ width: 1080 * SCALE, height: 1080 * SCALE, position: 'relative' }}
            >
              <div
                style={{
                  transformOrigin: 'top left',
                  transform: `scale(${SCALE})`,
                  width: 1080,
                  height: 1080,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                <PostTemplate review={review} content={content} imageUrl={imageUrl || undefined} />
              </div>
            </div>
          </div>

          {/* Hidden full-res for download */}
          <div
            style={{
              position: 'fixed',
              left: '-9999px',
              top: '-9999px',
              width: 1080,
              height: 1080,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div ref={fullResRef}>
              <PostTemplate review={review} content={content} imageUrl={imageUrl || undefined} />
            </div>
          </div>

          {/* Download button */}
          <Button variant="primary" onClick={download} loading={downloading} className="w-full gap-2">
            <Download size={15} />
            {downloading ? 'Exporting…' : 'Download as PNG (1080×1080)'}
          </Button>

          {/* Caption panel */}
          <div className="rounded-lg bg-[#161616] border border-white/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 uppercase tracking-widest">Instagram Caption</p>
              <button
                onClick={copyCaption}
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-[#c9a70a] transition-colors"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{content.caption}</p>
            <p className="text-sm text-[#c9a70a]/70 leading-relaxed">
              {content.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
            </p>
          </div>
        </>
      )}

      {/* Media picker modal */}
      {showMediaPicker && (
        <MediaPickerModal
          value={imageUrl}
          onSelect={(url) => { setImageUrl(url); setContent(null) }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)
  const truncated = review.text.length > 180
  const displayText = truncated && !expanded ? review.text.slice(0, 180) + '…' : review.text
  const initial = review.author_name[0]?.toUpperCase() ?? '?'

  return (
    <div className="bg-[#161616] border border-white/[0.08] rounded-xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {review.profile_photo_url ? (
          <img
            src={review.profile_photo_url}
            alt={review.author_name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#967705]/20 border border-[#967705]/30 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-semibold text-[#c9a70a]">{initial}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{review.author_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rating={review.rating} size={12} />
            <span className="text-xs text-white/35">{review.relative_time_description}</span>
          </div>
        </div>
      </div>

      {/* Review text */}
      <div>
        <p className="text-sm text-white/65 leading-relaxed">{displayText}</p>
        {truncated && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1 text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show more</>}
          </button>
        )}
      </div>

      {/* Create Post button */}
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowGenerator(!showGenerator)}
        className="w-full gap-2"
      >
        <Sparkles size={13} />
        {showGenerator ? 'Hide Generator' : 'Create Post'}
      </Button>

      {showGenerator && (
        <PostGenerator review={review} onClose={() => setShowGenerator(false)} />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface BrandingStudioProps {
  placeId: string
}

export function BrandingStudio({ placeId }: BrandingStudioProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [meta, setMeta] = useState<{ place_name: string; rating: number; total_reviews: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/branding/reviews')
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Failed to load reviews')
          return
        }
        setReviews(data.reviews ?? [])
        setMeta({ place_name: data.place_name, rating: data.rating, total_reviews: data.total_reviews })
      } catch {
        setError('Failed to fetch reviews')
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Sparkles size={22} className="text-[#c9a70a]" />
          <h1 className="text-2xl font-bold text-white">Branding Studio</h1>
        </div>
        <p className="text-white/45 text-sm">
          Turn Google reviews into branded Instagram posts using AI.
        </p>
        {meta && (
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Stars rating={Math.round(meta.rating)} size={14} />
              <span className="text-sm text-white/60">{meta.rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-white/35">{meta.total_reviews} reviews on Google</span>
          </div>
        )}
      </div>

      {/* No place ID warning */}
      {!placeId && !loading && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
          <p className="text-sm text-amber-400 font-medium">Google Place ID not configured</p>
          <p className="text-sm text-white/50 mt-1">
            Add your <code className="text-white/70">google_place_id</code> in Settings → Review Settings to load live Google reviews.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#161616] border border-white/[0.08] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Reviews grid */}
      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && reviews.length === 0 && placeId && (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No reviews found for this location.</p>
        </div>
      )}
    </div>
  )
}
