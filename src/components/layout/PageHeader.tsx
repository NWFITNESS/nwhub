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
      <div className="flex flex-col gap-1.5">
        {above && (
          <span className="text-nw-500" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{above}</span>
        )}
        <h1 className="font-brand text-nw-100" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: '0.2px' }}>
          {title}{titleGold && <span className="text-gold-400"> {titleGold}</span>}
        </h1>
        {sub && <span className="text-nw-400" style={{ fontSize: 14, marginTop: 2 }}>{sub}</span>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>
      )}
    </div>
  )
}
