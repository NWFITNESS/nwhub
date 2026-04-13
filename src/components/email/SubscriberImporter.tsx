'use client'

import { useState, useRef } from 'react'
import { Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { useRouter } from 'next/navigation'

const SOURCES = [
  { id: 'website', label: 'Website Subscribers', desc: 'From northernwarrior.co.uk sign-up forms' },
  { id: 'squarespace', label: 'Squarespace Import', desc: 'Exported from old Squarespace website' },
  { id: 'mailchimp', label: 'Mailchimp Export', desc: 'Exported audience from Mailchimp' },
  { id: 'manual', label: 'Manual List', desc: 'Spreadsheet or other source' },
]

interface ParsedRow {
  email: string
  first_name: string
  last_name: string
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
  const emailIdx = headers.findIndex(h => h.includes('email'))
  const fnIdx = headers.findIndex(h => h.includes('first') || h === 'name' || h === 'fname')
  const lnIdx = headers.findIndex(h => h.includes('last') || h === 'surname' || h === 'lname')

  if (emailIdx === -1) return []

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const email = cols[emailIdx]?.toLowerCase().trim()
    if (!email || !email.includes('@')) continue
    rows.push({
      email,
      first_name: fnIdx >= 0 ? cols[fnIdx] ?? '' : '',
      last_name: lnIdx >= 0 ? cols[lnIdx] ?? '' : '',
    })
  }
  return rows
}

export function SubscriberImporter() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState('website')
  const [customTag, setCustomTag] = useState('')
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ synced: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  function handleFile(file: File | null) {
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setError('No valid email addresses found in this CSV. Make sure there\'s an "email" column.')
        setParsed([])
      } else {
        setParsed(rows)
      }
    }
    reader.readAsText(file)
  }

  async function handleUpload() {
    if (parsed.length === 0) return
    setUploading(true)
    setError('')

    const tags = [source]
    if (customTag.trim()) tags.push(customTag.trim().toLowerCase())

    const res = await fetch('/api/email/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribers: parsed.map(r => ({
          ...r,
          tags,
          source,
        })),
      }),
    })

    setUploading(false)
    if (res.ok) {
      const data = await res.json()
      setResult(data)
      setParsed([])
      setFileName('')
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Import failed')
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-[700px]">
      {/* Source picker */}
      <Panel>
        <PanelHeader eyebrow="Step 1" title="Select Source" />
        <div className="p-6 grid grid-cols-1 gap-2 md:grid-cols-2">
          {SOURCES.map(s => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`flex flex-col gap-1 rounded-[8px] border p-3 text-left transition-all ${
                source === s.id
                  ? 'border-[rgba(212,160,23,0.3)] bg-[rgba(212,160,23,0.08)]'
                  : 'border-[rgba(255,255,255,0.09)] bg-nw-800 hover:border-[rgba(255,255,255,0.14)]'
              }`}
            >
              <span className={`font-medium ${source === s.id ? 'text-gold-300' : 'text-nw-200'}`} style={{ fontSize: 13 }}>{s.label}</span>
              <span className="text-nw-500" style={{ fontSize: 11 }}>{s.desc}</span>
            </button>
          ))}
        </div>
        <div className="px-6 pb-6">
          <label className="block text-nw-500 mb-1.5" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Custom Tag (optional)</label>
          <input
            value={customTag}
            onChange={e => setCustomTag(e.target.value)}
            placeholder="e.g. april-2026, vip, hyrox-interest"
            className="h-9 w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-nw-200 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
            style={{ fontSize: 13 }}
          />
          <p className="text-nw-500 mt-1" style={{ fontSize: 10 }}>This tag will be added to all imported subscribers for easy targeting in campaigns</p>
        </div>
      </Panel>

      {/* Upload */}
      <Panel>
        <PanelHeader eyebrow="Step 2" title="Upload CSV" />
        <div className="p-6">
          {!fileName ? (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
              className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] p-8 text-center transition-colors hover:border-[rgba(212,160,23,0.3)] hover:bg-[rgba(212,160,23,0.03)]"
            >
              <Upload size={24} className="text-nw-500" />
              <p className="text-nw-300 font-medium" style={{ fontSize: 13 }}>Drop your CSV here or click to browse</p>
              <p className="text-nw-500" style={{ fontSize: 11 }}>Must have an &quot;email&quot; column. First name and last name columns optional.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.11)] bg-nw-800 p-3">
              <FileText size={18} className="text-gold-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-nw-200 font-medium truncate" style={{ fontSize: 13 }}>{fileName}</p>
                <p className="text-nw-500" style={{ fontSize: 11 }}>{parsed.length} email{parsed.length !== 1 ? 's' : ''} found</p>
              </div>
              <button onClick={() => { setParsed([]); setFileName(''); setError('') }} className="text-nw-500 hover:text-nw-300"><X size={14} /></button>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files?.[0] ?? null)} />

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] px-3 py-2 text-red-400" style={{ fontSize: 12 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {result && (
            <div className="mt-3 flex items-center gap-2 rounded-[8px] border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)] px-3 py-2 text-[#4ade80]" style={{ fontSize: 12 }}>
              <CheckCircle size={14} /> Imported {result.synced} subscribers ({result.skipped} already existed)
            </div>
          )}
        </div>
      </Panel>

      {/* Preview + Upload */}
      {parsed.length > 0 && (
        <Panel>
          <PanelHeader eyebrow="Step 3" title={`Preview (${parsed.length} subscribers)`} />
          <div className="max-h-[200px] overflow-y-auto">
            {parsed.slice(0, 20).map((r, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-[rgba(255,255,255,0.05)] px-6 py-2">
                <span className="text-nw-200 flex-1 truncate" style={{ fontSize: 12 }}>{r.email}</span>
                <span className="text-nw-400" style={{ fontSize: 11 }}>{[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}</span>
              </div>
            ))}
            {parsed.length > 20 && (
              <p className="px-6 py-2 text-nw-500" style={{ fontSize: 11 }}>...and {parsed.length - 20} more</p>
            )}
          </div>
          <div className="p-6 flex items-center justify-between">
            <p className="text-nw-500" style={{ fontSize: 11 }}>
              Source: <span className="text-gold-300">{source}</span>
              {customTag && <> · Tag: <span className="text-gold-300">{customTag}</span></>}
            </p>
            <Button variant="gold" size="sm" onClick={handleUpload} loading={uploading}>
              <Upload size={12} /> Import {parsed.length} Subscribers
            </Button>
          </div>
        </Panel>
      )}

      {result && (
        <Button variant="default" size="sm" onClick={() => router.push('/email')} className="self-start">
          ← Back to Subscribers
        </Button>
      )}
    </div>
  )
}
