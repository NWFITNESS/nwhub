'use client'

interface Props {
  label: string
  isSelected: boolean
  onSelect: () => void
  children: React.ReactNode
}

export function EditableZone({ label, isSelected, onSelect, children }: Props) {
  return (
    <div
      className={`relative group cursor-pointer ${isSelected ? 'ring-2 ring-[#c4a015] ring-inset' : ''}`}
      onClick={onSelect}
    >
      {/* Hover outline */}
      {!isSelected && (
        <div className="absolute inset-0 ring-2 ring-[#967705] ring-inset opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10" />
      )}

      {/* Label badge */}
      <div
        className={`absolute top-2 left-2 z-20 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-semibold pointer-events-none transition-opacity duration-150 ${
          isSelected
            ? 'bg-[#c4a015] text-black opacity-100'
            : 'bg-[#967705] text-black opacity-0 group-hover:opacity-100'
        }`}
      >
        {label}
      </div>

      {children}
    </div>
  )
}
