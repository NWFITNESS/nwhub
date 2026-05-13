'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MessageSquare, X } from 'lucide-react'

interface Toast {
  id: string
  name: string
  enquiry_type: string
  message: string
}

export function EnquiryToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('new-enquiries')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contact_enquiries' },
        (payload) => {
          const row = payload.new as Toast
          setToasts(prev => [...prev, row])
          // Auto-dismiss after 10 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== row.id))
          }, 10000)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const navigate = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    router.push(`/enquiries?id=${id}`)
  }, [router])

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-5 fade-in"
          style={{
            background: '#161616',
            border: '1px solid rgba(212,160,23,0.25)',
            borderRadius: 14,
            padding: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(150,119,5,0.15)',
            cursor: 'pointer',
          }}
          onClick={() => navigate(toast.id)}
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.2)] flex-shrink-0">
              <MessageSquare size={14} className="text-gold-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[1px] text-gold-400">New Enquiry</span>
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(toast.id) }}
                  className="text-nw-600 hover:text-white transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-sm font-medium text-white mt-1">{toast.name}</p>
              <p className="text-xs text-nw-400 mt-0.5">{toast.enquiry_type}</p>
              {toast.message && (
                <p className="text-xs text-nw-500 mt-1.5 truncate">{toast.message.slice(0, 80)}{toast.message.length > 80 ? '…' : ''}</p>
              )}
              <p className="text-[10px] text-gold-500 mt-2 font-medium">Click to view →</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
