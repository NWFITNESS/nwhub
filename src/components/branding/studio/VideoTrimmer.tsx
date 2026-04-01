'use client'

import { useRef, useState, useCallback } from 'react'
import { Scissors } from 'lucide-react'

interface Props {
  duration: number
  trimStart: number
  trimEnd: number
  onTrimStartChange: (v: number) => void
  onTrimEndChange: (v: number) => void
}

export function VideoTrimmer({ duration, trimStart, trimEnd, onTrimStartChange, onTrimEndChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const clampedEnd = trimEnd || duration
  const clipDuration = clampedEnd - trimStart
  const maxDuration = 90 // Instagram Reels max
  const minDuration = 3 // Instagram Reels min

  const pctToTime = useCallback((pct: number) => {
    return Math.max(0, Math.min(duration, pct * duration))
  }, [duration])

  const handlePointerDown = useCallback((handle: 'start' | 'end') => (e: React.PointerEvent) => {
    setDragging(handle)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const time = pctToTime(pct)

    if (dragging === 'start') {
      const maxStart = (trimEnd || duration) - minDuration
      onTrimStartChange(Math.round(Math.min(time, maxStart) * 10) / 10)
    } else {
      const minEnd = trimStart + minDuration
      const maxEnd = Math.min(duration, trimStart + maxDuration)
      onTrimEndChange(Math.round(Math.max(minEnd, Math.min(time, maxEnd)) * 10) / 10)
    }
  }, [dragging, pctToTime, trimStart, trimEnd, duration, onTrimStartChange, onTrimEndChange])

  const handlePointerUp = useCallback(() => setDragging(null), [])

  if (duration <= 0) return null

  const startPct = (trimStart / duration) * 100
  const endPct = (clampedEnd / duration) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Scissors size={11} className="text-white/35" />
        <label className="text-[11px] text-white/40">Trim</label>
        <span className="text-[10px] text-white/25 ml-auto">
          {formatTime(trimStart)} — {formatTime(clampedEnd)} ({formatTime(clipDuration)})
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-8 bg-nw-750 rounded-lg border border-white/[0.08] select-none touch-none cursor-pointer"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Selected region */}
        <div
          className="absolute top-0 bottom-0 bg-[#c9a70a]/15 border-y border-[#c9a70a]/30"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center"
          style={{ left: `calc(${startPct}% - 6px)` }}
          onPointerDown={handlePointerDown('start')}
        >
          <div className={`w-1 h-5 rounded-full transition-colors ${dragging === 'start' ? 'bg-[#c9a70a]' : 'bg-[#c9a70a]/60'}`} />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center"
          style={{ left: `calc(${endPct}% - 6px)` }}
          onPointerDown={handlePointerDown('end')}
        >
          <div className={`w-1 h-5 rounded-full transition-colors ${dragging === 'end' ? 'bg-[#c9a70a]' : 'bg-[#c9a70a]/60'}`} />
        </div>

        {/* Time labels */}
        <div className="absolute bottom-0.5 left-1 text-[8px] text-white/20 font-mono">{formatTime(0)}</div>
        <div className="absolute bottom-0.5 right-1 text-[8px] text-white/20 font-mono">{formatTime(duration)}</div>
      </div>

      {/* Validation */}
      {clipDuration < minDuration && (
        <p className="text-[10px] text-red-400/70">Minimum {minDuration}s for Reels</p>
      )}
      {clipDuration > maxDuration && (
        <p className="text-[10px] text-red-400/70">Maximum {maxDuration}s for Instagram Reels</p>
      )}

      {/* Manual inputs */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[9px] text-white/30 block mb-0.5">Start</label>
          <input
            type="number"
            min={0}
            max={clampedEnd - minDuration}
            step={0.1}
            value={trimStart}
            onChange={(e) => onTrimStartChange(Math.max(0, Number(e.target.value)))}
            className="w-full bg-nw-750 border border-white/[0.08] rounded-md px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:border-[#967705]/50"
          />
        </div>
        <div className="flex-1">
          <label className="text-[9px] text-white/30 block mb-0.5">End</label>
          <input
            type="number"
            min={trimStart + minDuration}
            max={Math.min(duration, trimStart + maxDuration)}
            step={0.1}
            value={clampedEnd}
            onChange={(e) => onTrimEndChange(Math.min(duration, Number(e.target.value)))}
            className="w-full bg-nw-750 border border-white/[0.08] rounded-md px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:border-[#967705]/50"
          />
        </div>
      </div>
    </div>
  )
}
