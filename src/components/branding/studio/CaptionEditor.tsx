'use client'

import { useCallback, useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Review } from '../ReviewsPanel'
import type { Style } from '../templates'

type SocialPlatform = 'facebook' | 'instagram' | 'linkedin'

interface PlatformInfo { connected: boolean; label: string; subtitle?: string }

const CHAR_LIMITS: Record<SocialPlatform, number> = {
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
}

interface Props {
  review: Review | null
  style: Style
  headline: string
  onHeadlineChange: (v: string) => void
  onSubheadlineChange: (v: string) => void
  caption: string
  onCaptionChange: (v: string) => void
  hashtags: string
  onHashtagsChange: (v: string) => void
  platforms: Record<SocialPlatform, PlatformInfo>
  selectedPlatforms: Set<SocialPlatform>
  onTogglePlatform: (p: SocialPlatform) => void
  captions: Record<SocialPlatform, string>
  onCaptionsChange: (c: Record<SocialPlatform, string>) => void
}

export function CaptionEditor({
  review, style, headline, onHeadlineChange, onSubheadlineChange,
  caption, onCaptionChange, hashtags, onHashtagsChange,
  platforms, selectedPlatforms, onTogglePlatform,
  captions, onCaptionsChange,
}: Props) {
  const [freePrompt, setFreePrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = useCallback(async () => {
    setGenerating(true)
    try {
      const body = review
        ? { review, style }
        : { prompt: freePrompt || 'Create an engaging post for Northern Warrior Fitness', style }
      const res = await fetch('/api/branding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      onHeadlineChange(data.headline ?? '')
      onSubheadlineChange(data.subheadline ?? '')
      onCaptionChange(data.caption ?? '')
      const tags = (data.hashtags ?? []).map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')
      onHashtagsChange(tags)
      const fullCaption = tags ? `${data.caption}\n\n${tags}` : data.caption
      onCaptionsChange({ facebook: fullCaption, instagram: fullCaption, linkedin: data.caption ?? '' })
    } finally {
      setGenerating(false)
    }
  }, [review, style, freePrompt, onHeadlineChange, onSubheadlineChange, onCaptionChange, onHashtagsChange, onCaptionsChange])

  const copyCaption = useCallback(async () => {
    if (!caption) return
    await navigator.clipboard.writeText(hashtags ? `${caption}\n\n${hashtags}` : caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [caption, hashtags])

  const connectedPlatforms = (Object.entries(platforms) as [SocialPlatform, PlatformInfo][]).filter(([, v]) => v.connected)

  return (
    <div className="space-y-4">
      {/* AI Generator */}
      <div className="rounded-lg border border-[#967705]/30 bg-[#967705]/5 p-3 space-y-3">
        {!review && (
          <textarea
            value={freePrompt}
            onChange={(e) => setFreePrompt(e.target.value)}
            rows={2}
            placeholder="Describe your post, or pick a review..."
            className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50 resize-none"
          />
        )}
        <Button variant="primary" onClick={generate} loading={generating} className="w-full gap-2 text-xs">
          <Sparkles size={13} />
          {generating ? 'Generating...' : headline ? 'Regenerate with AI' : 'Generate with AI'}
        </Button>
      </div>

      {/* Caption preview */}
      {caption && (
        <div className="rounded-lg bg-nw-750 border border-white/[0.06] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/35 uppercase tracking-widest">Caption</p>
            <button onClick={copyCaption} className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[#c9a70a] transition-colors">
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-white/65 leading-relaxed">{caption}</p>
          {hashtags && <p className="text-xs text-[#c9a70a]/70">{hashtags}</p>}
        </div>
      )}

      {/* Per-platform captions */}
      {connectedPlatforms.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] text-white/35 uppercase tracking-widest">Platform captions</p>

          {/* Platform chips */}
          <div className="flex flex-wrap gap-1.5">
            {connectedPlatforms.map(([id, info]) => (
              <button
                key={id}
                onClick={() => onTogglePlatform(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  selectedPlatforms.has(id)
                    ? 'border-[#967705] bg-[#967705]/15 text-[#c9a70a]'
                    : 'border-white/[0.08] bg-nw-750 text-white/45 hover:text-white/70'
                }`}
              >
                <span className={`w-3 h-3 rounded-sm flex-shrink-0 border flex items-center justify-center ${selectedPlatforms.has(id) ? 'border-[#c9a70a] bg-[#c9a70a]' : 'border-white/25'}`}>
                  {selectedPlatforms.has(id) && <Check size={8} className="text-black" strokeWidth={3} />}
                </span>
                {info.label}
              </button>
            ))}
          </div>

          {/* Caption textareas */}
          {Array.from(selectedPlatforms).map((id) => (
            <div key={id}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-white/35 uppercase tracking-widest">{platforms[id].label}</label>
                <span className={`text-[10px] ${captions[id].length > CHAR_LIMITS[id] ? 'text-red-400' : 'text-white/25'}`}>
                  {captions[id].length}/{CHAR_LIMITS[id]}
                </span>
              </div>
              <textarea
                value={captions[id]}
                onChange={(e) => onCaptionsChange({ ...captions, [id]: e.target.value })}
                rows={3}
                className="w-full bg-nw-750 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50 resize-none"
                placeholder={`Caption for ${platforms[id].label}...`}
              />
            </div>
          ))}
        </div>
      )}

      {connectedPlatforms.length === 0 && (
        <div className="text-center py-3">
          <p className="text-[11px] text-white/30">No accounts connected.</p>
          <a href="/settings" className="text-[11px] text-[#c9a70a] hover:underline mt-1 inline-block">Connect in Settings</a>
        </div>
      )}
    </div>
  )
}
