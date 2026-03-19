'use client'

import { useState, useRef } from 'react'
import { Upload, Clipboard, Trash2, X, Check } from 'lucide-react'
import type { Media } from '@/lib/types'

const CATEGORIES = ['logo', 'hero', 'team', 'gym', 'classes', 'kids', 'hyrox', 'general'] as const

interface PendingFile {
  file: File
  preview: string
  alt: string
  category: string
  width: number
  height: number
}

interface Props {
  initialMedia: Media[]
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 0, height: 0 }) }
    img.src = url
  })
}

export function MediaGrid({ initialMedia }: Props) {
  const [media, setMedia]       = useState(initialMedia)
  const [pending, setPending]   = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function queueFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const newPending: PendingFile[] = []
    for (const file of Array.from(files)) {
      const { width, height } = await getImageDimensions(file)
      newPending.push({
        file,
        preview: URL.createObjectURL(file),
        alt: '',
        category: 'general',
        width,
        height,
      })
    }
    setPending((prev) => [...prev, ...newPending])
  }

  function updatePending(index: number, field: 'alt' | 'category', value: string) {
    setPending((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function removePending(index: number) {
    setPending((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function uploadAll() {
    if (pending.length === 0) return
    setUploading(true)
    const uploaded: Media[] = []
    for (const p of pending) {
      const form = new FormData()
      form.append('file', p.file)
      form.append('alt', p.alt)
      form.append('category', p.category)
      form.append('width', String(p.width))
      form.append('height', String(p.height))
      const res = await fetch('/api/media', { method: 'POST', body: form })
      if (res.ok) {
        uploaded.push(await res.json() as Media)
      } else {
        console.error('Upload failed:', await res.text())
      }
    }
    setPending([])
    setMedia((prev) => [...uploaded.reverse(), ...prev])
    setUploading(false)
  }

  async function handleDelete(item: Media) {
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, storage_path: item.storage_path }),
    })
    setMedia((prev) => prev.filter((m) => m.id !== item.id))
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center mb-6 hover:border-[#967705]/40 transition-colors cursor-pointer"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); queueFiles(e.dataTransfer.files) }}
      >
        <Upload size={24} className="mx-auto text-white/20 mb-2" />
        <p className="text-sm text-white/40">Drag & drop images or click to upload</p>
        <p className="text-xs text-white/20 mt-1">PNG, JPG, WebP — max 50MB</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => queueFiles(e.target.files)}
        />
      </div>

      {/* Pending uploads modal */}
      {pending.length > 0 && (
        <div className="mb-6 bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em]">
              Ready to Upload — {pending.length} image{pending.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-white/30">Add a description and category before uploading</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {pending.map((p, i) => (
              <div key={i} className="flex gap-4 p-4 items-start">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-black border border-white/[0.08]">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col gap-2.5">
                  <p className="text-xs text-white/50 truncate">{p.file.name}</p>
                  <input
                    type="text"
                    placeholder="Alt text — describe this image for the AI (e.g. 'Members doing a HYROX workout on the gym floor')"
                    value={p.alt}
                    onChange={(e) => updatePending(i, 'alt', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
                  />
                  <select
                    value={p.category}
                    onChange={(e) => updatePending(i, 'category', e.target.value)}
                    className="bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white capitalize focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => removePending(i)}
                  className="p-1.5 text-white/20 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-white/[0.06]">
            <button
              onClick={uploadAll}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> Uploading...</>
              ) : (
                <><Upload size={14} /> Upload {pending.length > 1 ? `${pending.length} images` : 'image'}</>
              )}
            </button>
            <button
              onClick={() => { pending.forEach((p) => URL.revokeObjectURL(p.preview)); setPending([]) }}
              className="px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/20 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {media.map((item) => (
          <div key={item.id} className="group relative aspect-square bg-[#161616] rounded-lg overflow-hidden border border-white/[0.08]">
            <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />
            {item.category && (
              <div className="absolute top-1.5 left-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-black bg-[#C9A70A] uppercase tracking-wide">
                  {item.category}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <button
                onClick={() => copyUrl(item.url)}
                className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
                title="Copy URL"
              >
                {copied === item.url ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Clipboard size={12} className="text-white" />
                )}
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="p-1.5 bg-red-500/20 rounded hover:bg-red-500/40 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} className="text-red-400" />
              </button>
            </div>
            {/* Alt text on hover bottom */}
            {item.alt && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white/60 leading-tight line-clamp-2">{item.alt}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {media.length === 0 && pending.length === 0 && (
        <p className="text-center text-white/30 text-sm py-12">No media yet. Upload your first image.</p>
      )}
    </div>
  )
}
