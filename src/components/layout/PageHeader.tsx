interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  label?: string
}

// Follows SKILL.md §8 page layout structure and §2 typography rules
export function PageHeader({ title, description, actions, label = 'Northern Warrior Hub' }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-[10px] font-semibold text-[#d4af37]/70 uppercase tracking-[0.2em] mb-1.5">
          {label}
        </p>
        <h1
          className="text-3xl font-bold text-[#e5e2e1] leading-tight"
          style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#d0c5af]/50 mt-1.5 font-body">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>
      )}
    </div>
  )
}
