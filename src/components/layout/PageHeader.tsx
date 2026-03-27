interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  label?: string
}

export function PageHeader({ title, description, actions, label = 'Northern Warrior Hub' }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p style={{
          fontSize: 10, fontWeight: 600, color: 'var(--r-gold-400)',
          textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 6,
        }}>
          {label}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-rajdhani), Rajdhani, sans-serif',
          fontWeight: 700, fontSize: 28, color: 'var(--slate-100)', lineHeight: 1.15,
        }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 4 }}>{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>
      )}
    </div>
  )
}
