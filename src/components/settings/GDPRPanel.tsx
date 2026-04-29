'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Download, Trash2, Search, Shield, AlertTriangle } from 'lucide-react'

export function GDPRPanel() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null)
  const [deleteResult, setDeleteResult] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleExport() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setExportData(null)
    setDeleteResult(null)
    setSuccess('')
    try {
      const res = await fetch(`/api/gdpr/export?email=${encodeURIComponent(email.trim())}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Export failed'); setLoading(false); return }
      setExportData(data)

      // Auto-download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gdpr-export-${email.trim().replace('@', '_at_')}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess('Data exported and downloaded.')
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!email.trim()) return
    const confirmed = window.confirm(
      `PERMANENTLY DELETE all data for ${email.trim()}?\n\n` +
      `This will remove:\n` +
      `• Contact records\n` +
      `• Email subscriptions\n` +
      `• Kids parent & child records\n` +
      `• All bookings (block, drop-in, trials)\n` +
      `• Contact enquiries\n\n` +
      `This action CANNOT be undone. An audit log entry will be kept for compliance.`
    )
    if (!confirmed) return

    setLoading(true)
    setError('')
    setSuccess('')
    setExportData(null)
    setDeleteResult(null)
    try {
      const res = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Deletion failed'); setLoading(false); return }
      setDeleteResult(data.deleted)
      setSuccess('All data for this person has been permanently deleted.')
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  const totalRecords = exportData
    ? Object.values(exportData).reduce((sum: number, v) => sum + (Array.isArray(v) ? v.length : 0), 0)
    : 0

  return (
    <div className="space-y-5 max-w-lg">
      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Field label="Person's email address">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
            />
          </Field>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/10 text-red-400 text-sm" style={{ padding: '8px 12px' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-400/20 bg-green-400/10 text-green-400 text-sm" style={{ padding: '8px 12px' }}>
          <Shield className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="primary" size="sm" loading={loading} onClick={handleExport} disabled={!email.trim()}>
          <Download className="w-3.5 h-3.5 mr-1" /> Export data (SAR)
        </Button>
        <Button variant="destructive" size="sm" loading={loading} onClick={handleDelete} disabled={!email.trim()}>
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete all data
        </Button>
      </div>

      {/* Export summary */}
      {exportData && (
        <div className="rounded-lg border border-white/8 bg-white/[0.03]" style={{ padding: '14px 16px' }}>
          <p className="text-white text-sm font-medium mb-2">
            <Search className="w-3.5 h-3.5 inline mr-1.5" />
            Found {totalRecords} records for {email}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(exportData).map(([key, val]) => {
              if (!Array.isArray(val) || key === 'exported_at' || key === 'subject_email') return null
              return (
                <div key={key} className="flex justify-between">
                  <span className="text-white/40">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white/70 font-medium">{val.length}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete summary */}
      {deleteResult && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5" style={{ padding: '14px 16px' }}>
          <p className="text-white text-sm font-medium mb-2">Deleted records:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(deleteResult).map(([key, count]) => (
              <div key={key} className="flex justify-between">
                <span className="text-white/40">{key.replace(/_/g, ' ')}</span>
                <span className="text-red-400 font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-white/25 text-[11px] leading-relaxed">
        <strong className="text-white/40">Export</strong> downloads all personal data held for this person as JSON (Subject Access Request).
        <strong className="text-white/40 ml-1">Delete</strong> permanently removes all data across contacts, subscriptions, bookings, enquiries, and kids records. An audit log entry is retained for compliance.
      </p>
    </div>
  )
}
