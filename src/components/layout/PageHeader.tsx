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
        <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">
          {label}
        </p>
        <h1 className="text-3xl font-bold text-[#F0F0F0]" style={{ fontFamily: 'Rajdhani' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm text-white/40 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>
      )}
    </div>
  )
}
