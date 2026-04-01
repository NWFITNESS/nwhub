'use client'

import { type Style, STYLES, STYLE_DEFAULTS, TEMPLATE_MAP, type TemplateRenderProps } from '../templates'

interface Props {
  selected: Style
  onSelect: (s: Style) => void
}

export function TemplateGrid({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {STYLES.map((s) => {
        const active = selected === s.id
        const Tpl = TEMPLATE_MAP[s.id]
        const defaults = STYLE_DEFAULTS[s.id]
        const props: TemplateRenderProps = {
          review: null,
          headline: s.label,
          subheadline: '',
          imagePosition: { x: 50, y: 50 },
          textStyles: defaults,
          overlayOpacity: 72,
          canvasWidth: 200,
          canvasHeight: 200,
        }

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`group relative rounded-lg border overflow-hidden transition-all ${
              active
                ? 'border-[#967705] ring-1 ring-[#967705]/40'
                : 'border-white/[0.08] hover:border-white/20'
            }`}
          >
            {/* Thumbnail preview */}
            <div className="relative w-full aspect-square overflow-hidden bg-nw-900">
              <div style={{ transformOrigin: 'top left', transform: 'scale(0.5)', width: 200, height: 200, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                <Tpl {...props} />
              </div>
            </div>
            {/* Label */}
            <div className={`px-1.5 py-1.5 text-center ${active ? 'bg-[#967705]/10' : 'bg-nw-800'}`}>
              <p className={`text-[10px] font-semibold leading-tight ${active ? 'text-[#c9a70a]' : 'text-white/50 group-hover:text-white/80'}`}>
                {s.label}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
