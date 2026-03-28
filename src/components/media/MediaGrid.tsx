'use client'

import { useState, useRef } from 'react'
import { Upload, Clipboard, Trash2, X, Check, Pencil, Tag } from 'lucide-react'
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

function EditModal({ item, onSave, onClose }: {
  item: Media
  onSave: (updated: Media) => void
  onClose: () => void
}) {
  const [alt, setAlt]           = useState(item.alt ?? '')
  const [category, setCategory] = useState(item.category ?? 'general')
  const [saving, setSaving]     = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch('/api/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, alt, category }),
    })
    if (res.ok) onSave(await res.json() as Media)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-nw-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <p className="text-sm font-semibold text-white">Edit image details</p>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"><X size={15} /></button>
        </div>
        <div className="p-5 flex gap-4">
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-white/[0.08]">
            <img src={item.url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <p className="text-xs text-white/40 truncate">{item.filename}</p>
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-[0.1em] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white capitalize focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-[0.1em] mb-1.5">Alt text — describe this image for the AI</label>
          <textarea
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="e.g. Members working out on the gym floor during a HYROX class"
            rows={3}
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 resize-none focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors leading-relaxed"
          />
          <p className="text-xs text-white/20 mt-1.5">The AI uses this to understand what's in the image when building emails.</p>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> Saving...</> : <><Check size={14} /> Save</>}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/20 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkCategoryModal({ ids, onSave, onClose }: {
  ids: string[]
  onSave: (category: string) => void
  onClose: () => void
}) {
  const [category, setCategory] = useState('general')
  const [saving, setSaving]     = useState(false)

  async function save() {
    setSaving(true)
    await Promise.all(ids.map((id) =>
      fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category }),
      })
    ))
    onSave(category)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-nw-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p className="text-sm font-semibold text-white">Set category</p>
            <p className="text-xs text-white/30 mt-0.5">{ids.length} image{ids.length > 1 ? 's' : ''} selected</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"><X size={15} /></button>
        </div>
        <div className="p-5">
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-[0.1em] mb-3">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-all text-left ${
                  category === c
                    ? 'bg-[#967705]/20 text-[#C9A70A] border border-[#967705]/40'
                    : 'text-white/50 border border-white/[0.06] hover:text-white/80 hover:border-white/20'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> Saving...</>
              : <><Check size={14} /> Apply to {ids.length} image{ids.length > 1 ? 's' : ''}</>
            }
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 border border-white/[0.08] hover:border-white/20 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function MediaGrid({ initialMedia }: Props) {
  const [media, setMedia]         = useState(initialMedia)
  const [pending, setPending]     = useState<PendingFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied]       = useState<string | null>(null)
  const [editing, setEditing]     = useState<Media | null>(null)
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen]   = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const selecting = selected.size > 0

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(media.map((m) => m.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  async function queueFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const newPending: PendingFile[] = []
    for (const file of Array.from(files)) {
      const { width, height } = await getImageDimensions(file)
      newPending.push({ file, preview: URL.createObjectURL(file), alt: '', category: 'general', width, height })
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
      if (res.ok) uploaded.push(await res.json() as Media)
      else console.error('Upload failed:', await res.text())
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
        <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => queueFiles(e.target.files)} />
      </div>

      {/* Pending uploads */}
      {pending.length > 0 && (
        <div className="mb-6 bg-nw-750 border border-white/[0.06] rounded-xl overflow-hidden">
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
                    placeholder="Alt text — describe this image for the AI"
                    value={p.alt}
                    onChange={(e) => updatePending(i, 'alt', e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
                  />
                  <select
                    value={p.category}
                    onChange={(e) => updatePending(i, 'category', e.target.value)}
                    className="bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white capitalize focus:outline-none focus:border-[#967705]/60 focus:ring-1 focus:ring-[#967705]/30 transition-colors"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <button onClick={() => removePending(i)} className="p-1.5 text-white/20 hover:text-white/60 transition-colors flex-shrink-0 mt-0.5">
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
              {uploading
                ? <><div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" /> Uploading...</>
                : <><Upload size={14} /> Upload {pending.length > 1 ? `${pending.length} images` : 'image'}</>
              }
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

      {/* Bulk action bar */}
      {selecting ? (
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-[#967705]/10 border border-[#967705]/25 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#C9A70A]">{selected.size} selected</span>
            <button onClick={selectAll} className="text-xs text-white/40 hover:text-white/70 transition-colors">Select all</button>
            <button onClick={clearSelection} className="text-xs text-white/40 hover:text-white/70 transition-colors">Clear</button>
          </div>
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-black bg-gradient-to-r from-[#967705] to-[#C9A70A] hover:opacity-90 transition-opacity"
          >
            <Tag size={13} /> Set category
          </button>
        </div>
      ) : (
        media.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-white/20">Click images to select for bulk categorising</p>
            <button onClick={selectAll} className="text-xs text-white/30 hover:text-white/60 transition-colors">Select all</button>
          </div>
        )
      )}

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {media.map((item) => {
          const isSelected = selected.has(item.id)
          return (
            <div
              key={item.id}
              onClick={() => toggleSelect(item.id)}
              className={`group relative aspect-square bg-nw-750 rounded-lg overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-[#C9A70A] border-transparent'
                  : 'border border-white/[0.08]'
              }`}
            >
              <img src={item.url} alt={item.alt ?? item.filename} className="w-full h-full object-cover" />

              {/* Category badge */}
              {item.category && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-black bg-[#C9A70A] uppercase tracking-wide">
                    {item.category}
                  </span>
                </div>
              )}

              {/* Missing category warning */}
              {!item.category && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center" title="No category set">
                  <span className="text-[9px] font-bold text-black">!</span>
                </div>
              )}

              {/* Selected tick */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#C9A70A] flex items-center justify-center">
                  <Check size={11} className="text-black" strokeWidth={3} />
                </div>
              )}

              {/* Hover actions — only shown when not in selection mode */}
              {!selecting && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(item) }}
                    className="p-1.5 bg-white/10 rounded hover:bg-[#967705]/40 transition-colors"
                    title="Edit details"
                  >
                    <Pencil size={12} className="text-white" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyUrl(item.url) }}
                    className="p-1.5 bg-white/10 rounded hover:bg-white/20 transition-colors"
                    title="Copy URL"
                  >
                    {copied === item.url ? <Check size={12} className="text-green-400" /> : <Clipboard size={12} className="text-white" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item) }}
                    className="p-1.5 bg-red-500/20 rounded hover:bg-red-500/40 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              )}

              {/* Alt text tooltip */}
              {item.alt && !selecting && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white/60 leading-tight line-clamp-2">{item.alt}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {media.length === 0 && pending.length === 0 && (
        <p className="text-center text-white/30 text-sm py-12">No media yet. Upload your first image.</p>
      )}

      {editing && (
        <EditModal
          item={editing}
          onSave={(updated) => setMedia((prev) => prev.map((m) => m.id === updated.id ? updated : m))}
          onClose={() => setEditing(null)}
        />
      )}

      {bulkOpen && (
        <BulkCategoryModal
          ids={[...selected]}
          onSave={(category) => {
            setMedia((prev) => prev.map((m) => selected.has(m.id) ? { ...m, category } : m))
            clearSelection()
          }}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  )
}
