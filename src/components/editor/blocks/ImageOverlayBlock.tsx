'use client'

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/core'
import { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'

export function ImageOverlayBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { imageUrl, overlayOpacity } = node.attrs as {
    imageUrl: string
    overlayOpacity: 'light' | 'medium' | 'dark'
  }
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/media', { method: 'POST', body: form })
      const data = await res.json()
      if (data.public_url) updateAttributes({ imageUrl: data.public_url })
    } finally {
      setUploading(false)
    }
  }

  const overlayBg: Record<string, string> = {
    light: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))',
    medium: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.7))',
    dark: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.85))',
  }

  return (
    <NodeViewWrapper>
      <div
        className="rounded-lg overflow-hidden mb-4 border border-white/10 relative"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: imageUrl ? undefined : '#1a1a1a',
        }}
      >
        {/* Mini toolbar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-black/70 border-b border-white/10 backdrop-blur-sm">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mr-1">Image Overlay</span>
          {(['light', 'medium', 'dark'] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => updateAttributes({ overlayOpacity: o })}
              className={`px-2 py-0.5 rounded text-xs capitalize transition-colors ${
                overlayOpacity === o ? 'bg-[#967705]/30 text-[#c9a70a]' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              {o}
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
            {uploading ? 'Uploading…' : 'Change Image'}
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="ml-auto p-1 rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X size={12} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {/* Content area */}
        {imageUrl ? (
          <div style={{ background: overlayBg[overlayOpacity] ?? overlayBg.medium }} className="px-10 py-12">
            <NodeViewContent className="layout-overlay__content text-white outline-none" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center gap-2 border-2 border-dashed border-white/20 rounded-lg px-12 py-8 text-white/30 hover:text-white/50 hover:border-white/30 transition-colors"
            >
              {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
              <span className="text-sm">{uploading ? 'Uploading…' : 'Click to set background image'}</span>
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}
