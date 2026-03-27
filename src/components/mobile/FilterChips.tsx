'use client'

interface Filter {
  id: string
  label: string
}

interface FilterChipsProps {
  filters: Filter[]
  active: string
  onChange: (id: string) => void
}

export function FilterChips({ filters, active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
      {filters.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] border whitespace-nowrap transition-colors ${
            active === f.id
              ? 'bg-[#2a2000] border-[#4a3800] text-[#e0c97f]'
              : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888]'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
