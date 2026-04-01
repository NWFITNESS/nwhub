'use client'

import { useCallback, useEffect, useState } from 'react'
import { Send, Clock, Loader2, CheckCircle, AlertCircle, Calendar, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { SocialPlatform } from './Toolbar'

interface PublishResult { ok: boolean; post_id?: string; error?: string }

interface ScheduledPost {
  id: string
  platforms: string[]
  captions: Record<string, string>
  scheduled_at: string
  status: string
  image_url: string
}

interface Props {
  canPublish: boolean
  selectedPlatforms: Set<SocialPlatform>
  onPublish: () => Promise<void>
  onSchedule: (scheduledAt: string) => Promise<void>
  publishResults: Record<string, PublishResult> | null
}

export function PublishBar({ canPublish, selectedPlatforms, onPublish, onSchedule, publishResults }: Props) {
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [showQueue, setShowQueue] = useState(false)

  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/branding/schedule')
      const data = await res.json()
      setScheduledPosts(data.posts ?? [])
    } catch { /* non-critical */ }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  const handlePublish = async () => {
    setPublishing(true)
    try { await onPublish() }
    finally { setPublishing(false) }
  }

  const handleSchedule = async () => {
    if (!scheduledAt) return
    setScheduling(true)
    try {
      await onSchedule(scheduledAt)
      setScheduledAt('')
      await loadQueue()
    } finally { setScheduling(false) }
  }

  const cancelScheduled = async (id: string) => {
    await fetch(`/api/branding/schedule/${id}`, { method: 'DELETE' })
    await loadQueue()
  }

  const pendingCount = scheduledPosts.filter(p => p.status === 'pending').length

  return (
    <div className="border-t border-white/[0.06] bg-nw-900 flex-shrink-0">
      {/* Results */}
      {publishResults && (
        <div className="px-4 pt-3 space-y-1.5">
          {Object.entries(publishResults).map(([platform, result]) => (
            <div key={platform} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border ${
              result.ok ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-red-500/10 border-red-500/25 text-red-400'
            }`}>
              {result.ok ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              <span className="font-medium capitalize">{platform}</span>
              <span className="text-[10px] opacity-70">{result.ok ? 'Published' : result.error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Queue toggle */}
      {pendingCount > 0 && (
        <button
          onClick={() => setShowQueue(!showQueue)}
          className="w-full px-4 py-1.5 text-[10px] text-white/30 hover:text-white/50 transition-colors text-left"
        >
          {pendingCount} post{pendingCount !== 1 ? 's' : ''} scheduled {showQueue ? '▾' : '▸'}
        </button>
      )}

      {/* Queue */}
      {showQueue && scheduledPosts.length > 0 && (
        <div className="px-4 pb-2 space-y-1.5 max-h-32 overflow-y-auto">
          {scheduledPosts.map((post) => (
            <div key={post.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-nw-750 border border-white/[0.07]">
              <Clock size={11} className="text-[#c9a70a] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white/60 capitalize">{post.platforms.join(', ')}</p>
                <p className="text-[9px] text-white/30">
                  {new Date(post.scheduled_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => cancelScheduled(post.id)} className="text-white/25 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main controls */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Schedule toggle */}
        <div className="flex rounded-md overflow-hidden border border-white/[0.08]">
          <button
            onClick={() => setMode('now')}
            className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${
              mode === 'now' ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-800 text-white/35 hover:text-white/60'
            }`}
          >
            Now
          </button>
          <button
            onClick={() => setMode('schedule')}
            className={`px-2.5 py-1 text-[10px] font-medium flex items-center gap-1 transition-colors ${
              mode === 'schedule' ? 'bg-[#967705]/20 text-[#c9a70a]' : 'bg-nw-800 text-white/35 hover:text-white/60'
            }`}
          >
            <Calendar size={10} /> Schedule
          </button>
        </div>

        {/* Date picker */}
        {mode === 'schedule' && (
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="bg-nw-750 border border-white/[0.08] rounded-md px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:border-[#967705]/50"
          />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Publish / Schedule button */}
        {mode === 'schedule' ? (
          <Button
            variant="primary"
            onClick={handleSchedule}
            loading={scheduling}
            disabled={!canPublish || !scheduledAt}
            className="gap-1.5 text-[11px] h-8"
          >
            <Clock size={13} />
            {scheduling ? 'Scheduling...' : `Schedule (${selectedPlatforms.size})`}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handlePublish}
            loading={publishing}
            disabled={!canPublish}
            className="gap-1.5 text-[11px] h-8"
          >
            {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {publishing ? 'Publishing...' : `Publish to ${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}`}
          </Button>
        )}
      </div>
    </div>
  )
}
