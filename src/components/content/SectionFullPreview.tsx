'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroFullPreview({ content }: { content: Record<string, unknown> }) {
  const { kicker, heading, subtext, image_url } = content as {
    kicker?: string
    heading?: string
    subtext?: string
    image_url?: string
  }

  return (
    <div className="relative flex flex-col justify-end overflow-hidden bg-[#0a0a0a]" style={{ minHeight: '85vh' }}>
      {/* Background image */}
      {image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#111] via-[#0d0d0d] to-[#1a1a1a]" />
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/85" />
      {/* Blue glow top-left */}
      <div
        className="absolute rounded-full"
        style={{
          left: -60,
          top: -60,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(45,124,255,0.18), transparent 60%)',
        }}
      />
      {/* Gold glow bottom-right */}
      <div
        className="absolute rounded-full"
        style={{
          right: -60,
          bottom: -60,
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(150,119,5,0.18), transparent 60%)',
        }}
      />
      {/* Text anchored bottom */}
      <div className="relative z-10 pb-20 pl-16">
        {kicker && (
          <p className="text-xs uppercase tracking-[0.35em] text-white/50 mb-3">{kicker}</p>
        )}
        {heading && (
          <p
            className="font-bold tracking-tight text-white leading-[1.0]"
            style={{ fontSize: '5rem' }}
          >
            {heading}
          </p>
        )}
        {subtext && (
          <p className="text-lg text-white/60 max-w-lg mt-5 leading-relaxed">{subtext}</p>
        )}
        {!kicker && !heading && !subtext && (
          <p className="text-white/20 text-lg italic">No content yet</p>
        )}
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ q: string; a: string }>) ?? []
  const heading = content.heading as string | undefined
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="py-24 px-16 bg-[#0a0a0a]">
      {heading && (
        <p className="text-3xl font-bold text-white mb-10">{heading}</p>
      )}
      {items.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No questions yet</p>
      )}
      <div>
        {items.map((item, i) => (
          <div
            key={i}
            className="border-b border-white/10 py-5 flex justify-between cursor-pointer select-none"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <div className="flex-1 pr-8">
              <p className="text-base font-medium text-white">{item.q || 'Question…'}</p>
              {openIndex === i && item.a && (
                <p className="text-sm text-white/55 leading-relaxed pt-3 pb-2">{item.a}</p>
              )}
            </div>
            <ChevronDown
              size={18}
              className="text-white/40 flex-shrink-0 mt-0.5 transition-transform duration-200"
              style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Memberships ─────────────────────────────────────────────────────────────

function MembershipsFullPreview({ content }: { content: Record<string, unknown> }) {
  const cards = (content.cards as Array<{
    title: string
    price: string
    period: string
    desc: string
    highlight?: boolean
  }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-24 px-16 bg-[#0a0a0a]">
      {heading && (
        <p className="text-3xl font-bold text-white mb-10">{heading}</p>
      )}
      {cards.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No plans defined</p>
      )}
      <div className="grid grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-8 relative overflow-hidden ${
              card.highlight
                ? 'border-white/25 bg-white/[0.04]'
                : 'border-white/15'
            }`}
          >
            {card.highlight && (
              <span className="inline-flex rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-widest uppercase text-white/70 mb-4">
                Best Value
              </span>
            )}
            <p className="text-sm font-semibold text-white mb-1">{card.title || 'Plan'}</p>
            {card.desc && (
              <p className="text-sm text-white/50 mb-6 leading-relaxed">{card.desc}</p>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{card.price}</span>
              {card.period && (
                <span className="text-sm text-white/40">{card.period}</span>
              )}
            </div>
            {card.highlight && (
              <div
                className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.22), transparent 60%)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Icon Row ─────────────────────────────────────────────────────────────────

function IconRowFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ num: string; title: string; desc: string }>) ?? []

  return (
    <div className="bg-[#0a0a0a]">
      {items.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No stats defined</p>
      )}
      <div className="grid grid-cols-4 gap-px bg-white/[0.06]">
        {items.slice(0, 4).map((item, i) => (
          <div key={i} className="bg-[#0a0a0a] p-12 flex flex-col gap-2">
            <p
              className="text-6xl font-black leading-none"
              style={{ color: i === 0 ? '#2D7CFF' : '#967705' }}
            >
              {item.num || '—'}
            </p>
            <p className="text-sm font-bold text-white mt-2">{item.title}</p>
            {item.desc && (
              <p className="text-sm text-white/50">{item.desc}</p>
            )}
          </div>
        ))}
      </div>
      {items.length > 4 && (
        <p className="text-xs text-white/30 text-center py-3">+{items.length - 4} more</p>
      )}
    </div>
  )
}

// ─── Scroll Story ─────────────────────────────────────────────────────────────

function ScrollStoryFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title: string; copy: string }>) ?? []

  return (
    <div className="relative py-24 px-16 bg-[#0a0a0a] overflow-hidden">
      {/* Gold glow top-right */}
      <div
        className="absolute rounded-full"
        style={{
          right: -40,
          top: -40,
          width: 320,
          height: 320,
          background: 'radial-gradient(circle, rgba(150,119,5,0.12), transparent 60%)',
        }}
      />
      {items.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No steps defined</p>
      )}
      <div className="relative z-10 space-y-12">
        {items.map((item, i) => (
          <div key={i} className="flex gap-6 items-start">
            <div
              className="w-12 h-12 rounded-full border flex-shrink-0 flex items-center justify-center text-lg font-bold"
              style={{ borderColor: 'rgba(150,119,5,0.40)', color: '#967705' }}
            >
              {i + 1}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{item.title || `Step ${i + 1}`}</p>
              {item.copy && (
                <p className="text-base text-white/55 mt-2 leading-relaxed max-w-xl">{item.copy}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Coaches ─────────────────────────────────────────────────────────────────

function CoachesFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ name: string; role: string; excerpt: string; image_url?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {heading && (
        <p className="text-3xl font-bold text-white mb-10">{heading}</p>
      )}
      {items.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No coaches defined</p>
      )}
      <div className="grid grid-cols-3 gap-8">
        {items.map((item, i) => (
          <div key={i}>
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt=""
                className="w-full object-cover rounded-2xl"
                style={{ aspectRatio: '3/4' }}
              />
            ) : (
              <div
                className="w-full rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center"
                style={{ aspectRatio: '3/4' }}
              >
                <span className="text-4xl font-bold text-white/20">
                  {(item.name || 'C').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <p className="text-base font-semibold text-white mt-4">{item.name || 'Coach'}</p>
            {item.role && <p className="text-sm text-white/50">{item.role}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Facilities ───────────────────────────────────────────────────────────────

function FacilityCard({ item, tall }: { item: { title: string; desc: string; image_url?: string }; tall: boolean }) {
  return (
    <div className={`rounded-2xl overflow-hidden relative ${tall ? 'h-80' : 'h-56'}`}>
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-white/[0.06] border border-white/10" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <p className="text-lg font-bold text-white">{item.title || 'Facility'}</p>
        {item.desc && <p className="text-sm text-white/60 mt-1">{item.desc}</p>}
      </div>
    </div>
  )
}

function FacilitiesFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title: string; desc: string; image_url?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {heading && (
        <p className="text-3xl font-bold text-white mb-10">{heading}</p>
      )}
      {items.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No facilities defined</p>
      )}
      {/* First 2 items — tall cards */}
      {items.slice(0, 2).length > 0 && (
        <div className="grid grid-cols-2 gap-5 mb-5">
          {items.slice(0, 2).map((item, i) => (
            <FacilityCard key={i} item={item} tall />
          ))}
        </div>
      )}
      {/* Next 4 items — shorter cards in 4-col */}
      {items.slice(2, 6).length > 0 && (
        <div className="grid grid-cols-4 gap-5">
          {items.slice(2, 6).map((item, i) => (
            <FacilityCard key={i + 2} item={item} tall={false} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Social Carousel ──────────────────────────────────────────────────────────

type CarouselItem = { image_url: string; permalink: string }

function SocialCarouselFullPreview({ content }: { content: Record<string, unknown> }) {
  const { heading, subtext, ig_url, speed } = content as { heading?: string; subtext?: string; ig_url?: string; speed?: number }
  const items = (content.items as CarouselItem[] | undefined) ?? []

  const placeholders: CarouselItem[] = Array.from({ length: 8 }, () => ({ image_url: '', permalink: '' }))
  const displayItems = items.length > 0 ? items : placeholders
  const running = displayItems.some((i) => i.image_url)

  return (
    <div className="py-24 bg-[#0a0a0a] overflow-hidden">
      <style>{`@keyframes nw-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      <div className="px-16 mb-10">
        {heading && <p className="text-3xl font-bold text-white mb-3">{heading}</p>}
        {subtext && <p className="text-lg text-white/55">{subtext}</p>}
      </div>
      <div className="relative">
        <div
          className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #0a0a0a, transparent)' }}
        />
        <div
          className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #0a0a0a, transparent)' }}
        />
        <div className="overflow-hidden">
          <div
            className="flex gap-4 px-6"
            style={{
              width: 'max-content',
              animation: `nw-marquee ${speed ?? 55}s linear infinite`,
              animationPlayState: running ? 'running' : 'paused',
            }}
          >
            {[...displayItems, ...displayItems].map((item, idx) => (
              <div
                key={idx}
                className="shrink-0 rounded-2xl border border-white/10 overflow-hidden relative bg-white/[0.03]"
                style={{ width: 300, height: 400 }}
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/[0.06]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {ig_url && (
        <div className="px-16 mt-8">
          <a
            href={ig_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#967705] text-white text-sm font-semibold"
          >
            Follow on Instagram
          </a>
        </div>
      )}
    </div>
  )
}

// ─── Default fallback ─────────────────────────────────────────────────────────

function DefaultFullPreview({ content }: { content: Record<string, unknown> }) {
  const keys = Object.keys(content)
  const heading = content.heading as string | undefined
  const subtext = (content.subtext ?? content.desc) as string | undefined
  const arrays = keys.filter((k) => Array.isArray(content[k]))

  return (
    <div className="py-16 px-16 bg-[#0a0a0a] space-y-4">
      {heading && (
        <p className="text-3xl font-bold text-white">{heading}</p>
      )}
      {subtext && (
        <p className="text-lg text-white/60 leading-relaxed max-w-2xl">{subtext}</p>
      )}
      {arrays.map((k) => (
        <div
          key={k}
          className="flex items-center justify-between text-sm py-2 border-b border-white/[0.06]"
        >
          <span className="text-white/30 capitalize">{k}</span>
          <span className="text-[#967705]/70">{(content[k] as unknown[]).length} items</span>
        </div>
      ))}
      {keys.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">Empty section</p>
      )}
    </div>
  )
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const FULL_PREVIEW_MAP: Record<
  string,
  (props: { content: Record<string, unknown> }) => React.ReactNode
> = {
  hero: ({ content }) => <HeroFullPreview content={content} />,
  memberships: ({ content }) => <MembershipsFullPreview content={content} />,
  faq: ({ content }) => <FaqFullPreview content={content} />,
  icon_row: ({ content }) => <IconRowFullPreview content={content} />,
  coaches: ({ content }) => <CoachesFullPreview content={content} />,
  facilities: ({ content }) => <FacilitiesFullPreview content={content} />,
  scroll_story: ({ content }) => <ScrollStoryFullPreview content={content} />,
  social_carousel: ({ content }) => <SocialCarouselFullPreview content={content} />,
}

export function SectionFullPreview({
  sectionKey,
  content,
}: {
  sectionKey: string
  content: Record<string, unknown>
}) {
  const PreviewComponent = FULL_PREVIEW_MAP[sectionKey]

  if (PreviewComponent) {
    return <>{PreviewComponent({ content })}</>
  }

  return <DefaultFullPreview content={content} />
}
