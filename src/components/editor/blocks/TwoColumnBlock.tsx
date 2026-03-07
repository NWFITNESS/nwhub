'use client'

import { NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/core'
import { useRef, useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'

export function TwoColumnBlockView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const { imageUrl, imageAlt, layout, imagePosition } = node.attrs as {
    imageUrl: string
    imageAlt: string
    layout: '50/50' | '60/40' | '40/60'
    imagePosition: 'left' | 'right'
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
      if (data.public_url) updateAttributes({ imageUrl: data.public_url, imageAlt: file.name })
    } finally {
      setUploading(false)
    }
  }

  const gridCols = layout === '60/40' ? '3fr 2fr' : layout === '40/60' ? '2fr 3fr' : '1fr 1fr'
  const textOrder = imagePosition === 'left' ? 2 : 1
  const imgOrder = imagePosition === 'left' ? 1 : 2

  return (
    <NodeViewWrapper>
      <div className="border border-white/10 rounded-lg overflow-hidden mb-4 bg-[#111111]">
        {/* Mini toolbar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#161616] border-b border-white/10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mr-1">Two-Column</span>
          {(['50/50', '60/40', '40/60'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => updateAttributes({ layout: l })}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                layout === l ? 'bg-[#967705]/30 text-[#c9a70a]' : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
            >
              {l}
            </button>
          ))}
          <button
            type="button"
            onClick={() => updateAttributes({ imagePosition: imagePosition === 'right' ? 'left' : 'right' })}
            className="px-2 py-0.5 rounded text-xs text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            ↔ Flip
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="ml-auto p-1 rounded text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols }}>
          {/* Text column */}
          <div style={{ order: textOrder }} className="p-4 min-h-[120px]">
            <NodeViewContent className="layout-col__text outline-none min-h-[80px]" />
          </div>

          {/* Image column */}
          <div
            style={{ order: imgOrder }}
            className="border-l border-white/10 flex items-center justify-center min-h-[120px] relative overflow-hidden"
          >
            {imageUrl ? (
              <div className="relative w-full h-full group min-h-[120px]">
                <img src={imageUrl} alt={imageAlt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-2.5 py-1.5 bg-[#967705] text-black text-xs font-semibold rounded-md hover:bg-[#b08e06] transition-colors"
                  >
                    Replace
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex flex-col items-center gap-2 text-white/30 hover:text-white/50 transition-colors p-8 w-full h-full border-2 border-dashed border-white/10 m-3 rounded-lg"
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                <span className="text-xs">{uploading ? 'Uploading…' : 'Upload Image'}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}
