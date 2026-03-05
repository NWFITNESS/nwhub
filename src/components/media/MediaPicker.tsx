'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react'
import type { Media } from '@/lib/types'

async function uploadFile(file: File): Promise<Media | null> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/media', { method: 'POST', body: form })
  if (!res.ok) { console.error(await res.text()); return null }
  return res.json()
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface MediaPickerModalProps {
  value: string
  onSelect: (url: string) => void
  onClose: () => void
}

function MediaPickerModal({ value, onSelect, onClose }: MediaPickerModalProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('media')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        setMedia((data as Media[]) ?? [])
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const row = await uploadFile(file)
      if (row) {
        setMedia((prev) => [row, ...prev])
        onSelect(row.public_url)
        onClose()
        setUploading(false)
        return
      }
    }
    setUploading(false)
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={16} />
          </button>
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
                <p className="text-xs text-white/40">Drop an image here or <span className="text-[#967705]">click to upload</span></p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/[0.04] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon size={32} className="mx-auto text-white/10 mb-3" />
              <p className="text-white/30 text-sm">No media yet — upload your first image above</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {media.map((item) => {
                const isSelected = item.public_url === value
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { onSelect(item.public_url); onClose() }}
                    className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-[#967705] ring-1 ring-[#967705]/40'
                        : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.public_url}
                      alt={item.alt_text || item.filename}
                      className="w-full h-full object-cover"
                    />
                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#967705] flex items-center justify-center">
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    {/* Hover filename */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-150">
                      <p className="text-[9px] text-white/70 truncate">{item.filename}</p>
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

// ─── ImageField ───────────────────────────────────────────────────────────────

interface ImageFieldProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageField({ value, onChange, label }: ImageFieldProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = useCallback((url: string) => {
    onChange(url)
    setOpen(false)
  }, [onChange])

  return (
    <>
      <div className="space-y-1.5">
        {label && (
          <p className="text-xs text-white/50 font-medium">{label}</p>
        )}
        <div className="flex gap-2 items-start">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg border border-white/10 bg-white/[0.04] flex-shrink-0 overflow-hidden">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={18} className="text-white/15" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* URL input */}
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://… or browse below"
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#967705]/50 transition-colors"
            />

            {/* Actions */}
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
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <MediaPickerModal
          value={value}
          onSelect={handleSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
