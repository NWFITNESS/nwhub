'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Download, X, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Panel, PanelHeader } from '@/components/ui/Card'
import type { Media } from '@/lib/types'

const DOC_CATEGORIES = ['document', 'letterhead', 'template', 'pdf'] as const

interface Props {
  initialDocs: Media[]
}

export function DocumentsManager({ initialDocs }: Props) {
  const [docs, setDocs] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<string>('document')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const path = `media/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, '_')}`

    const { error: storageError } = await supabase.storage.from('media').upload(path, file, { contentType: file.type })
    if (storageError) { setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)

    const res = await fetch('/api/media/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, storage_path: path, url: publicUrl, alt: file.name, category, size: file.size }),
    })

    if (res.ok) {
      const newDoc = await res.json() as Media
      setDocs(prev => [newDoc, ...prev])
    }
    setUploading(false)
  }

  async function handleDelete(doc: Media) {
    if (!confirm(`Delete ${doc.filename}?`)) return
    await fetch('/api/media', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: doc.id, storage_path: doc.storage_path }),
    })
    setDocs(prev => prev.filter(d => d.id !== doc.id))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Upload section */}
      <Panel>
        <PanelHeader eyebrow="Upload" title="Add Document" />
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {DOC_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-[7px] px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                  category === cat
                    ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                    : 'text-nw-400 hover:text-nw-200 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]) }}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] p-6 text-center transition-colors hover:border-[rgba(212,160,23,0.3)] hover:bg-[rgba(212,160,23,0.03)]"
          >
            {uploading ? (
              <p className="text-nw-400" style={{ fontSize: 13 }}>Uploading...</p>
            ) : (
              <>
                <Upload size={20} className="text-nw-500" />
                <p className="text-nw-300 font-medium" style={{ fontSize: 13 }}>Drop files here or click to browse</p>
                <p className="text-nw-500" style={{ fontSize: 11 }}>PDF, DOC, DOCX, PNG, JPG — any file type</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]) }} />
        </div>
      </Panel>

      {/* Documents list */}
      <Panel>
        <PanelHeader eyebrow="Library" title={`All Documents (${docs.length})`} />
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <FileText size={24} className="text-nw-600" />
            <p className="text-nw-500" style={{ fontSize: 13 }}>No documents uploaded yet</p>
          </div>
        ) : (
          <div>
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] px-4 py-3 last:border-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] bg-[rgba(212,160,23,0.1)] border border-[rgba(212,160,23,0.22)]">
                  <FileText size={16} className="text-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-nw-200 font-medium truncate" style={{ fontSize: 13 }}>{doc.filename}</p>
                  <p className="text-nw-500" style={{ fontSize: 11 }}>
                    {doc.category} · {doc.size ? `${(doc.size / 1024).toFixed(0)}KB` : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex h-7 w-7 items-center justify-center rounded-[6px] text-nw-500 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-200 transition-colors">
                    {doc.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? <Eye size={13} /> : <Download size={13} />}
                  </a>
                  <button onClick={() => handleDelete(doc)} className="flex h-7 w-7 items-center justify-center rounded-[6px] text-nw-500 hover:bg-[rgba(248,113,113,0.1)] hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
