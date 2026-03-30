'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Check, Image as ImageIcon, Video, Play } from 'lucide-react'
import type { Media } from '@/lib/types'

function isVideo(url?: string): boolean {
  if (!url) return false
  return /\.(mp4|webm|mov|m4v|avi|mkv)(\?.*)?$/i.test(url)
}

async function uploadFile(file: File): Promise<{ data: Media | null; error: string | null }> {
  try {
    const form = new FormData()
    form.append('file', file)
    form.append('alt', '')
    form.append('category', 'general')
    const res = await fetch('/api/media', { method: 'POST', body: form })
    const text = await res.text()
    if (!res.ok) {
      let msg = text
      try { msg = JSON.parse(text)?.error ?? text } catch { /* keep raw text */ }
      return { data: null, error: msg || `Upload failed (${res.status})` }
    }
    return { data: JSON.parse(text) as Media, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Network error' }
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface MediaPickerModalProps {
  value: string
  onSelect: (url: string) => void
  onClose: () => void
}

export function MediaPickerModal({ value, onSelect, onClose }: MediaPickerModalProps) {
  const [media, setMedia]         = useState<Media[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [filter, setFilter]       = useState<'all' | 'images' | 'videos'>('all')
  const fileInput = useRef<HTMLInputElement>(null)
  const supabase  = createClient()

  useEffect(() => {
    supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMedia((data as Media[]) ?? [])
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of Array.from(files)) {
      const { data: row, error } = await uploadFile(file)
      if (error) { setUploadError(error); setUploading(false); return }
      if (row) {
        setMedia((prev) => [row, ...prev])
        onSelect(row.url)
        onClose()
        setUploading(false)
        return
      }
    }
    setUploading(false)
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = media.filter((item) => {
    if (filter === 'images') return !isVideo(item.url)
    if (filter === 'videos') return isVideo(item.url)
    return true
  })

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p className="text-white font-semibold text-sm">Media Library</p>
            <p className="text-white/40 text-xs mt-0.5">
              {loading ? 'Loading…' : `${media.length} file${media.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
              {(['all', 'images', 'videos'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors capitalize ${
                    filter === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Upload zone */}
        <div className="px-5 pt-4 pb-3">
          <div
            className="border border-dashed border-white/10 rounded-xl p-4 text-center hover:border-[#967705]/50 transition-colors cursor-pointer"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                <div className="w-4 h-4 border-2 border-[#967705] border-t-transparent rounded-full animate-spin" />
                Uploading…
              </div>
            ) : (
              <>
                <Upload size={16} className="mx-auto text-white/20 mb-1" />
                <p className="text-xs text-white/40">
                  Drop a file here or <span className="text-[#967705]">click to upload</span>
                </p>
                <p className="text-[10px] text-white/20 mt-1">JPG, PNG, WebP, GIF · MP4, WebM, MOV</p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime,video/mov"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
          {uploadError && (
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-xs leading-relaxed">{uploadError}</span>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/[0.04] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              {filter === 'videos' ? (
                <>
                  <Video size={32} className="mx-auto text-white/10 mb-3" />
                  <p className="text-white/30 text-sm">No videos yet</p>
                </>
              ) : (
                <>
                  <ImageIcon size={32} className="mx-auto text-white/10 mb-3" />
                  <p className="text-white/30 text-sm">No media yet — upload your first file above</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((item) => {
                const isSelected  = item.url === value
                const itemIsVideo = isVideo(item.url)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { onSelect(item.url); onClose() }}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-[#967705] ring-1 ring-[#967705]/40'
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    {itemIsVideo ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted />
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                          <Play size={9} className="text-white fill-white ml-0.5" />
                        </div>
                      </>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />
                    )}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#967705] flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-150">
                      <p className="text-[9px] text-white/70 truncate">{item.alt ?? item.filename}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Multi-select modal ──────────────────────────────────────────────────────

interface MediaPickerMultiModalProps {
  selected: string[]
  onDone: (urls: string[]) => void
  onClose: () => void
  max?: number
  allowVideo?: boolean
}

export function MediaPickerMultiModal({ selected: initial, onDone, onClose, max = 10, allowVideo = false }: MediaPickerMultiModalProps) {
  const [media, setMedia]         = useState<Media[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [filter, setFilter]       = useState<'all' | 'images' | 'videos'>('all')
  const [selected, setSelected]   = useState<string[]>(initial)
  const fileInput = useRef<HTMLInputElement>(null)
  const supabase  = createClient()

  // Determine if current selection has video or images (no mixing allowed)
  const hasVideo = selected.some((u) => isVideo(u))
  const hasImage = selected.some((u) => !isVideo(u))

  useEffect(() => {
    supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMedia((data as Media[]) ?? [])
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    for (const file of Array.from(files)) {
      const { data: row, error } = await uploadFile(file)
      if (error) { setUploadError(error); setUploading(false); return }
      if (row) {
        setMedia((prev) => [row, ...prev])
        // Auto-select if within limits
        if (selected.length < max) {
          const itemIsVid = isVideo(row.url)
          const canAdd = !(hasVideo && !itemIsVid) && !(hasImage && itemIsVid)
          if (canAdd) setSelected((prev) => [...prev, row.url])
        }
      }
    }
    setUploading(false)
  }

  function toggleItem(url: string) {
    if (selected.includes(url)) {
      setSelected((prev) => prev.filter((u) => u !== url))
    } else {
      if (selected.length >= max) return
      const itemIsVid = isVideo(url)
      // Can't mix video + images
      if (hasVideo && !itemIsVid) return
      if (hasImage && itemIsVid) return
      setSelected((prev) => [...prev, url])
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = media.filter((item) => {
    if (!allowVideo && isVideo(item.url)) return false
    if (filter === 'images') return !isVideo(item.url)
    if (filter === 'videos') return isVideo(item.url)
    return true
  })

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p className="text-white font-semibold text-sm">Select Images</p>
            <p className="text-white/40 text-xs mt-0.5">
              {selected.length}/{max} selected
              {hasVideo && ' · Video selected (no images allowed)'}
              {hasImage && selected.length > 0 && ' · Images selected (no video allowed)'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {allowVideo && (
              <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
                {(['all', 'images', 'videos'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors capitalize ${
                      filter === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Upload zone */}
        <div className="px-5 pt-4 pb-3">
          <div
            className="border border-dashed border-white/10 rounded-xl p-4 text-center hover:border-[#967705]/50 transition-colors cursor-pointer"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-white/50">
                <div className="w-4 h-4 border-2 border-[#967705] border-t-transparent rounded-full animate-spin" />
                Uploading…
              </div>
            ) : (
              <>
                <Upload size={16} className="mx-auto text-white/20 mb-1" />
                <p className="text-xs text-white/40">
                  Drop files here or <span className="text-[#967705]">click to upload</span>
                </p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              accept={allowVideo ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'}
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
          {uploadError && (
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-red-400 text-xs leading-relaxed">{uploadError}</span>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/[0.04] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon size={32} className="mx-auto text-white/10 mb-3" />
              <p className="text-white/30 text-sm">No media available</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((item) => {
                const idx = selected.indexOf(item.url)
                const isSelected = idx !== -1
                const itemIsVid = isVideo(item.url)
                const disabled = !isSelected && (
                  selected.length >= max ||
                  (hasVideo && !itemIsVid) ||
                  (hasImage && itemIsVid)
                )
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !disabled && toggleItem(item.url)}
                    disabled={disabled}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-[#967705] ring-1 ring-[#967705]/40'
                        : disabled
                          ? 'border-transparent opacity-35 cursor-not-allowed'
                          : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    {itemIsVid ? (
                      <>
                        <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted />
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                          <Play size={9} className="text-white fill-white ml-0.5" />
                        </div>
                      </>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />
                    )}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#967705] flex items-center justify-center text-[10px] font-bold text-white">
                        {idx + 1}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between">
          <p className="text-[11px] text-white/30">
            {selected.length === 0 ? 'Select images to create a carousel' : `${selected.length} selected`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-white/50 hover:text-white/80 border border-white/[0.08] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onDone(selected)}
              disabled={selected.length === 0}
              className="px-4 py-1.5 text-xs font-medium bg-[#967705]/20 text-[#c9a70a] border border-[#967705]/40 rounded-lg hover:bg-[#967705]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Done ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ImageField ───────────────────────────────────────────────────────────────

interface ImageFieldProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageField({ value, onChange, label }: ImageFieldProps) {
  const [open, setOpen] = useState(false)
  const valueIsVideo    = isVideo(value)

  const handleSelect = useCallback((url: string) => {
    onChange(url)
    setOpen(false)
  }, [onChange])

  return (
    <>
      <div className="space-y-1.5">
        {label && <p className="text-xs text-white/50 font-medium">{label}</p>}
        <div className="flex gap-2 items-start">
          <div className="w-14 h-14 rounded-lg border border-white/10 bg-white/[0.04] flex-shrink-0 overflow-hidden relative">
            {value ? (
              valueIsVideo ? (
                <>
                  <video src={value} className="w-full h-full object-cover" preload="metadata" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={14} className="text-white fill-white" />
                  </div>
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={value} alt="" className="w-full h-full object-cover" />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={18} className="text-white/15" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://… or browse below"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50 transition-colors"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex-1 text-xs bg-white/[0.06] hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-white/70 hover:text-white transition-colors text-center"
              >
                Browse library
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2.5 py-1.5 text-xs bg-white/[0.04] hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                  title="Remove media"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <MediaPickerModal value={value} onSelect={handleSelect} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
