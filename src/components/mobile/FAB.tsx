'use client'

import { Plus } from 'lucide-react'

interface FABProps {
  label: string
  onClick: () => void
}

export function FAB({ label, onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed left-4 right-4 h-12 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-nw-950 flex items-center justify-center gap-2 font-brand font-medium text-[13px] shadow-lg active:opacity-90 transition-opacity"
      style={{
        bottom: 'calc(56px + env(safe-area-inset-bottom) + 12px)',
        zIndex: 30,
      }}
    >
      <Plus size={18} strokeWidth={2.5} />
      {label}
    </button>
  )
}
