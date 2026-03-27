interface SectionHeaderProps {
  label: string
}

export function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div className="px-3 pt-3 pb-1">
      <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold">
        {label}
      </p>
    </div>
  )
}
