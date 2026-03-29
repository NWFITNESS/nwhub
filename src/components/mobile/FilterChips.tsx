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
              ? 'bg-gold-600/10 border-gold-600/20 text-gold-300'
              : 'bg-nw-900 border-[rgba(255,255,255,0.09)] text-nw-500'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
