'use client'

import { Search } from 'lucide-react'

interface MobileSearchProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function MobileSearch({ placeholder = 'Search…', value, onChange }: MobileSearchProps) {
  return (
    <div className="lg:hidden flex items-center gap-2 mx-3 my-2 px-3 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
      <Search size={15} className="text-[#555] flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#444] outline-none"
      />
    </div>
  )
}
