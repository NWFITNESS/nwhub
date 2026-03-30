'use client'

import type { Review } from './ReviewsPanel'

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface TextStyles {
  headlineFont: string
  headlineSize: number
  bodyFont: string
  bodySize: number
  textColor: string
}

export interface TemplateRenderProps {
  review: Review | null
  headline: string
  subheadline: string
  imageUrl?: string
  imagePosition: { x: number; y: number }
  textStyles: TextStyles
  overlayOpacity: number
  canvasWidth: number
  canvasHeight: number
}

export type Style = 'quote' | 'bold' | 'minimal' | 'warrior' | 'radial' | 'diptych' | 'cinematic' | 'neon'

export const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

export const STYLE_DEFAULTS: Record<Style, TextStyles> = {
  quote:    { headlineFont: 'Rajdhani',      headlineSize: 54, bodyFont: 'Inter',    bodySize: 30, textColor: '#c9a70a' },
  bold:     { headlineFont: 'Rajdhani',      headlineSize: 86, bodyFont: 'Inter',    bodySize: 28, textColor: '#ffffff' },
  minimal:  { headlineFont: 'Inter',         headlineSize: 38, bodyFont: 'Inter',    bodySize: 38, textColor: '#ffffff' },
  warrior:  { headlineFont: 'Rajdhani',      headlineSize: 76, bodyFont: 'Rajdhani', bodySize: 24, textColor: '#ffffff' },
  radial:   { headlineFont: 'Rajdhani',      headlineSize: 56, bodyFont: 'Inter',    bodySize: 32, textColor: '#c9a70a' },
  diptych:  { headlineFont: 'Rajdhani',      headlineSize: 58, bodyFont: 'Inter',    bodySize: 26, textColor: '#c9a70a' },
  cinematic:{ headlineFont: 'Rajdhani',      headlineSize: 66, bodyFont: 'Inter',    bodySize: 28, textColor: '#ffffff' },
  neon:     { headlineFont: 'Rajdhani',      headlineSize: 60, bodyFont: 'Inter',    bodySize: 26, textColor: '#c9a70a' },
}

export const STYLES: { id: Style; label: string; desc: string }[] = [
  { id: 'quote',    label: 'Quote',     desc: 'Centred quote card' },
  { id: 'bold',     label: 'Bold',      desc: 'High-impact headline' },
  { id: 'minimal',  label: 'Minimal',   desc: 'Clean understated' },
  { id: 'warrior',  label: 'Warrior',   desc: 'Diagonal slash comp' },
  { id: 'radial',   label: 'Radial',    desc: 'Spotlight glow' },
  { id: 'diptych',  label: 'Diptych',   desc: 'Split image + text' },
  { id: 'cinematic',label: 'Cinematic', desc: 'Full-bleed film' },
  { id: 'neon',     label: 'Neon',      desc: 'Luxury glow frame' },
]

// ─── Star helper ──────────────────────────────────────────────────────────────

function Stars({ n, size, gap = 4 }: { n: number; size: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', gap }}>
      {Array.from({ length: n }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="#c9a70a">
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

// ─── Template 1: Quote ────────────────────────────────────────────────────────

export function TemplateQuote({ review, headline, subheadline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 80 * s
  const c = 40 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: pad, position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
      {imageUrl && <>
        <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: op }} />
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
      </>}
      {!imageUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(201,167,10,0.09) 1px, transparent 1px)', backgroundSize: `${40 * s}px ${40 * s}px` }} />}

      {/* Corner accents */}
      {[['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
        <div key={`${v}${h}`} style={{ position: 'absolute', [v]: 32 * s, [h]: 32 * s, width: c, height: c, [`border${v.charAt(0).toUpperCase() + v.slice(1)}`]: `${2 * s}px solid #c9a70a`, [`border${h.charAt(0).toUpperCase() + h.slice(1)}`]: `${2 * s}px solid #c9a70a`, zIndex: 1 }} />
      ))}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: canvasWidth - pad * 2 }}>
        {review && <><Stars n={review.rating} size={32 * s} gap={6 * s} /><div style={{ height: 36 * s }} /></>}
        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s, fontWeight: 700, letterSpacing: '-0.5px', textAlign: 'center', lineHeight: 1.15, fontFamily: `${textStyles.headlineFont}, sans-serif`, marginBottom: 32 * s }}>
          &ldquo;{headline}&rdquo;
        </p>
        {review
          ? <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: textStyles.bodySize * s, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.6, marginBottom: 40 * s, maxWidth: 860 * s, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{review.text.length > 220 ? review.text.slice(0, 220) + '…' : review.text}</p>
          : subheadline ? <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: textStyles.bodySize * s, textAlign: 'center', lineHeight: 1.6, marginBottom: 40 * s, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>
          : null}
        {review && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22 * s, letterSpacing: 1, marginBottom: 40 * s }}>— {review.author_name}</p>}
        <div style={{ width: 280 * s, height: 1, background: 'linear-gradient(90deg, transparent, #c9a70a, transparent)', marginBottom: 32 * s }} />
        <p style={{ color: '#c9a70a', fontSize: 20 * s, fontWeight: 700, letterSpacing: '0.3em', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>NORTHERN WARRIOR</p>
      </div>
    </div>
  )
}

// ─── Template 2: Bold ─────────────────────────────────────────────────────────

export function TemplateBold({ review, headline, subheadline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 80 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, background: '#161616', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: pad, position: 'relative', fontFamily: 'Arial, sans-serif', boxSizing: 'border-box', overflow: 'hidden' }}>
      {imageUrl && <>
        <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', right: 0, top: 0, width: '55%', height: '100%', objectFit: 'cover', objectPosition: op }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, #161616 ${100 - overlayOpacity}%, rgba(22,22,22,0.7) 70%, rgba(22,22,22,0.3) 100%)` }} />
      </>}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10 * s, background: 'linear-gradient(180deg, #c9a70a 0%, #967705 100%)', zIndex: 1 }} />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: imageUrl ? '58%' : '100%' }}>
        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s, fontWeight: 900, lineHeight: 1.0, marginBottom: 32 * s, letterSpacing: '-2px', textTransform: 'uppercase', fontFamily: `${textStyles.headlineFont}, sans-serif` }}>{headline}</p>
        <div style={{ width: 120 * s, height: 4 * s, background: '#c9a70a', marginBottom: 40 * s, borderRadius: 2 }} />
        {subheadline && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: textStyles.bodySize * s, marginBottom: 32 * s, lineHeight: 1.4, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>}
        {review && <>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 28 * s, lineHeight: 1.65, marginBottom: 48 * s }}>&ldquo;{review.text.length > 200 ? review.text.slice(0, 200) + '…' : review.text}&rdquo;</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 * s }}>
            <Stars n={review.rating} size={28 * s} gap={4 * s} />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 22 * s }}>{review.author_name} · Northern Warrior</span>
          </div>
        </>}
      </div>
    </div>
  )
}

// ─── Template 3: Minimal ──────────────────────────────────────────────────────

export function TemplateMinimal({ review, headline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 100 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, background: '#111111', display: 'flex', flexDirection: 'column', justifyContent: imageUrl ? 'flex-end' : 'center', padding: pad, position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
      {imageUrl && <>
        <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', width: '100%', objectFit: 'cover', objectPosition: op }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '65%', background: `linear-gradient(180deg, rgba(17,17,17,${1 - overlayOpacity / 100}) 30%, #111111 100%)` }} />
      </>}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {review ? <>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: textStyles.bodySize * s, lineHeight: 1.7, marginBottom: 56 * s, fontStyle: 'italic', fontFamily: `${textStyles.bodyFont}, sans-serif` }}>
            &ldquo;{review.text.length > 220 ? review.text.slice(0, 220) + '…' : review.text}&rdquo;
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 * s }}>
            <div>
              <p style={{ color: '#ffffff', fontSize: 28 * s, fontWeight: 700, fontFamily: 'Arial, sans-serif', marginBottom: 6 * s }}>{review.author_name}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 22 * s, fontFamily: 'Arial, sans-serif', letterSpacing: 1 }}>Northern Warrior Fitness</p>
            </div>
            <Stars n={review.rating} size={30 * s} gap={4 * s} />
          </div>
        </> : <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s, fontWeight: 700, lineHeight: 1.3, marginBottom: 40 * s, fontFamily: `${textStyles.headlineFont}, sans-serif` }}>{headline}</p>}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 * s, background: 'linear-gradient(90deg, transparent, #c9a70a 30%, #c9a70a 70%, transparent)' }} />
    </div>
  )
}

// ─── Template 4: Warrior ─────────────────────────────────────────────────────
// Dark diagonal composition — left text, right image, gold slash separator

export function TemplateWarrior({ review, headline, subheadline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 80 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`

  // Diagonal boundary: top at 62%, bottom at 46%
  const topX = canvasWidth * 0.62
  const botX = canvasWidth * 0.46
  const textW = botX - pad * 0.6

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, background: '#0c0c0c', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>

      {/* NW watermark */}
      <p style={{ position: 'absolute', top: -80 * s, left: -30 * s, fontSize: 640 * s, fontWeight: 900, color: 'rgba(201,167,10,0.045)', fontFamily: 'Rajdhani, sans-serif', zIndex: 0, lineHeight: 1, whiteSpace: 'nowrap' }}>NW</p>

      {/* Right panel: image or dark gradient */}
      {imageUrl ? (
        <div style={{ position: 'absolute', inset: 0, clipPath: `polygon(${topX}px 0, ${canvasWidth}px 0, ${canvasWidth}px ${canvasHeight}px, ${botX}px ${canvasHeight}px)` }}>
          <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: op }} />
          <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(overlayOpacity / 100) * 0.55})` }} />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, clipPath: `polygon(${topX}px 0, ${canvasWidth}px 0, ${canvasWidth}px ${canvasHeight}px, ${botX}px ${canvasHeight}px)`, background: 'linear-gradient(135deg, #1c1700 0%, #0a0a0a 100%)' }} />
      )}

      {/* Gold slash bar */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, clipPath: `polygon(${topX}px 0, ${topX + 14 * s}px 0, ${botX + 14 * s}px ${canvasHeight}px, ${botX}px ${canvasHeight}px)`, background: 'linear-gradient(180deg, #c9a70a 0%, #7a5d00 100%)', zIndex: 3 }} />

      {/* Text content */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: textW, zIndex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: pad, paddingBottom: pad * 1.4, paddingLeft: pad, paddingRight: 28 * s }}>
        {review && <><Stars n={review.rating} size={24 * s} gap={4 * s} /><div style={{ height: 24 * s }} /></>}
        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s * 0.88, fontWeight: 900, lineHeight: 1.0, marginBottom: 18 * s, textTransform: 'uppercase', letterSpacing: '-1px', fontFamily: `${textStyles.headlineFont}, sans-serif` }}>{headline}</p>
        <div style={{ width: 56 * s, height: 4 * s, background: '#c9a70a', marginBottom: 18 * s, borderRadius: 2 }} />
        {review ? (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 19 * s, lineHeight: 1.55, marginBottom: 24 * s, fontFamily: 'Arial, sans-serif' }}>
            &ldquo;{review.text.slice(0, 120)}{review.text.length > 120 ? '…' : ''}&rdquo;
          </p>
        ) : subheadline ? (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: textStyles.bodySize * s * 0.72, lineHeight: 1.5, marginBottom: 24 * s, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>
        ) : null}
        {review && <p style={{ color: '#c9a70a', fontSize: 17 * s, letterSpacing: '0.14em', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>{review.author_name}</p>}
        <p style={{ position: 'absolute', bottom: pad * 0.6, left: pad, color: 'rgba(255,255,255,0.18)', fontSize: 13 * s, letterSpacing: '0.35em', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase' }}>NORTHERN WARRIOR</p>
      </div>
    </div>
  )
}

// ─── Template 5: Radial ───────────────────────────────────────────────────────
// Spotlight glow from centre — oversized decorative quote mark

export function TemplateRadial({ review, headline, subheadline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 100 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: pad, position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
      {imageUrl && <>
        <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: op }} />
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100})` }} />
      </>}

      {/* Radial glow */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse ${canvasWidth * 0.7}px ${canvasHeight * 0.5}px at ${cx}px ${cy}px, rgba(201,167,10,0.1) 0%, transparent 70%)` }} />

      {/* Giant decorative opening quote */}
      <p style={{ position: 'absolute', top: -40 * s, left: 28 * s, fontSize: 480 * s, color: 'rgba(201,167,10,0.06)', fontFamily: 'Georgia, serif', lineHeight: 1, zIndex: 0, userSelect: 'none', pointerEvents: 'none' }}>&ldquo;</p>

      {/* Thin gold top rule */}
      <div style={{ position: 'absolute', top: 60 * s, left: '50%', transform: 'translateX(-50%)', width: 60 * s, height: 1.5 * s, background: '#c9a70a' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: canvasWidth - pad * 2 }}>
        {review && <><div style={{ height: 20 * s }} /><Stars n={review.rating} size={28 * s} gap={5 * s} /><div style={{ height: 40 * s }} /></>}

        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, fontFamily: `${textStyles.headlineFont}, sans-serif`, marginBottom: 36 * s, letterSpacing: '-0.3px' }}>
          {headline}
        </p>

        {review ? (
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: textStyles.bodySize * s, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.7, marginBottom: 44 * s, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>
            {review.text.length > 200 ? review.text.slice(0, 200) + '…' : review.text}
          </p>
        ) : subheadline ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: textStyles.bodySize * s, textAlign: 'center', lineHeight: 1.7, marginBottom: 44 * s, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>
        ) : null}

        {review && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 * s }}>
            <div style={{ width: 40 * s, height: 1, background: 'rgba(201,167,10,0.4)' }} />
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 20 * s, letterSpacing: '0.12em', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' }}>{review.author_name}</p>
          </div>
        )}
      </div>

      {/* Bottom brand */}
      <p style={{ position: 'absolute', bottom: 48 * s, color: 'rgba(201,167,10,0.5)', fontSize: 16 * s, letterSpacing: '0.35em', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase' }}>NORTHERN WARRIOR</p>
    </div>
  )
}

// ─── Template 6: Diptych ─────────────────────────────────────────────────────
// Split panel — left image, right dark text area with gold divider

export function TemplateDiptych({ review, headline, subheadline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 72 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`
  const splitAt = Math.round(canvasWidth * 0.48)
  const borderW = Math.round(6 * s)

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, display: 'flex', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', background: '#0a0a0a' }}>
      {/* Left: image panel */}
      <div style={{ width: splitAt, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: op }} />
            <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${overlayOpacity / 100 * 0.4})` }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1400 0%, #0c0c0c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'rgba(201,167,10,0.15)', fontSize: 280 * s, fontWeight: 900, fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>NW</p>
          </div>
        )}
      </div>

      {/* Gold divider */}
      <div style={{ width: borderW, flexShrink: 0, background: 'linear-gradient(180deg, #c9a70a 0%, #7a5d00 100%)', zIndex: 2 }} />

      {/* Right: text panel */}
      <div style={{ flex: 1, background: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: pad, paddingLeft: pad * 0.85 }}>
        {review && <><Stars n={review.rating} size={22 * s} gap={4 * s} /><div style={{ height: 28 * s }} /></>}
        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s * 0.82, fontWeight: 800, lineHeight: 1.1, marginBottom: 24 * s, fontFamily: `${textStyles.headlineFont}, sans-serif`, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{headline}</p>
        <div style={{ width: 48 * s, height: 3 * s, background: '#c9a70a', marginBottom: 24 * s, borderRadius: 2 }} />
        {review ? (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 20 * s, lineHeight: 1.65, marginBottom: 32 * s, fontFamily: `${textStyles.bodyFont}, sans-serif`, fontStyle: 'italic' }}>
            &ldquo;{review.text.slice(0, 160)}{review.text.length > 160 ? '…' : ''}&rdquo;
          </p>
        ) : subheadline ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: textStyles.bodySize * s * 0.75, lineHeight: 1.55, marginBottom: 32 * s, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>
        ) : null}
        {review && <p style={{ color: 'rgba(201,167,10,0.8)', fontSize: 16 * s, letterSpacing: '0.15em', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 * s }}>{review.author_name}</p>}
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 * s, letterSpacing: '0.3em', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', position: 'absolute', bottom: pad * 0.7, right: pad * 0.7 }}>NW FITNESS</p>
      </div>
    </div>
  )
}

// ─── Template 7: Cinematic ───────────────────────────────────────────────────
// Full-bleed image, heavy bottom gradient, film-still aesthetic

export function TemplateCinematic({ review, headline, subheadline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 80 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`
  const baseColor = '#0d0d0d'

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, background: baseColor, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
      {/* Full bleed image */}
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: op }} />
          {/* Cinematic gradient: light top vignette + heavy bottom darkening */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,${overlayOpacity / 100 * 0.6}) 55%, rgba(5,5,5,0.92) 75%, ${baseColor} 100%)` }} />
          {/* Side vignetttes */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #100e00 0%, #0d0d0d 60%)` }} />
      )}

      {/* Letterbox bars */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14 * s, background: '#000' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14 * s, background: '#000' }} />

      {/* Gold thin line above text */}
      <div style={{ position: 'absolute', bottom: 220 * s, left: pad, right: pad, height: 1, background: 'rgba(201,167,10,0.45)' }} />

      {/* Bottom text block */}
      <div style={{ position: 'absolute', bottom: 14 * s + 44 * s, left: pad, right: pad, zIndex: 2 }}>
        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s, fontWeight: 800, lineHeight: 1.05, marginBottom: 20 * s, fontFamily: `${textStyles.headlineFont}, sans-serif`, letterSpacing: '-0.5px', textTransform: 'uppercase' }}>{headline}</p>
        {review ? (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 22 * s, lineHeight: 1.5, marginBottom: 20 * s, fontFamily: `${textStyles.bodyFont}, sans-serif`, fontStyle: 'italic' }}>
            &ldquo;{review.text.slice(0, 130)}{review.text.length > 130 ? '…' : ''}&rdquo;
          </p>
        ) : subheadline ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: textStyles.bodySize * s * 0.75, lineHeight: 1.5, marginBottom: 20 * s, fontFamily: `${textStyles.bodyFont}, sans-serif` }}>{subheadline}</p>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * s }}>
            {review && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 18 * s, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>{review.author_name}</p>}
            <p style={{ color: 'rgba(201,167,10,0.55)', fontSize: 14 * s, letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>NORTHERN WARRIOR FITNESS</p>
          </div>
          {review && <Stars n={review.rating} size={20 * s} gap={3 * s} />}
        </div>
      </div>
    </div>
  )
}

// ─── Template 8: Neon ─────────────────────────────────────────────────────────
// Pure black, glowing gold border, luxury minimal centre treatment

export function TemplateNeon({ review, headline, subheadline, imageUrl, imagePosition, textStyles, overlayOpacity, canvasWidth, canvasHeight }: TemplateRenderProps) {
  const s = canvasWidth / 1080
  const pad = 80 * s
  const inset = 32 * s
  const op = `${imagePosition.x}% ${imagePosition.y}%`

  return (
    <div style={{ width: canvasWidth, height: canvasHeight, background: '#000000', position: 'relative', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {imageUrl && <>
        <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: op }} />
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.55 + (overlayOpacity / 100) * 0.4})` }} />
      </>}

      {/* Outer glow frame */}
      <div style={{
        position: 'absolute',
        top: inset, left: inset, right: inset, bottom: inset,
        border: `${1.5 * s}px solid rgba(201,167,10,0.75)`,
        boxShadow: `0 0 ${40 * s}px rgba(201,167,10,0.18), 0 0 ${80 * s}px rgba(201,167,10,0.08), inset 0 0 ${40 * s}px rgba(201,167,10,0.06)`,
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Inner inset line */}
      <div style={{ position: 'absolute', top: inset + 10 * s, left: inset + 10 * s, right: inset + 10 * s, bottom: inset + 10 * s, border: `${0.75 * s}px solid rgba(201,167,10,0.18)`, zIndex: 1, pointerEvents: 'none' }} />

      {/* Corner dots */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => (
        <div key={i} style={{
          position: 'absolute',
          [dy < 0 ? 'top' : 'bottom']: inset - 5 * s,
          [dx < 0 ? 'left' : 'right']: inset - 5 * s,
          width: 10 * s, height: 10 * s,
          borderRadius: '50%',
          background: 'rgba(201,167,10,0.85)',
          boxShadow: `0 0 ${12 * s}px rgba(201,167,10,0.7)`,
          zIndex: 2,
        }} />
      ))}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: pad, maxWidth: canvasWidth - inset * 2 - pad, textAlign: 'center' }}>
        {/* Top gold line */}
        <div style={{ width: 80 * s, height: 1.5 * s, background: 'linear-gradient(90deg, transparent, #c9a70a, transparent)', marginBottom: review ? 32 * s : 24 * s }} />

        {review && <><Stars n={review.rating} size={28 * s} gap={6 * s} /><div style={{ height: 32 * s }} /></>}

        <p style={{ color: textStyles.textColor, fontSize: textStyles.headlineSize * s, fontWeight: 700, lineHeight: 1.15, fontFamily: `${textStyles.headlineFont}, sans-serif`, letterSpacing: '-0.3px', marginBottom: 28 * s, textShadow: '0 0 40px rgba(201,167,10,0.3)' }}>
          {headline}
        </p>

        {review ? (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: textStyles.bodySize * s * 0.8, lineHeight: 1.7, fontStyle: 'italic', fontFamily: `${textStyles.bodyFont}, sans-serif`, marginBottom: 36 * s }}>
            &ldquo;{review.text.length > 200 ? review.text.slice(0, 200) + '…' : review.text}&rdquo;
          </p>
        ) : subheadline ? (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: textStyles.bodySize * s * 0.8, lineHeight: 1.6, fontFamily: `${textStyles.bodyFont}, sans-serif`, marginBottom: 36 * s }}>{subheadline}</p>
        ) : null}

        {review && <p style={{ color: 'rgba(201,167,10,0.6)', fontSize: 18 * s, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', marginBottom: 24 * s }}>— {review.author_name}</p>}

        <div style={{ width: 80 * s, height: 1.5 * s, background: 'linear-gradient(90deg, transparent, #c9a70a, transparent)', marginBottom: 20 * s }} />

        <p style={{ color: 'rgba(201,167,10,0.45)', fontSize: 15 * s, letterSpacing: '0.4em', textTransform: 'uppercase', fontFamily: 'Rajdhani, sans-serif' }}>NORTHERN WARRIOR</p>
      </div>
    </div>
  )
}

// ─── Template map ─────────────────────────────────────────────────────────────

export const TEMPLATE_MAP: Record<Style, (p: TemplateRenderProps) => React.ReactElement> = {
  quote:    TemplateQuote,
  bold:     TemplateBold,
  minimal:  TemplateMinimal,
  warrior:  TemplateWarrior,
  radial:   TemplateRadial,
  diptych:  TemplateDiptych,
  cinematic:TemplateCinematic,
  neon:     TemplateNeon,
}
