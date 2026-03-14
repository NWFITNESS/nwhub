'use client'

import { Pencil, ChevronRight } from 'lucide-react'

// ─── Section-specific preview renderers ──────────────────────────────────────

function HeroPreview({ content }: { content: Record<string, unknown> }) {
  const { kicker, heading, subtext } = content as { kicker?: string; heading?: string; subtext?: string }
  return (
    <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-[#111] to-[#1a1a1a] p-5 min-h-[90px] border border-white/[0.06]">
      {kicker && <p className="text-[10px] uppercase tracking-widest text-[#967705] mb-1">{kicker}</p>}
      {heading && <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{heading}</p>}
      {subtext && <p className="text-white/40 text-xs mt-1 line-clamp-1">{subtext}</p>}
    </div>
  )
}

function MembershipsPreview({ content }: { content: Record<string, unknown> }) {
  const cards = (content.cards as Array<{ title: string; price: string; highlight?: boolean }>) ?? []
  return (
    <div className="flex gap-2 flex-wrap">
      {cards.slice(0, 4).map((card, i) => (
        <div
          key={i}
          className={`rounded-md px-3 py-2 text-xs border ${
            card.highlight
              ? 'border-[#967705]/60 bg-[#967705]/10 text-[#967705]'
              : 'border-white/10 bg-white/[0.04] text-white/60'
          }`}
        >
          <div className="font-semibold">{card.title || 'Plan'}</div>
          {card.price && <div className="text-[10px] opacity-70">{card.price}</div>}
        </div>
      ))}
      {cards.length === 0 && <p className="text-white/30 text-xs italic">No plans defined</p>}
    </div>
  )
}

function FaqPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ q: string }>) ?? []
  const shown = items.slice(0, 3)
  const extra = items.length - shown.length
  return (
    <div className="space-y-1.5">
      {shown.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-2 bg-white/[0.04] rounded px-3 py-1.5">
          <p className="text-xs text-white/70 truncate">{item.q || 'Question…'}</p>
          <ChevronRight size={12} className="text-white/20 flex-shrink-0" />
        </div>
      ))}
      {extra > 0 && <p className="text-[10px] text-white/30 pl-1">+{extra} more</p>}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No questions yet</p>}
    </div>
  )
}

function IconRowPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ num: string; title: string }>) ?? []
  return (
    <div className="flex gap-4 flex-wrap">
      {items.slice(0, 5).map((item, i) => (
        <div key={i} className="text-center">
          <p className="text-[#967705] font-bold text-lg leading-none">{item.num || '—'}</p>
          <p className="text-white/40 text-[10px] mt-0.5">{item.title}</p>
        </div>
      ))}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No stats defined</p>}
    </div>
  )
}

function CoachesPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ name: string; role: string }>) ?? []
  return (
    <div className="space-y-1">
      {items.slice(0, 4).map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-white/80">{item.name || 'Coach'}</span>
            {item.role && <span className="text-white/30 ml-1.5">— {item.role}</span>}
          </div>
        </div>
      ))}
      {items.length > 4 && <p className="text-[10px] text-white/30 pl-7">+{items.length - 4} more</p>}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No coaches defined</p>}
    </div>
  )
}

function FacilitiesPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title: string }>) ?? []
  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 6).map((item, i) => (
        <span key={i} className="text-[10px] bg-white/[0.06] border border-white/10 rounded px-2 py-1 text-white/60">
          {item.title || 'Facility'}
        </span>
      ))}
      {items.length > 6 && <span className="text-[10px] text-white/30">+{items.length - 6} more</span>}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No facilities defined</p>}
    </div>
  )
}

function ScrollStoryPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title: string }>) ?? []
  return (
    <div className="space-y-1">
      {items.slice(0, 4).map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-white/60">
          <span className="w-4 h-4 rounded-full border border-[#967705]/40 text-[#967705] text-[9px] flex items-center justify-center flex-shrink-0">
            {i + 1}
          </span>
          {item.title || 'Step…'}
        </div>
      ))}
      {items.length > 4 && <p className="text-[10px] text-white/30 pl-6">+{items.length - 4} more</p>}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No steps defined</p>}
    </div>
  )
}

function StringArrayPreview({ content, itemsKey = 'items' }: { content: Record<string, unknown>; itemsKey?: string }) {
  const items = (content[itemsKey] as string[]) ?? []
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, 5).map((s, i) => (
        <span key={i} className="text-[10px] bg-white/[0.06] border border-white/10 rounded px-2 py-1 text-white/60">
          {s || '—'}
        </span>
      ))}
      {items.length > 5 && <span className="text-[10px] text-white/30">+{items.length - 5} more</span>}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No items yet</p>}
    </div>
  )
}

function SingleTextPreview({ content }: { content: Record<string, unknown> }) {
  const text = (content.text as string) ?? ''
  return text ? (
    <p className="text-xs text-white/60 line-clamp-2">{text}</p>
  ) : (
    <p className="text-white/30 text-xs italic">No content yet</p>
  )
}

function SingleUrlPreview({ content }: { content: Record<string, unknown> }) {
  const url = (content.url as string) ?? ''
  return url ? (
    <p className="text-xs text-[#967705]/80 truncate font-mono">{url}</p>
  ) : (
    <p className="text-white/30 text-xs italic">No URL set</p>
  )
}

function OptionsPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ title?: string; kicker?: string }>) ?? []
  return (
    <div className="space-y-1">
      {items.slice(0, 3).map((item, i) => (
        <div key={i} className="text-xs text-white/60">
          {item.kicker && <span className="text-[#967705] text-[10px] mr-1">{item.kicker}</span>}
          {item.title || 'Option…'}
        </div>
      ))}
      {items.length > 3 && <p className="text-[10px] text-white/30">+{items.length - 3} more</p>}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No options yet</p>}
    </div>
  )
}

function DiscountsPreview({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as Array<{ label?: string }>) ?? []
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, 4).map((item, i) => (
        <span key={i} className="text-[10px] bg-white/[0.06] border border-white/10 rounded px-2 py-1 text-white/60">
          {item.label || '—'}
        </span>
      ))}
      {items.length === 0 && <p className="text-white/30 text-xs italic">No discounts</p>}
    </div>
  )
}

function ContactBlockPreview({ content }: { content: Record<string, unknown> }) {
  const s = content as { address?: string[]; whatsapp?: string }
  return (
    <div className="text-xs text-white/50 space-y-0.5">
      {s.address?.[0] && <p className="truncate">{s.address[0]}</p>}
      {s.whatsapp && <p className="text-[#967705]/80">{s.whatsapp}</p>}
      {!s.address?.[0] && !s.whatsapp && <p className="italic">No contact info</p>}
    </div>
  )
}

function DetailsPreview({ content }: { content: Record<string, unknown> }) {
  const s = content as { email?: string; address?: string | string[] }
  const addressStr = Array.isArray(s.address) ? s.address[0] : s.address
  return (
    <div className="text-xs text-white/50 space-y-0.5">
      {s.email && <p className="truncate">{s.email}</p>}
      {addressStr && <p className="truncate text-white/30">{addressStr}</p>}
      {!s.email && !addressStr && <p className="italic">No details</p>}
    </div>
  )
}

function FormPreview({ content }: { content: Record<string, unknown> }) {
  const types = (content.enquiry_types as string[]) ?? []
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.slice(0, 4).map((t, i) => (
        <span key={i} className="text-[10px] bg-white/[0.06] border border-white/10 rounded px-2 py-1 text-white/60">
          {t}
        </span>
      ))}
      {types.length > 4 && <span className="text-[10px] text-white/30">+{types.length - 4} more</span>}
      {types.length === 0 && <p className="text-white/30 text-xs italic">No types</p>}
    </div>
  )
}

function DefaultPreview({ content, sectionKey }: { content: Record<string, unknown>; sectionKey: string }) {
  const keys = Object.keys(content)
  const arrayKeys = keys.filter((k) => Array.isArray(content[k]))
  const scalarKeys = keys.filter((k) => !Array.isArray(content[k]) && typeof content[k] !== 'object')

  return (
    <div className="text-xs text-white/40 space-y-0.5">
      {scalarKeys.slice(0, 2).map((k) => (
        <p key={k} className="truncate">
          <span className="text-white/20">{k}:</span>{' '}
          <span className="text-white/50">{String(content[k]).slice(0, 60)}</span>
        </p>
      ))}
      {arrayKeys.map((k) => (
        <p key={k}>
          <span className="text-white/20">{k}:</span>{' '}
          <span className="text-[#967705]/70">{(content[k] as unknown[]).length} items</span>
        </p>
      ))}
      {keys.length === 0 && <p className="italic">Empty section</p>}
    </div>
  )
}

// ─── Preview dispatcher ───────────────────────────────────────────────────────

const PREVIEW_MAP: Record<
  string,
  (props: { content: Record<string, unknown>; sectionKey: string }) => React.ReactNode
> = {
  hero: ({ content }) => <HeroPreview content={content} />,
  memberships: ({ content }) => <MembershipsPreview content={content} />,
  faq: ({ content }) => <FaqPreview content={content} />,
  icon_row: ({ content }) => <IconRowPreview content={content} />,
  coaches: ({ content }) => <CoachesPreview content={content} />,
  facilities: ({ content }) => <FacilitiesPreview content={content} />,
  scroll_story: ({ content }) => <ScrollStoryPreview content={content} />,
  plans: ({ content }) => <MembershipsPreview content={content} />,
  sessions: ({ content }) => <FacilitiesPreview content={content} />,
  specialist: ({ content }) => <FacilitiesPreview content={content} />,
  training_blocks: ({ content }) => <FacilitiesPreview content={content} />,
  hwpo: ({ content }) => <SingleTextPreview content={content} />,
  stations: ({ content }) => <StringArrayPreview content={content} />,
  how_it_works: ({ content }) => <StringArrayPreview content={content} />,
  perks: ({ content }) => <StringArrayPreview content={content} />,
  discounts: ({ content }) => <DiscountsPreview content={content} />,
  terms: ({ content }) => <SingleTextPreview content={content} />,
  embed_url: ({ content }) => <SingleUrlPreview content={content} />,
  options: ({ content }) => <OptionsPreview content={content} />,
  contact_block: ({ content }) => <ContactBlockPreview content={content} />,
  form: ({ content }) => <FormPreview content={content} />,
  details: ({ content }) => <DetailsPreview content={content} />,
}

// ─── SectionBlock wrapper ─────────────────────────────────────────────────────

interface SectionBlockProps {
  sectionKey: string
  content: Record<string, unknown>
  hasDraft: boolean
  isSelected: boolean
  onClick: (key: string) => void
}

export function SectionBlock({ sectionKey, content, hasDraft, isSelected, onClick }: SectionBlockProps) {
  const PreviewComponent = PREVIEW_MAP[sectionKey]
  const label = sectionKey.replace(/_/g, ' ').toUpperCase()

  return (
    <button
      type="button"
      onClick={() => onClick(sectionKey)}
      className={`w-full text-left group rounded-xl border bg-[#111] transition-all duration-150
        ${isSelected
          ? 'border-[#967705]/60 shadow-[inset_3px_0_0_#967705]'
          : 'border-white/[0.08] hover:border-white/20'
        }`}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold tracking-widest text-[#967705]">{label}</span>
          <span
            className={`ml-auto text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
              hasDraft
                ? 'text-amber-400 border-amber-400/40 bg-amber-400/10'
                : 'text-emerald-500/70 border-emerald-500/30 bg-emerald-500/10'
            }`}
          >
            {hasDraft ? 'DRAFT' : 'LIVE'}
          </span>
          <Pencil
            size={12}
            className="text-white/20 group-hover:text-white/60 transition-colors ml-1 flex-shrink-0"
          />
        </div>

        {/* Visual preview */}
        {PreviewComponent ? (
          PreviewComponent({ content, sectionKey })
        ) : (
          <DefaultPreview content={content} sectionKey={sectionKey} />
        )}
      </div>
    </button>
  )
}
