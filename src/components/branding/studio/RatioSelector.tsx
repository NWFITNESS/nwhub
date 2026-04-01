'use client'

export type PlatformTab = 'instagram' | 'linkedin'

export interface PostRatio {
  id: string
  label: string
  ratio: string
  width: number
  height: number
  platform: PlatformTab
}

export const RATIO_OPTIONS: PostRatio[] = [
  { id: 'ig-portrait',   label: 'Portrait',   ratio: '4:5',    width: 1080, height: 1350, platform: 'instagram' },
  { id: 'ig-square',     label: 'Square',     ratio: '1:1',    width: 1080, height: 1080, platform: 'instagram' },
  { id: 'ig-landscape',  label: 'Landscape',  ratio: '1.91:1', width: 1080, height: 566,  platform: 'instagram' },
  { id: 'ig-story',      label: 'Story',      ratio: '9:16',   width: 1080, height: 1920, platform: 'instagram' },
  { id: 'li-landscape',  label: 'Landscape',  ratio: '1.91:1', width: 1200, height: 627,  platform: 'linkedin' },
  { id: 'li-square',     label: 'Square',     ratio: '1:1',    width: 1080, height: 1080, platform: 'linkedin' },
  { id: 'li-portrait',   label: 'Portrait',   ratio: '4:5',    width: 1080, height: 1350, platform: 'linkedin' },
  { id: 'li-story',      label: 'Tall',       ratio: '9:16',   width: 1080, height: 1920, platform: 'linkedin' },
]

interface Props {
  platformTab: PlatformTab
  onPlatformTabChange: (tab: PlatformTab) => void
  ratio: PostRatio
  onRatioChange: (r: PostRatio) => void
}

export function RatioSelector({ platformTab, onPlatformTabChange, ratio, onRatioChange }: Props) {
  const ratiosForTab = RATIO_OPTIONS.filter((r) => r.platform === platformTab)

  return (
    <div className="space-y-3">
      {/* Platform tabs */}
      <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
        {(['instagram', 'linkedin'] as PlatformTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              onPlatformTabChange(tab)
              const first = RATIO_OPTIONS.find((r) => r.platform === tab)
              if (first) onRatioChange(first)
            }}
            className={`flex-1 py-1.5 text-xs font-medium capitalize transition-colors ${
              platformTab === tab ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-750 text-white/40 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Ratio cards */}
      <div className="grid grid-cols-4 gap-1.5">
        {ratiosForTab.map((r) => (
          <button
            key={r.id}
            onClick={() => onRatioChange(r)}
            className={`flex flex-col items-center gap-1.5 py-2 rounded-lg border transition-all ${
              ratio.id === r.id
                ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                : 'border-white/[0.08] bg-nw-750 text-white/40 hover:text-white/70'
            }`}
          >
            <div
              className={`rounded-[2px] border ${ratio.id === r.id ? 'border-[#c9a70a]' : 'border-white/20'}`}
              style={{
                width: Math.round((r.width / Math.max(r.width, r.height)) * 24),
                height: Math.round((r.height / Math.max(r.width, r.height)) * 24),
              }}
            />
            <div className="text-center">
              <p className="text-[10px] font-medium leading-tight">{r.label}</p>
              <p className="text-[9px] opacity-50">{r.ratio}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
