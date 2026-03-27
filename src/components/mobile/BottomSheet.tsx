'use client'

import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#141414] border-t border-[#2a2a2a] rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#333] rounded-full" />
        </div>

        {title && (
          <div className="px-5 py-3 border-b border-[#1e1e1e]">
            <p className="text-[13px] font-semibold text-white/70 text-center">{title}</p>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
