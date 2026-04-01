'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Music, Search, Play, Pause, X, AlertCircle } from 'lucide-react'

interface MusicTrack {
  id: string
  name: string
  artist: string
  duration_seconds: number
  preview_url: string | null
  isrc: string | null
}

interface Props {
  selected: MusicTrack | null
  onSelect: (track: MusicTrack | null) => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MusicPicker({ selected, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState<MusicTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Search with debounce
  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setTracks([]); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/social/music-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      setTracks(data.tracks ?? [])
    } catch {
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Audio preview
  const togglePreview = useCallback((track: MusicTrack) => {
    if (!track.preview_url) return

    if (playingId === track.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(track.preview_url)
    audio.volume = 0.5
    audio.play()
    audio.addEventListener('ended', () => setPlayingId(null))
    audioRef.current = audio
    setPlayingId(track.id)
  }, [playingId])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  return (
    <div className="space-y-3">
      {/* Selected track */}
      {selected && (
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#967705]/10 border border-[#967705]/30">
          <Music size={14} className="text-[#c9a70a] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#c9a70a] font-medium truncate">{selected.name}</p>
            <p className="text-[10px] text-white/40 truncate">{selected.artist}</p>
          </div>
          <span className="text-[9px] text-white/30 flex-shrink-0">{formatDuration(selected.duration_seconds)}</span>
          <button
            onClick={() => onSelect(null)}
            className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search music tracks..."
          className="w-full bg-nw-750 border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-[11px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-400/80 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-4 h-4 border-2 border-[#c9a70a]/30 border-t-[#c9a70a] rounded-full animate-spin" />
        </div>
      )}

      {/* Results */}
      {!loading && tracks.length > 0 && (
        <div className="space-y-1 max-h-[240px] overflow-y-auto">
          {tracks.map((track) => {
            const isSelected = selected?.id === track.id
            const isPlaying = playingId === track.id

            return (
              <div
                key={track.id}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#967705] bg-[#967705]/10'
                    : 'border-white/[0.05] bg-nw-750 hover:border-white/[0.12]'
                }`}
                onClick={() => onSelect(isSelected ? null : track)}
              >
                {/* Preview button */}
                {track.preview_url ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePreview(track) }}
                    className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 hover:bg-white/[0.1] transition-colors"
                  >
                    {isPlaying ? (
                      <Pause size={10} className="text-[#c9a70a]" />
                    ) : (
                      <Play size={10} className="text-white/50 ml-0.5" />
                    )}
                  </button>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    <Music size={10} className="text-white/20" />
                  </div>
                )}

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-medium truncate ${isSelected ? 'text-[#c9a70a]' : 'text-white/70'}`}>
                    {track.name}
                  </p>
                  <p className="text-[9px] text-white/35 truncate">{track.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-[9px] text-white/25 flex-shrink-0">
                  {formatDuration(track.duration_seconds)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && query.length >= 2 && tracks.length === 0 && !error && (
        <p className="text-[10px] text-white/25 text-center py-3">No tracks found</p>
      )}

      {/* Info note */}
      <p className="text-[9px] text-white/15 leading-relaxed">
        Music is only available for Reels. Requires Meta App Review with instagram_content_publish permission.
      </p>
    </div>
  )
}
