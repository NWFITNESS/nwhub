'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Image as ImageIcon, Video } from 'lucide-react'
import { MediaPickerModal } from '@/components/media/MediaPicker'

interface Props {
  videoSrc: string
  duration: number
  trimStart: number
  trimEnd: number
  coverTime: number | null
  onCoverTimeChange: (t: number | null) => void
  customCoverUrl: string
  onCustomCoverChange: (url: string) => void
}

export function CoverPicker({
  videoSrc, duration, trimStart, trimEnd,
  coverTime, onCoverTimeChange,
  customCoverUrl, onCustomCoverChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [frames, setFrames] = useState<string[]>([])
  const [mode, setMode] = useState<'frame' | 'custom'>(customCoverUrl ? 'custom' : 'frame')
  const [showPicker, setShowPicker] = useState(false)

  const clampedEnd = trimEnd || duration
  const frameCount = 8

  // Generate frame thumbnails
  useEffect(() => {
    if (!videoSrc || duration <= 0) return
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.src = videoSrc
    video.preload = 'metadata'

    const canvas = document.createElement('canvas')
    canvas.width = 80
    canvas.height = 142 // 9:16 thumbnail
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const extractedFrames: string[] = []
    let idx = 0

    const step = (clampedEnd - trimStart) / frameCount

    const seekNext = () => {
      if (idx >= frameCount) {
        setFrames(extractedFrames)
        video.remove()
        return
      }
      video.currentTime = trimStart + idx * step
    }

    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      extractedFrames.push(canvas.toDataURL('image/jpeg', 0.6))
      idx++
      seekNext()
    })

    video.addEventListener('loadedmetadata', () => seekNext())

    return () => { video.remove() }
  }, [videoSrc, duration, trimStart, clampedEnd])

  const selectFrame = useCallback((frameIdx: number) => {
    const step = (clampedEnd - trimStart) / frameCount
    const time = trimStart + frameIdx * step
    onCoverTimeChange(Math.round(time * 10) / 10)
    onCustomCoverChange('')
    setMode('frame')
  }, [trimStart, clampedEnd, onCoverTimeChange, onCustomCoverChange])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <ImageIcon size={11} className="text-white/35" />
        <label className="text-[11px] text-white/40">Cover image</label>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-md overflow-hidden border border-white/[0.08]">
        <button
          onClick={() => setMode('frame')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium transition-colors ${
            mode === 'frame' ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-800 text-white/35 hover:text-white/60'
          }`}
        >
          <Video size={10} /> From video
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium transition-colors ${
            mode === 'custom' ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-800 text-white/35 hover:text-white/60'
          }`}
        >
          <ImageIcon size={10} /> Custom image
        </button>
      </div>

      {mode === 'frame' ? (
        <div className="space-y-2">
          {/* Frame strip */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {frames.map((frame, i) => {
              const step = (clampedEnd - trimStart) / frameCount
              const frameTime = Math.round((trimStart + i * step) * 10) / 10
              const isSelected = coverTime !== null && Math.abs(coverTime - frameTime) < 0.2

              return (
                <button
                  key={i}
                  onClick={() => selectFrame(i)}
                  className={`flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                    isSelected ? 'border-[#c9a70a]' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={frame} alt={`Frame ${i + 1}`} className="w-[48px] h-[85px] object-cover" />
                </button>
              )
            })}
          </div>

          {frames.length === 0 && (
            <p className="text-[10px] text-white/25 text-center py-4">Generating frames...</p>
          )}
        </div>
      ) : (
        <div>
          {customCoverUrl ? (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-nw-750 border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={customCoverUrl} alt="Cover" className="w-12 h-[68px] rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/50 truncate">{customCoverUrl.split('/').pop()}</p>
                <button onClick={() => setShowPicker(true)} className="text-[10px] text-[#c9a70a] hover:text-[#967705] transition-colors mt-0.5">
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPicker(true)}
              className="w-full flex items-center gap-2 p-3 rounded-lg border border-dashed border-white/[0.12] hover:border-[#967705]/50 bg-nw-750 hover:bg-[#967705]/5 transition-all text-white/40 hover:text-white/70"
            >
              <ImageIcon size={14} />
              <span className="text-[11px]">Pick cover image from media</span>
            </button>
          )}
        </div>
      )}

      {showPicker && (
        <MediaPickerModal
          value={customCoverUrl}
          onSelect={(url) => {
            onCustomCoverChange(url)
            onCoverTimeChange(null)
            setMode('custom')
            setShowPicker(false)
          }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" />
    </div>
  )
}
