'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Upload, Clipboard, Trash2 } from 'lucide-react'
import type { Media } from '@/lib/types'

interface Props {
  initialMedia: Media[]
}

export function MediaGrid({ initialMedia }: Props) {
  const [media, setMedia] = useState(initialMedia)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/media', { method: 'POST', body: form })
      if (!res.ok) { console.error(await res.text()); continue }
      const row: Media = await res.json()
      setMedia((prev) => [row, ...prev])
    }
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
        onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
      >
        <Upload size={24} className="mx-auto text-white/20 mb-2" />
        <p className="text-sm text-white/40">Drag & drop images or click to upload</p>
        <p className="text-xs text-white/20 mt-1">PNG, JPG, WebP — max 10MB</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="mb-4 text-sm text-white/50 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#967705] border-t-transparent rounded-full animate-spin" />
          Uploading...
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {media.map((item) => (
          <div key={item.id} className="group relative aspect-square bg-[#161616] rounded-lg overflow-hidden border border-white/[0.08]">
            <img src={item.public_url} alt={item.alt_text || item.filename} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <button
                onClick={() => copyUrl(item.public_url)}
                className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
                title="Copy URL"
              >
                {copied === item.public_url ? (
                  <span className="text-[10px] text-green-400">✓</span>
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
          </div>
        ))}
      </div>

      {media.length === 0 && !uploading && (
        <p className="text-center text-white/30 text-sm py-12">No media yet. Upload your first image.</p>
      )}
    </div>
  )
}
