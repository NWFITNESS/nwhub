interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  label?: string       // old prop — maps to eyebrow
  eyebrow?: string     // new prop
  titleGold?: string   // appended to title in gold
  date?: string        // replaces description for dates
}

export function PageHeader({ title, description, actions, label, eyebrow, titleGold, date }: PageHeaderProps) {
  const above = eyebrow ?? label
  const sub = date ?? description
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1">
        {above && (
          <span className="text-[11px] font-bold uppercase tracking-[2px] text-nw-400">{above}</span>
        )}
        <h1 className="font-brand text-[30px] font-bold leading-none tracking-[0.3px] text-white">
          {title}{titleGold && <span className="text-gold-400"> {titleGold}</span>}
        </h1>
        {sub && <span className="mt-1 text-sm text-nw-400">{sub}</span>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>
      )}
    </div>
  )
}
