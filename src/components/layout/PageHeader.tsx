interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  label?: string
}

export function PageHeader({ title, description, actions, label = 'Northern Warrior Hub' }: PageHeaderProps) {
  return (
    <div className="mb-10 relative">
      {/* Gold ambient glow */}
      <div
        className="absolute -left-4 -top-4 w-64 h-20 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(150,119,5,0.6), transparent)' }}
      />
      <div className="relative flex items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-white/30 mb-3">{label}</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">{title}</h2>
          {description && <p className="text-base text-white/35 mt-2">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 mt-8 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
