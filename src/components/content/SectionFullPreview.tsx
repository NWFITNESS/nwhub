'use client'

import { ChevronRight, ChevronDown } from 'lucide-react'

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function PreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none select-none">
      <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a]">
        {children}
      </div>
      <p className="text-[10px] text-white/20 text-center mt-2 italic">Preview · not to scale</p>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroFullPreview({ content }: { content: Record<string, unknown> }) {
  const { kicker, heading, subtext, image_url } = content as {
    kicker?: string
    heading?: string
    subtext?: string
    image_url?: string
  }

  return (
    <PreviewShell>
      <div className="relative min-h-[220px] flex flex-col justify-end overflow-hidden">
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
        {/* Atmospheric glows */}
        <div
          className="absolute -left-8 -top-8 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(45,124,255,0.14), transparent 60%)' }}
        />
        <div
          className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.14), transparent 60%)' }}
        />
        {/* Text */}
        <div className="relative z-10 p-5">
          {kicker && (
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 mb-2">{kicker}</p>
          )}
          {heading && (
            <p className="text-white font-semibold tracking-tight text-xl leading-snug">
              {heading}
            </p>
          )}
          {subtext && (
            <p className="mt-2 text-sm text-white/70 leading-relaxed line-clamp-2">{subtext}</p>
          )}
          {!kicker && !heading && !subtext && (
            <p className="text-white/20 text-sm italic">No content yet</p>
          )}
        </div>
      </div>
    </PreviewShell>
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
    <PreviewShell>
      <div className="p-4 space-y-3">
        {heading && (
          <p className="text-white font-semibold text-base tracking-tight">{heading}</p>
        )}
        {cards.length === 0 && (
          <p className="text-white/20 text-xs italic py-4 text-center">No plans defined</p>
        )}
        {cards.map((card, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-4 relative overflow-hidden ${
              card.highlight
                ? 'border-white/20 bg-white/[0.06]'
                : 'border-white/10 bg-white/[0.035]'
            }`}
          >
            {card.highlight && (
              <span className="inline-flex rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] tracking-widest uppercase text-white/70 mb-2">
                Best Value
              </span>
            )}
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{card.title || 'Plan'}</p>
                {card.desc && (
                  <p className="text-xs text-white/60 mt-1 line-clamp-1">{card.desc}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-lg font-semibold text-white">{card.price}</span>
                {card.period && (
                  <span className="text-xs text-white/50 ml-1">{card.period}</span>
                )}
              </div>
            </div>
            {card.highlight && (
              <div
                className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.18), transparent 60%)' }}
              />
            )}
          </div>
        ))}
      </div>
    </PreviewShell>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ q: string; a: string }>) ?? []
  const heading = content.heading as string | undefined
  const shown = items.slice(0, 5)
  const extra = items.length - shown.length

  return (
    <PreviewShell>
      <div className="p-4">
        {heading && (
          <p className="text-white font-semibold text-base tracking-tight mb-4">{heading}</p>
        )}
        {items.length === 0 && (
          <p className="text-white/20 text-xs italic py-4 text-center">No questions yet</p>
        )}
        <div className="border-t border-white/10">
          {shown.map((item, i) => (
            <div key={i} className="border-b border-white/10 py-3 flex items-center justify-between gap-4">
              <p className="text-xs text-white/80 line-clamp-1">{item.q || 'Question…'}</p>
              <ChevronDown size={12} className="text-white/30 flex-shrink-0" />
            </div>
          ))}
        </div>
        {extra > 0 && (
          <p className="text-[10px] text-white/30 mt-2 pl-1">+{extra} more</p>
        )}
      </div>
    </PreviewShell>
  )
}

// ─── Icon Row ─────────────────────────────────────────────────────────────────

function IconRowFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ num: string; title: string; desc: string }>) ?? []

  return (
    <PreviewShell>
      <div className="p-4">
        {items.length === 0 && (
          <p className="text-white/20 text-xs italic py-4 text-center">No stats defined</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {items.slice(0, 4).map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 bg-white/[0.035] p-3 relative overflow-hidden"
              style={{
                background: i === 0
                  ? 'linear-gradient(145deg, rgba(45,124,255,0.10) 0%, rgba(0,0,0,0.75) 100%)'
                  : 'linear-gradient(145deg, rgba(150,119,5,0.08) 0%, rgba(0,0,0,0.75) 100%)',
              }}
            >
              <p
                className="text-2xl font-black leading-none mb-1"
                style={{ color: i === 0 ? '#2D7CFF' : '#967705' }}
              >
                {item.num || '—'}
              </p>
              <p className="text-xs font-bold text-white leading-tight">{item.title}</p>
              {item.desc && (
                <p className="text-[10px] text-white/50 mt-1 line-clamp-2">{item.desc}</p>
              )}
            </div>
          ))}
        </div>
        {items.length > 4 && (
          <p className="text-[10px] text-white/30 mt-2 text-center">+{items.length - 4} more</p>
        )}
      </div>
    </PreviewShell>
  )
}

// ─── Coaches ─────────────────────────────────────────────────────────────────

function CoachesFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ name: string; role: string; excerpt: string; image_url?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <PreviewShell>
      <div className="p-4">
        {heading && (
          <p className="text-white font-semibold text-base tracking-tight mb-3">{heading}</p>
        )}
        {items.length === 0 && (
          <p className="text-white/20 text-xs italic py-4 text-center">No coaches defined</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {items.slice(0, 6).map((item, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 flex items-center gap-2">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                  <span className="text-[10px] text-white/40 font-semibold">
                    {(item.name || 'C').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{item.name || 'Coach'}</p>
                {item.role && <p className="text-[10px] text-white/40 truncate">{item.role}</p>}
              </div>
            </div>
          ))}
        </div>
        {items.length > 6 && (
          <p className="text-[10px] text-white/30 mt-2 text-center">+{items.length - 6} more</p>
        )}
      </div>
    </PreviewShell>
  )
}

// ─── Facilities ───────────────────────────────────────────────────────────────

function FacilitiesFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title: string; desc: string; image_url?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <PreviewShell>
      <div className="p-4 space-y-2">
        {heading && (
          <p className="text-white font-semibold text-base tracking-tight mb-3">{heading}</p>
        )}
        {items.length === 0 && (
          <p className="text-white/20 text-xs italic py-4 text-center">No facilities defined</p>
        )}
        {items.slice(0, 5).map((item, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 flex gap-3 items-start">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/[0.06] flex-shrink-0 border border-white/10" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">{item.title || 'Facility'}</p>
              {item.desc && (
                <p className="text-[10px] text-white/50 mt-0.5 line-clamp-2">{item.desc}</p>
              )}
            </div>
          </div>
        ))}
        {items.length > 5 && (
          <p className="text-[10px] text-white/30 text-center">+{items.length - 5} more</p>
        )}
      </div>
    </PreviewShell>
  )
}

// ─── Scroll Story ─────────────────────────────────────────────────────────────

function ScrollStoryFullPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title: string; copy: string }>) ?? []

  return (
    <PreviewShell>
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, #111, #0a0a0a)' }}
        />
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.10), transparent 60%)' }}
        />
        <div className="relative z-10 p-4 space-y-2">
          {items.length === 0 && (
            <p className="text-white/20 text-xs italic py-4 text-center">No steps defined</p>
          )}
          {items.slice(0, 5).map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className="w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ borderColor: 'rgba(150,119,5,0.5)', color: '#967705' }}
              >
                {i + 1}
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-tight">
                  {item.title || `Step ${i + 1}`}
                </p>
                {item.copy && (
                  <p className="text-[10px] text-white/50 mt-0.5 line-clamp-2">{item.copy}</p>
                )}
              </div>
            </div>
          ))}
          {items.length > 5 && (
            <p className="text-[10px] text-white/30 pl-9">+{items.length - 5} more</p>
          )}
        </div>
      </div>
    </PreviewShell>
  )
}

// ─── Default fallback ─────────────────────────────────────────────────────────

function DefaultFullPreview({ content }: { content: Record<string, unknown> }) {
  const keys = Object.keys(content)
  const heading = content.heading as string | undefined
  const subtext = (content.subtext ?? content.desc) as string | undefined
  const arrays = keys.filter((k) => Array.isArray(content[k]))

  return (
    <PreviewShell>
      <div className="p-4 space-y-2">
        {heading && (
          <p className="text-white font-semibold text-base tracking-tight">{heading}</p>
        )}
        {subtext && (
          <p className="text-sm text-white/60 leading-relaxed line-clamp-3">{subtext}</p>
        )}
        {arrays.map((k) => (
          <div key={k} className="flex items-center justify-between text-xs py-1.5 border-b border-white/[0.06]">
            <span className="text-white/30 capitalize">{k}</span>
            <span className="text-[#967705]/70">{(content[k] as unknown[]).length} items</span>
          </div>
        ))}
        {keys.length === 0 && (
          <p className="text-white/20 text-xs italic py-4 text-center">Empty section</p>
        )}
      </div>
    </PreviewShell>
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
