'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, RefreshCw, CheckCircle,
  AlertCircle, UserPlus, UserMinus, Clock,
} from 'lucide-react'

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
    <div className="flex flex-col gap-6">

      {/* How to */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
        <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-5">HOW TO SYNC</p>
        <div className="flex flex-col lg:flex-row gap-6">
          {[
            { step: '1', title: 'Export from WodBoard', desc: 'Go to WodBoard → Reports → Customer Overview → Export' },
            { step: '2', title: 'Download the CSV',     desc: 'Click the link in your email and save the CSV file to your computer' },
            { step: '3', title: 'Drop it below',        desc: 'Drag the file into the upload area — NWHub handles the rest automatically' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4 flex-1">
              <div className="w-8 h-8 rounded-full bg-[#967705]/15 border border-[#967705]/25 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[#C9A70A]">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F0F0F0] mb-0.5">{item.title}</p>
                <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-[#C9A70A] bg-[#967705]/10'
            : 'border-white/[0.1] bg-[#161616] hover:border-[#967705]/40 hover:bg-[#967705]/5'
        } ${status === 'processing' ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />

        {status === 'idle' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
              <Upload size={24} className="text-[#C9A70A]" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-[#F0F0F0] mb-1">Drop your WodBoard CSV here</p>
              <p className="text-sm text-white/30">or click to browse for the file</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-white/30">
              .CSV files only
            </span>
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[#967705]/10 border border-[#967705]/20 flex items-center justify-center">
              <RefreshCw size={24} className="text-[#C9A70A] animate-spin" />
            </div>
            <p className="text-base font-semibold text-[#F0F0F0]">Processing your CSV...</p>
            <p className="text-sm text-white/30">Comparing with existing contacts</p>
          </>
        )}

        {status === 'complete' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <p className="text-base font-semibold text-[#F0F0F0]">Sync complete!</p>
            <p className="text-sm text-white/30">Drop another CSV to sync again</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <p className="text-base font-semibold text-[#F0F0F0]">Something went wrong</p>
            <p className="text-sm text-white/30">
              {errorMsg || 'Check the file is a valid WodBoard CSV and try again'}
            </p>
          </>
        )}
      </div>

      {/* Results */}
      {results && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'New Members', value: results.created,   icon: UserPlus,    bg: 'rgba(34,197,94,0.15)',  text: 'text-green-400' },
              { label: 'Updated',     value: results.updated,   icon: RefreshCw,   bg: 'rgba(59,130,246,0.15)', text: 'text-blue-400' },
              { label: 'Cancelled',   value: results.cancelled, icon: UserMinus,   bg: 'rgba(239,68,68,0.15)',  text: 'text-red-400' },
              { label: 'Errors',      value: results.errors,    icon: AlertCircle, bg: 'rgba(245,158,11,0.15)', text: 'text-amber-400' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                  <stat.icon size={18} className={stat.text} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'League Spartan' }}>{stat.value}</p>
                  <p className="text-xs text-white/40">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {results.log.length > 0 && (
            <div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em]">SYNC LOG</p>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                {results.log.map((entry, i) => (
                  <div key={i} className="px-6 py-3 flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      entry.includes('Error')     ? 'bg-red-400'
                      : entry.includes('Cancel')  ? 'bg-red-400'
                      : entry.includes('Convert') ? 'bg-blue-400'
                      : entry.includes('Updated') ? 'bg-blue-400'
                      : 'bg-green-400'
                    }`} />
                    <p className="text-xs text-white/50">{entry}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer hint */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Clock size={15} className="text-white/30 flex-shrink-0" />
          <p className="text-xs text-white/30">
            Recommended: sync once a week. All automations (review requests, WhatsApp) pick up new members automatically.
          </p>
        </div>
      </div>

    </div>
  )
}
