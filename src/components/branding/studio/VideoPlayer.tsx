'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface Props {
  src: string
  trimStart: number
  trimEnd: number
  coverTime: number | null
  onDurationReady: (d: number) => void
}

export function VideoPlayer({ src, trimStart, trimEnd, coverTime, onDurationReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [currentTime, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onLoaded = () => {
      setDuration(v.duration)
      onDurationReady(v.duration)
    }
    const onTime = () => setCurrent(v.currentTime)
    const onEnded = () => { setPlaying(false); v.currentTime = trimStart }
    v.addEventListener('loadedmetadata', onLoaded)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', onEnded)
    return () => {
      v.removeEventListener('loadedmetadata', onLoaded)
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('ended', onEnded)
    }
  }, [src, trimStart, onDurationReady])

  // Enforce trim boundaries during playback
  useEffect(() => {
    const v = videoRef.current
    if (!v || !playing) return
    if (v.currentTime < trimStart) v.currentTime = trimStart
    if (trimEnd > 0 && v.currentTime >= trimEnd) {
      v.pause()
      setPlaying(false)
      v.currentTime = trimStart
    }
  }, [currentTime, trimStart, trimEnd, playing])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (playing) {
      v.pause()
      setPlaying(false)
    } else {
      if (trimEnd > 0 && v.currentTime >= trimEnd) v.currentTime = trimStart
      if (v.currentTime < trimStart) v.currentTime = trimStart
      v.play()
      setPlaying(true)
    }
  }, [playing, trimStart, trimEnd])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPct = duration > 0 ? ((currentTime - trimStart) / ((trimEnd || duration) - trimStart)) * 100 : 0

  return (
    <div className="relative rounded-lg overflow-hidden bg-black group">
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        playsInline
        preload="metadata"
        className="w-full aspect-[9/16] object-contain bg-black"
        style={{ maxHeight: 480 }}
      />

      {/* Cover frame indicator */}
      {coverTime !== null && !playing && (
        <div className="absolute top-2 right-2 bg-black/60 text-[9px] text-[#c9a70a] px-2 py-0.5 rounded">
          Cover: {formatTime(coverTime)}
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer"
          onClick={(e) => {
            const v = videoRef.current
            if (!v || !duration) return
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            const start = trimStart
            const end = trimEnd || duration
            v.currentTime = start + pct * (end - start)
          }}
        >
          <div
            className="h-full bg-[#c9a70a] rounded-full transition-[width] duration-100"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={togglePlay} className="text-white/80 hover:text-white transition-colors">
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <span className="text-[10px] text-white/60 font-mono">
            {formatTime(currentTime)} / {formatTime(trimEnd || duration)}
          </span>

          <div className="flex-1" />

          <button onClick={() => setMuted(!muted)} className="text-white/60 hover:text-white transition-colors">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      {/* Play button overlay when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors"
        >
          <div className="w-14 h-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center">
            <Play size={24} className="text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  )
}
