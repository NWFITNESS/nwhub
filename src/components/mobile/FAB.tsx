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
      className="lg:hidden fixed left-4 right-4 h-12 rounded-xl bg-[#e0c97f] text-[#0d0d0d] flex items-center justify-center gap-2 font-medium text-[13px] shadow-lg active:opacity-90 transition-opacity"
      style={{
        bottom: 'calc(56px + env(safe-area-inset-bottom) + 12px)',
        fontFamily: 'Rajdhani, League Spartan, sans-serif',
        zIndex: 30,
      }}
    >
      <Plus size={18} strokeWidth={2.5} />
      {label}
    </button>
  )
}
