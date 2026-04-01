'use client'

import type { TextStyles } from '../templates'

const FONTS = ['Rajdhani', 'Inter', 'League Spartan', 'Arial', 'Georgia'] as const

const TEXT_COLOURS = [
  { label: 'Gold',      value: '#c9a70a' },
  { label: 'White',     value: '#ffffff' },
  { label: 'Off-white', value: 'rgba(255,255,255,0.75)' },
  { label: 'Dark',      value: '#0a0a0a' },
  { label: 'Black',     value: '#000000' },
]

interface Props {
  headline: string
  subheadline: string
  onHeadlineChange: (v: string) => void
  onSubheadlineChange: (v: string) => void
  textStyles: TextStyles
  onTextStylesChange: (s: TextStyles) => void
}

export function TextEditor({ headline, subheadline, onHeadlineChange, onSubheadlineChange, textStyles, onTextStylesChange }: Props) {
  const update = (partial: Partial<TextStyles>) => onTextStylesChange({ ...textStyles, ...partial })

  return (
    <div className="space-y-3">
      {/* Headline */}
      <div>
        <label className="text-[11px] text-white/40 block mb-1.5">Headline</label>
        <input
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value)}
          placeholder="e.g. Results That Speak Volumes"
          className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50"
        />
      </div>

      {/* Subheadline */}
      <div>
        <label className="text-[11px] text-white/40 block mb-1.5">
          Subheadline <span className="text-white/20">(optional)</span>
        </label>
        <input
          value={subheadline}
          onChange={(e) => onSubheadlineChange(e.target.value)}
          placeholder="Supporting statement..."
          className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50"
        />
      </div>

      {/* Font toolbar row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Font family */}
        <select
          value={textStyles.headlineFont}
          onChange={(e) => update({ headlineFont: e.target.value })}
          className="bg-nw-750 border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white/70 focus:outline-none focus:border-[#967705]/50"
          style={{ fontFamily: `${textStyles.headlineFont}, sans-serif` }}
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: `${f}, sans-serif` }}>{f}</option>
          ))}
        </select>

        {/* Size */}
        <select
          value={textStyles.headlineSize}
          onChange={(e) => update({ headlineSize: Number(e.target.value) })}
          className="bg-nw-750 border border-white/[0.08] rounded-md px-2 py-1.5 text-[11px] text-white/70 focus:outline-none focus:border-[#967705]/50 w-[60px]"
        >
          {Array.from({ length: 14 }, (_, i) => 16 + i * 8).map((sz) => (
            <option key={sz} value={sz}>{sz}px</option>
          ))}
        </select>

      </div>

      {/* Headline size slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] text-white/40">Size</label>
          <span className="text-[11px] text-white/40">{textStyles.headlineSize}px</span>
        </div>
        <input
          type="range" min={16} max={120} step={2}
          value={textStyles.headlineSize}
          onChange={(e) => update({ headlineSize: Number(e.target.value) })}
          className="w-full accent-[#c9a70a]"
        />
      </div>

      {/* Colour */}
      <div>
        <label className="text-[11px] text-white/40 block mb-1.5">Colour</label>
        <div className="flex gap-2 items-center">
          {TEXT_COLOURS.map((c) => (
            <button
              key={c.value}
              onClick={() => update({ textColor: c.value })}
              title={c.label}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                textStyles.textColor === c.value ? 'border-white scale-110' : 'border-transparent hover:border-white/40'
              }`}
              style={{ background: c.value }}
            />
          ))}
          <input
            type="color"
            value={textStyles.textColor.startsWith('#') ? textStyles.textColor : '#c9a70a'}
            onChange={(e) => update({ textColor: e.target.value })}
            className="w-7 h-7 rounded-full border-0 cursor-pointer bg-transparent"
            title="Custom colour"
          />
        </div>
      </div>
    </div>
  )
}
