'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SectionEditCallbacks, CardFieldDef } from './editTypes'

// ─── Hover/active CSS helpers ──────────────────────────────────────────────────

function txtCls(cbs: SectionEditCallbacks | undefined, fieldPath: string) {
  if (!cbs) return ''
  const active =
    cbs.activeTarget?.type === 'text' && cbs.activeTarget.fieldPath === fieldPath
  return `cursor-pointer rounded-sm outline outline-1 transition-[outline-color] ${
    active ? 'outline-[#c4a015]' : 'outline-transparent hover:outline-[#967705]/50'
  }`
}

function imgCls(cbs: SectionEditCallbacks | undefined, fieldPath: string) {
  if (!cbs) return ''
  const active =
    cbs.activeTarget?.type === 'image' && cbs.activeTarget.fieldPath === fieldPath
  return `cursor-pointer transition-opacity ${active ? 'opacity-70 ring-2 ring-[#c4a015] ring-inset' : 'hover:opacity-90'}`
}

function cardCls(cbs: SectionEditCallbacks | undefined, arrayField: string, index: number) {
  if (!cbs) return ''
  const active =
    cbs.activeTarget?.type === 'card' &&
    cbs.activeTarget.arrayField === arrayField &&
    cbs.activeTarget.index === index
  return `cursor-pointer outline outline-1 transition-[outline-color] rounded-inherit ${
    active ? 'outline-[#c4a015]' : 'outline-transparent hover:outline-[#967705]/50'
  }`
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const { kicker, heading, subtext, image_url } = content as {
    kicker?: string
    heading?: string
    subtext?: string
    image_url?: string
  }

  return (
    <div className="relative flex flex-col justify-end overflow-hidden bg-[#0a0a0a]" style={{ minHeight: '85vh' }}>
      {image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image_url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover opacity-50 ${imgCls(editCbs, 'image_url')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onImageClick(e, 'image_url', image_url ?? '') } : undefined}
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br from-[#111] via-[#0d0d0d] to-[#1a1a1a] ${editCbs ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onImageClick(e, 'image_url', '') } : undefined}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/85" />
      <div className="absolute rounded-full" style={{ left: -60, top: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(45,124,255,0.18), transparent 60%)' }} />
      <div className="absolute rounded-full" style={{ right: -60, bottom: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(150,119,5,0.18), transparent 60%)' }} />
      <div className="relative z-10 pb-20 pl-16">
        {kicker !== undefined && (
          <p
            className={`text-xs uppercase tracking-[0.35em] text-white/50 mb-3 ${txtCls(editCbs, 'kicker')}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'kicker', 'Kicker', kicker ?? '') } : undefined}
          >
            {kicker || (editCbs ? <span className="italic opacity-40">Add kicker…</span> : null)}
          </p>
        )}
        {heading !== undefined && (
          <p
            className={`font-bold tracking-tight text-white leading-[1.0] ${txtCls(editCbs, 'heading')}`}
            style={{ fontSize: '5rem' }}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Heading', heading ?? '') } : undefined}
          >
            {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
          </p>
        )}
        {subtext !== undefined && (
          <p
            className={`text-lg text-white/60 max-w-lg mt-5 leading-relaxed ${txtCls(editCbs, 'subtext')}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'subtext', 'Subtext', subtext ?? '', true) } : undefined}
          >
            {subtext || (editCbs ? <span className="italic opacity-40">Add subtext…</span> : null)}
          </p>
        )}
        {!kicker && !heading && !subtext && !editCbs && (
          <p className="text-white/20 text-lg italic">No content yet</p>
        )}
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const items = (content.items as Array<{ q: string; a: string }>) ?? []
  const heading = content.heading as string | undefined
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="py-24 px-16 bg-[#0a0a0a]">
      {heading !== undefined && (
        <p
          className={`text-3xl font-bold text-white mb-10 ${txtCls(editCbs, 'heading')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Section Heading', heading ?? '') } : undefined}
        >
          {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
        </p>
      )}
      {items.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No questions yet</p>
      )}
      <div>
        {items.map((item, i) => (
          <div
            key={i}
            className="border-b border-white/10 py-5 flex justify-between select-none"
          >
            <div className="flex-1 pr-8">
              <p
                className={`text-base font-medium text-white ${txtCls(editCbs, `items.${i}.q`)}`}
                onClick={editCbs
                  ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, `items.${i}.q`, 'Question', item.q) }
                  : (e) => { setOpenIndex(openIndex === i ? null : i); e.stopPropagation() }
                }
              >
                {item.q || 'Question…'}
              </p>
              {openIndex === i && item.a && !editCbs && (
                <p className="text-sm text-white/55 leading-relaxed pt-3 pb-2">{item.a}</p>
              )}
              {editCbs && item.a !== undefined && (
                <p
                  className={`text-sm text-white/55 leading-relaxed pt-2 ${txtCls(editCbs, `items.${i}.a`)}`}
                  onClick={(e) => { e.stopPropagation(); editCbs.onTextClick(e, `items.${i}.a`, 'Answer', item.a, true) }}
                >
                  {item.a || <span className="italic opacity-40">Add answer…</span>}
                </p>
              )}
            </div>
            {!editCbs && (
              <ChevronDown
                size={18}
                className="text-white/40 flex-shrink-0 mt-0.5 transition-transform duration-200 cursor-pointer"
                style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Memberships ─────────────────────────────────────────────────────────────

const MEMBERSHIP_FIELDS: CardFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'price', label: 'Price' },
  { key: 'period', label: 'Period' },
  { key: 'desc', label: 'Description', multiline: true },
  { key: 'highlight', label: 'Featured card', type: 'boolean' },
]

function MembershipsFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const cards = (content.cards as Array<{
    title: string; price: string; period: string; desc: string; highlight?: boolean
  }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-24 px-16 bg-[#0a0a0a]">
      {heading !== undefined && (
        <p
          className={`text-3xl font-bold text-white mb-10 ${txtCls(editCbs, 'heading')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Section Heading', heading ?? '') } : undefined}
        >
          {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
        </p>
      )}
      {cards.length === 0 && (
        <p className="text-white/20 text-sm italic py-8 text-center">No plans defined</p>
      )}
      <div className="grid grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-8 relative overflow-hidden ${
              card.highlight ? 'border-white/25 bg-white/[0.04]' : 'border-white/15'
            } ${cardCls(editCbs, 'cards', i)}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'cards', i, card as Record<string, unknown>, MEMBERSHIP_FIELDS) } : undefined}
          >
            {card.highlight && (
              <span className="inline-flex rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-widest uppercase text-white/70 mb-4">
                Best Value
              </span>
            )}
            <p className="text-sm font-semibold text-white mb-1">{card.title || 'Plan'}</p>
            {card.desc && <p className="text-sm text-white/50 mb-6 leading-relaxed">{card.desc}</p>}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{card.price}</span>
              {card.period && <span className="text-sm text-white/40">{card.period}</span>}
            </div>
            {card.highlight && (
              <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.22), transparent 60%)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Icon Row ─────────────────────────────────────────────────────────────────

const ICON_ROW_FIELDS: CardFieldDef[] = [
  { key: 'num', label: 'Number / Stat' },
  { key: 'title', label: 'Title' },
  { key: 'desc', label: 'Description', multiline: true },
]

function IconRowFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const items = (content.items as Array<{ num: string; title: string; desc: string }>) ?? []

  return (
    <div className="bg-[#0a0a0a]">
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No stats defined</p>}
      <div className="grid grid-cols-4 gap-px bg-white/[0.06]">
        {items.slice(0, 4).map((item, i) => (
          <div
            key={i}
            className={`bg-[#0a0a0a] p-12 flex flex-col gap-2 ${cardCls(editCbs, 'items', i)}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', i, item as Record<string, unknown>, ICON_ROW_FIELDS) } : undefined}
          >
            <p className="text-6xl font-black leading-none" style={{ color: i === 0 ? '#2D7CFF' : '#967705' }}>
              {item.num || '—'}
            </p>
            <p className="text-sm font-bold text-white mt-2">{item.title}</p>
            {item.desc && <p className="text-sm text-white/50">{item.desc}</p>}
          </div>
        ))}
      </div>
      {items.length > 4 && <p className="text-xs text-white/30 text-center py-3">+{items.length - 4} more</p>}
    </div>
  )
}

// ─── Scroll Story ─────────────────────────────────────────────────────────────

const SCROLL_STORY_FIELDS: CardFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'copy', label: 'Text', multiline: true },
]

function ScrollStoryFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const items = (content.items as Array<{ title: string; copy: string }>) ?? []

  return (
    <div className="relative py-24 px-16 bg-[#0a0a0a] overflow-hidden">
      <div className="absolute rounded-full" style={{ right: -40, top: -40, width: 320, height: 320, background: 'radial-gradient(circle, rgba(150,119,5,0.12), transparent 60%)' }} />
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No steps defined</p>}
      <div className="relative z-10 space-y-12">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex gap-6 items-start ${cardCls(editCbs, 'items', i)}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', i, item as Record<string, unknown>, SCROLL_STORY_FIELDS) } : undefined}
          >
            <div className="w-12 h-12 rounded-full border flex-shrink-0 flex items-center justify-center text-lg font-bold" style={{ borderColor: 'rgba(150,119,5,0.40)', color: '#967705' }}>
              {i + 1}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{item.title || `Step ${i + 1}`}</p>
              {item.copy && <p className="text-base text-white/55 mt-2 leading-relaxed max-w-xl">{item.copy}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Coaches ─────────────────────────────────────────────────────────────────

const COACH_FIELDS: CardFieldDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'excerpt', label: 'Excerpt', multiline: true },
  { key: 'image_url', label: 'Image', type: 'image' },
]

function CoachesFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const items = (content.items as Array<{ name: string; role: string; excerpt: string; image_url?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {heading !== undefined && (
        <p
          className={`text-3xl font-bold text-white mb-10 ${txtCls(editCbs, 'heading')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Section Heading', heading ?? '') } : undefined}
        >
          {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
        </p>
      )}
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No coaches defined</p>}
      <div className="grid grid-cols-3 gap-8">
        {items.map((item, i) => (
          <div
            key={i}
            className={cardCls(editCbs, 'items', i)}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', i, item as Record<string, unknown>, COACH_FIELDS) } : undefined}
          >
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt="" className="w-full object-cover rounded-2xl" style={{ aspectRatio: '3/4' }} />
            ) : (
              <div className="w-full rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                <span className="text-4xl font-bold text-white/20">{(item.name || 'C').charAt(0).toUpperCase()}</span>
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

const FACILITY_FIELDS: CardFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'desc', label: 'Description', multiline: true },
  { key: 'image_url', label: 'Image', type: 'image' },
]

function FacilityCard({
  item,
  tall,
  editCbs,
  index,
}: {
  item: { title: string; desc: string; image_url?: string }
  tall: boolean
  editCbs?: SectionEditCallbacks
  index: number
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden relative ${tall ? 'h-80' : 'h-56'} ${cardCls(editCbs, 'items', index)}`}
      onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', index, item as Record<string, unknown>, FACILITY_FIELDS) } : undefined}
    >
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

function FacilitiesFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const items = (content.items as Array<{ title: string; desc: string; image_url?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {heading !== undefined && (
        <p
          className={`text-3xl font-bold text-white mb-10 ${txtCls(editCbs, 'heading')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Section Heading', heading ?? '') } : undefined}
        >
          {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
        </p>
      )}
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No facilities defined</p>}
      {items.slice(0, 2).length > 0 && (
        <div className="grid grid-cols-2 gap-5 mb-5">
          {items.slice(0, 2).map((item, i) => (
            <FacilityCard key={i} item={item} tall index={i} editCbs={editCbs} />
          ))}
        </div>
      )}
      {items.slice(2, 6).length > 0 && (
        <div className="grid grid-cols-4 gap-5">
          {items.slice(2, 6).map((item, i) => (
            <FacilityCard key={i + 2} item={item} tall={false} index={i + 2} editCbs={editCbs} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Social Carousel ──────────────────────────────────────────────────────────

const CAROUSEL_ITEM_FIELDS: CardFieldDef[] = [
  { key: 'image_url', label: 'Image', type: 'image' },
  { key: 'permalink', label: 'Post URL', type: 'url' },
]

type CarouselItem = { image_url: string; permalink: string }

function SocialCarouselFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const { heading, subtext, ig_url, speed } = content as { heading?: string; subtext?: string; ig_url?: string; speed?: number }
  const items = (content.items as CarouselItem[] | undefined) ?? []
  const placeholders: CarouselItem[] = Array.from({ length: 8 }, () => ({ image_url: '', permalink: '' }))
  const displayItems = items.length > 0 ? items : placeholders
  const running = displayItems.some((i) => i.image_url)

  return (
    <div className="py-24 bg-[#0a0a0a] overflow-hidden">
      <style>{`@keyframes nw-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      <div className="px-16 mb-10">
        {heading !== undefined && (
          <p
            className={`text-3xl font-bold text-white mb-3 ${txtCls(editCbs, 'heading')}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Heading', heading ?? '') } : undefined}
          >
            {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
          </p>
        )}
        {subtext !== undefined && (
          <p
            className={`text-lg text-white/55 ${txtCls(editCbs, 'subtext')}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'subtext', 'Subtext', subtext ?? '', true) } : undefined}
          >
            {subtext || (editCbs ? <span className="italic opacity-40">Add subtext…</span> : null)}
          </p>
        )}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0a0a0a, transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #0a0a0a, transparent)' }} />
        <div className="overflow-hidden">
          <div
            className="flex gap-4 px-6"
            style={{ width: 'max-content', animation: `nw-marquee ${speed ?? 55}s linear infinite`, animationPlayState: running ? 'running' : 'paused' }}
          >
            {[...displayItems, ...displayItems].map((item, idx) => (
              <div
                key={idx}
                className={`shrink-0 rounded-2xl border border-white/10 overflow-hidden relative bg-white/[0.03] ${
                  editCbs && idx < items.length ? cardCls(editCbs, 'items', idx) : ''
                }`}
                style={{ width: 300, height: 400 }}
                onClick={editCbs && idx < items.length
                  ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', idx, item as Record<string, unknown>, CAROUSEL_ITEM_FIELDS) }
                  : undefined
                }
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
      {ig_url !== undefined && (
        <div className="px-16 mt-8">
          <span
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#967705] text-white text-sm font-semibold ${editCbs ? 'cursor-pointer hover:bg-[#b08e06]' : ''} ${txtCls(editCbs, 'ig_url')}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'ig_url', 'Instagram URL', ig_url ?? '', false) } : undefined}
          >
            Follow on Instagram
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Sessions / Specialist ────────────────────────────────────────────────────

const SESSION_FIELDS: CardFieldDef[] = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type badge' },
  { key: 'desc', label: 'Description', multiline: true },
  { key: 'image_url', label: 'Image', type: 'image' },
  { key: 'link', label: 'Link URL', type: 'url' },
]

function SessionsFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const items = (content.items as Array<{ title?: string; type?: string; desc?: string; image_url?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {heading !== undefined && (
        <p
          className={`text-3xl font-bold text-white mb-10 ${txtCls(editCbs, 'heading')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Section Heading', heading ?? '') } : undefined}
        >
          {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
        </p>
      )}
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No sessions defined</p>}
      <div className="grid grid-cols-3 gap-6">
        {items.map((item, i) => (
          <div
            key={i}
            className={cardCls(editCbs, 'items', i)}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', i, item as Record<string, unknown>, SESSION_FIELDS) } : undefined}
          >
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt="" className="w-full object-cover rounded-2xl" style={{ aspectRatio: '3/4' }} />
            ) : (
              <div className="w-full rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center" style={{ aspectRatio: '3/4' }}>
                <span className="text-4xl font-bold text-white/20">{(item.title || 'S').charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="mt-4">
              {item.type && (
                <span className="inline-block text-[10px] uppercase tracking-widest text-[#967705] border border-[#967705]/40 rounded-full px-2 py-0.5 mb-2">
                  {item.type}
                </span>
              )}
              <p className="text-base font-semibold text-white">{item.title || 'Session'}</p>
              {item.desc && <p className="text-sm text-white/50 mt-1 leading-relaxed">{item.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── String List ──────────────────────────────────────────────────────────────

function StringListFullPreview({ content, itemsKey = 'items' }: { content: Record<string, unknown>; itemsKey?: string }) {
  const items = (content[itemsKey] as string[]) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {heading && <p className="text-3xl font-bold text-white mb-10">{heading}</p>}
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No items defined</p>}
      <div className="flex flex-wrap gap-3">
        {items.map((item, i) => (
          <span key={i} className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] text-sm text-white/70">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Discounts ────────────────────────────────────────────────────────────────

const DISCOUNT_FIELDS: CardFieldDef[] = [
  { key: 'label', label: 'Discount Name' },
  { key: 'desc', label: 'Description', multiline: true },
]

function DiscountsFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const items = (content.items as Array<{ label?: string; desc?: string }>) ?? []
  const heading = content.heading as string | undefined

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {heading !== undefined && (
        <p
          className={`text-3xl font-bold text-white mb-10 ${txtCls(editCbs, 'heading')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'heading', 'Section Heading', heading ?? '') } : undefined}
        >
          {heading || (editCbs ? <span className="italic opacity-40">Add heading…</span> : null)}
        </p>
      )}
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No discounts defined</p>}
      <div className="space-y-5">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex gap-4 items-start ${cardCls(editCbs, 'items', i)}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', i, item as Record<string, unknown>, DISCOUNT_FIELDS) } : undefined}
          >
            <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#967705' }} />
            <div>
              <p className="text-base font-semibold text-white">{item.label || 'Discount'}</p>
              {item.desc && <p className="text-sm text-white/50 mt-1">{item.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Single Text ──────────────────────────────────────────────────────────────

function SingleTextFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const text = (content.text as string) ?? ''
  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {text || editCbs ? (
        <p
          className={`text-lg text-white/70 leading-relaxed max-w-3xl ${txtCls(editCbs, 'text')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'text', 'Content', text, true) } : undefined}
        >
          {text || (editCbs ? <span className="italic opacity-40">Add content…</span> : null)}
        </p>
      ) : (
        <p className="text-white/20 text-sm italic py-8 text-center">No content yet</p>
      )}
    </div>
  )
}

// ─── Embed URL ────────────────────────────────────────────────────────────────

function EmbedUrlFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const url = (content.url as string) ?? ''
  return (
    <div className="py-16 px-16 bg-[#0a0a0a] space-y-6">
      {url || editCbs ? (
        <p
          className={`text-xs font-mono text-[#967705]/80 break-all ${txtCls(editCbs, 'url')}`}
          onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'url', 'Embed URL', url, false) } : undefined}
        >
          {url || (editCbs ? <span className="italic opacity-40">Add URL…</span> : null)}
        </p>
      ) : (
        <p className="text-white/20 text-sm italic">No URL set</p>
      )}
      <div className="w-full rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center" style={{ height: 400 }}>
        <p className="text-white/25 text-sm">Embed preview not available in editor</p>
      </div>
    </div>
  )
}

// ─── Options ──────────────────────────────────────────────────────────────────

const OPTION_FIELDS: CardFieldDef[] = [
  { key: 'kicker', label: 'Kicker' },
  { key: 'title', label: 'Title' },
  { key: 'desc', label: 'Description', multiline: true },
  { key: 'image_url', label: 'Image', type: 'image' },
]

function OptionsFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  type ButtonItem = { label?: string; variant?: string }
  type OptionItem = { kicker?: string; title?: string; desc?: string; image_url?: string; buttons?: ButtonItem[] }
  const items = (content.items as OptionItem[]) ?? []

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      {items.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">No options defined</p>}
      <div className="grid grid-cols-2 gap-6">
        {items.map((item, i) => (
          <div
            key={i}
            className={`rounded-2xl border border-white/10 bg-white/[0.03] p-8 ${cardCls(editCbs, 'items', i)}`}
            onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onCardClick(e, 'items', i, item as Record<string, unknown>, OPTION_FIELDS) } : undefined}
          >
            {item.kicker && <p className="text-xs uppercase tracking-[0.3em] text-[#967705] mb-3">{item.kicker}</p>}
            <p className="text-2xl font-bold text-white mb-3">{item.title || 'Option'}</p>
            {item.desc && <p className="text-sm text-white/55 leading-relaxed mb-6">{item.desc}</p>}
            {item.buttons && item.buttons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {item.buttons.map((btn, bi) => (
                  <span key={bi} className={`px-4 py-2 rounded-xl text-sm font-medium ${btn.variant === 'primary' ? 'bg-[#967705] text-white' : 'border border-white/20 text-white/70'}`}>
                    {btn.label || 'Button'}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Contact Block ────────────────────────────────────────────────────────────

function ContactBlockFullPreview({
  content,
  editCbs,
}: {
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const s = content as { address?: string[]; whatsapp?: string; email?: string }
  const addressStr = (s.address ?? []).join('\n')

  return (
    <div className="py-16 px-16 bg-[#0a0a0a]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 max-w-md space-y-4">
        {s.address !== undefined && (
          <div>
            <p className="text-xs uppercase tracking-widest text-[#967705] mb-1">Address</p>
            <p
              className={`text-sm text-white/70 whitespace-pre-line ${txtCls(editCbs, 'address')}`}
              onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'address', 'Address', addressStr, true) } : undefined}
            >
              {addressStr || (editCbs ? <span className="italic opacity-40">Add address…</span> : null)}
            </p>
          </div>
        )}
        {s.whatsapp !== undefined && (
          <div>
            <p className="text-xs uppercase tracking-widest text-[#967705] mb-1">WhatsApp</p>
            <p
              className={`text-sm text-white/70 ${txtCls(editCbs, 'whatsapp')}`}
              onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'whatsapp', 'WhatsApp', s.whatsapp ?? '') } : undefined}
            >
              {s.whatsapp || (editCbs ? <span className="italic opacity-40">Add number…</span> : null)}
            </p>
          </div>
        )}
        {s.email !== undefined && (
          <div>
            <p className="text-xs uppercase tracking-widest text-[#967705] mb-1">Email</p>
            <p
              className={`text-sm text-white/70 ${txtCls(editCbs, 'email')}`}
              onClick={editCbs ? (e) => { e.stopPropagation(); editCbs.onTextClick(e, 'email', 'Email', s.email ?? '') } : undefined}
            >
              {s.email || (editCbs ? <span className="italic opacity-40">Add email…</span> : null)}
            </p>
          </div>
        )}
        {!s.address?.length && !s.whatsapp && !s.email && !editCbs && (
          <p className="text-white/20 text-sm italic">No contact info yet</p>
        )}
      </div>
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
      {heading && <p className="text-3xl font-bold text-white">{heading}</p>}
      {subtext && <p className="text-lg text-white/60 leading-relaxed max-w-2xl">{subtext}</p>}
      {arrays.map((k) => (
        <div key={k} className="flex items-center justify-between text-sm py-2 border-b border-white/[0.06]">
          <span className="text-white/30 capitalize">{k}</span>
          <span className="text-[#967705]/70">{(content[k] as unknown[]).length} items</span>
        </div>
      ))}
      {keys.length === 0 && <p className="text-white/20 text-sm italic py-8 text-center">Empty section</p>}
    </div>
  )
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const FULL_PREVIEW_MAP: Record<
  string,
  (props: { content: Record<string, unknown>; editCbs?: SectionEditCallbacks }) => React.ReactNode
> = {
  hero:             ({ content, editCbs }) => <HeroFullPreview content={content} editCbs={editCbs} />,
  memberships:      ({ content, editCbs }) => <MembershipsFullPreview content={content} editCbs={editCbs} />,
  faq:              ({ content, editCbs }) => <FaqFullPreview content={content} editCbs={editCbs} />,
  icon_row:         ({ content, editCbs }) => <IconRowFullPreview content={content} editCbs={editCbs} />,
  coaches:          ({ content, editCbs }) => <CoachesFullPreview content={content} editCbs={editCbs} />,
  facilities:       ({ content, editCbs }) => <FacilitiesFullPreview content={content} editCbs={editCbs} />,
  scroll_story:     ({ content, editCbs }) => <ScrollStoryFullPreview content={content} editCbs={editCbs} />,
  social_carousel:  ({ content, editCbs }) => <SocialCarouselFullPreview content={content} editCbs={editCbs} />,
  plans:            ({ content, editCbs }) => <MembershipsFullPreview content={content} editCbs={editCbs} />,
  sessions:         ({ content, editCbs }) => <SessionsFullPreview content={content} editCbs={editCbs} />,
  specialist:       ({ content, editCbs }) => <SessionsFullPreview content={content} editCbs={editCbs} />,
  training_blocks:  ({ content, editCbs }) => <FacilitiesFullPreview content={content} editCbs={editCbs} />,
  hwpo:             ({ content, editCbs }) => <SingleTextFullPreview content={content} editCbs={editCbs} />,
  stations:         ({ content }) => <StringListFullPreview content={content} />,
  how_it_works:     ({ content }) => <StringListFullPreview content={content} />,
  perks:            ({ content }) => <StringListFullPreview content={content} />,
  discounts:        ({ content, editCbs }) => <DiscountsFullPreview content={content} editCbs={editCbs} />,
  terms:            ({ content, editCbs }) => <SingleTextFullPreview content={content} editCbs={editCbs} />,
  embed_url:        ({ content, editCbs }) => <EmbedUrlFullPreview content={content} editCbs={editCbs} />,
  options:          ({ content, editCbs }) => <OptionsFullPreview content={content} editCbs={editCbs} />,
  contact_block:    ({ content, editCbs }) => <ContactBlockFullPreview content={content} editCbs={editCbs} />,
  form:             ({ content }) => <StringListFullPreview content={content} itemsKey="enquiry_types" />,
}

export function SectionFullPreview({
  sectionKey,
  content,
  editCbs,
}: {
  sectionKey: string
  content: Record<string, unknown>
  editCbs?: SectionEditCallbacks
}) {
  const PreviewComponent = FULL_PREVIEW_MAP[sectionKey]
  if (PreviewComponent) return <>{PreviewComponent({ content, editCbs })}</>
  return <DefaultFullPreview content={content} />
}
