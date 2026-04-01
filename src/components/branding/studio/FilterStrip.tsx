'use client'

export interface FilterDef {
  id: string
  label: string
  css: string
}

export const FILTERS: FilterDef[] = [
  { id: 'none',       label: 'Original',   css: 'none' },
  { id: 'clarendon',  label: 'Clarendon',  css: 'contrast(1.2) saturate(1.35)' },
  { id: 'gingham',    label: 'Gingham',    css: 'brightness(1.05) hue-rotate(-10deg)' },
  { id: 'moon',       label: 'Moon',       css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { id: 'lark',       label: 'Lark',       css: 'contrast(0.9) brightness(1.15) saturate(1.2)' },
  { id: 'reyes',      label: 'Reyes',      css: 'sepia(0.22) contrast(0.85) brightness(1.1) saturate(0.75)' },
  { id: 'juno',       label: 'Juno',       css: 'contrast(1.2) brightness(1.1) saturate(1.4) sepia(0.08)' },
  { id: 'slumber',    label: 'Slumber',    css: 'saturate(0.66) brightness(1.05) contrast(0.88)' },
  { id: 'crema',      label: 'Crema',      css: 'sepia(0.2) contrast(0.9) brightness(1.05) saturate(0.9)' },
  { id: 'ludwig',     label: 'Ludwig',     css: 'contrast(1.05) brightness(1.05) saturate(1.5)' },
  { id: 'aden',       label: 'Aden',       css: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)' },
  { id: 'perpetua',   label: 'Perpetua',   css: 'contrast(1.1) brightness(1.15) saturate(1.1)' },
  { id: 'bw',         label: 'B&W',        css: 'grayscale(1)' },
  { id: 'sepia',      label: 'Sepia',      css: 'sepia(0.8)' },
  { id: 'warm',       label: 'Warm',       css: 'sepia(0.15) saturate(1.3) brightness(1.05)' },
  { id: 'cool',       label: 'Cool',       css: 'saturate(0.8) brightness(1.1) hue-rotate(10deg)' },
]

interface Props {
  imageUrl: string
  selected: string
  onSelect: (id: string) => void
}

export function FilterStrip({ imageUrl, selected, onSelect }: Props) {
  if (!imageUrl) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {FILTERS.map((f) => {
        const active = selected === f.id
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 transition-all ${
              active ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
          >
            <div
              className={`w-[52px] h-[52px] rounded-lg overflow-hidden border-2 transition-colors ${
                active ? 'border-[#c9a70a]' : 'border-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={f.label}
                className="w-full h-full object-cover"
                style={{ filter: f.css === 'none' ? undefined : f.css }}
                draggable={false}
              />
            </div>
            <span className={`text-[9px] font-medium ${active ? 'text-[#c9a70a]' : 'text-white/40'}`}>
              {f.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
