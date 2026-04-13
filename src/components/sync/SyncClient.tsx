'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, RefreshCw, CheckCircle,
  AlertCircle, UserPlus, UserMinus, Clock,
} from 'lucide-react'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/widgets/dashboard/StatCard'

export function SyncClient() {
  const [status, setStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle')
  const [results, setResults] = useState<{
    created: number
    updated: number
    cancelled: number
    errors: number
    log: string[]
  } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const processCSV = async (file: File) => {
    setStatus('processing')
    setResults(null)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/sync/wodboard', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Upload failed')
      setResults(data)
      setStatus('complete')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragOver(false)
    if (acceptedFiles[0]) processCSV(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
  })

  return (
    <div className="mx-auto flex max-w-[600px] flex-col gap-4">

      {/* How to */}
      <Panel>
        <PanelHeader eyebrow="How to sync" title="3 Steps" />
        <div className="flex flex-col gap-3" style={{ padding: 20 }}>
          {[
            { step: '1', title: 'Export from WodBoard', desc: 'Go to WodBoard → Reports → Customer Overview → Export' },
            { step: '2', title: 'Download the CSV',     desc: 'Click the link in your email and save the CSV file to your computer' },
            { step: '3', title: 'Drop it below',        desc: 'Drag the file into the upload area — NWHub handles the rest automatically' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 rounded-2xl bg-nw-800 border border-[rgba(255,255,255,0.07)]" style={{ padding: 16 }}>
              <div className="flex h-7 w-7 min-w-[28px] items-center justify-center rounded-full bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.3)]">
                <span className="font-brand text-sm font-bold text-gold-300">{item.step}</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-nw-200">{item.title}</p>
                <p className="text-xs font-medium text-nw-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragOver
            ? 'border-[rgba(212,160,23,0.3)] bg-[rgba(212,160,23,0.03)]'
            : 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(212,160,23,0.3)] hover:bg-[rgba(212,160,23,0.03)]'
        } ${status === 'processing' ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />

        {status === 'idle' && (
          <>
            <Upload size={24} className="text-nw-500" />
            <div>
              <p className="text-[13px] font-medium text-nw-300">Drop your WodBoard CSV here</p>
              <p className="text-xs text-nw-500 mt-1">or click to browse for the file</p>
            </div>
            <span className="text-[10px] text-nw-600">CSV files only</span>
          </>
        )}

        {status === 'processing' && (
          <>
            <RefreshCw size={24} className="text-gold-400 animate-spin" />
            <p className="text-[13px] font-medium text-nw-300">Processing your CSV...</p>
            <p className="text-xs text-nw-500">Comparing with existing contacts</p>
          </>
        )}

        {status === 'complete' && (
          <>
            <CheckCircle size={24} className="text-[#4ade80]" />
            <p className="text-[13px] font-medium text-nw-300">Sync complete!</p>
            <p className="text-xs text-nw-500">Drop another CSV to sync again</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-[13px] font-medium text-nw-300">Something went wrong</p>
            <p className="text-xs text-nw-500">{errorMsg || 'Check the file is a valid WodBoard CSV and try again'}</p>
          </>
        )}
      </div>

      {/* Results */}
      {results && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="New Members" value={results.created} icon={UserPlus} iconBg="rgba(34,197,94,0.15)" />
            <StatCard label="Updated" value={results.updated} icon={RefreshCw} iconBg="rgba(59,130,246,0.15)" />
            <StatCard label="Cancelled" value={results.cancelled} icon={UserMinus} iconBg="rgba(239,68,68,0.15)" />
            <StatCard label="Errors" value={results.errors} icon={AlertCircle} iconBg="rgba(245,158,11,0.15)" />
          </div>

          {results.log.length > 0 && (
            <Panel>
              <PanelHeader eyebrow="Sync" title="Log" />
              <div className="max-h-64 overflow-y-auto">
                {results.log.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.05)] py-3" style={{ paddingLeft: 20, paddingRight: 20 }}>
                    <div className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      entry.includes('Error')     ? 'bg-red-400'
                      : entry.includes('Cancel')  ? 'bg-red-400'
                      : entry.includes('Convert') ? 'bg-blue-400'
                      : entry.includes('Updated') ? 'bg-blue-400'
                      : 'bg-[#4ade80]'
                    }`} />
                    <p className="text-[11px] text-nw-400">{entry}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}

      {/* Footer hint */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-nw-400">
        <Clock size={12} className="flex-shrink-0" />
        Recommended: sync once a week. All automations pick up new members automatically.
      </div>

    </div>
  )
}
