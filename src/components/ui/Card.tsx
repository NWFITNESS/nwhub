// Panel — premium surface card used across all pages
export function Panel({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${className ?? ''}`}
      style={{ boxShadow: 'var(--nw-card-shadow, 0 2px 12px rgba(0,0,0,0.15))' }}
    >
      {children}
    </div>
  )
}

// Panel header row — larger text, better spacing
export function PanelHeader({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  const trailing = action ?? children
  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-[rgba(255,255,255,0.06)]" style={{ padding: '14px 20px' }}>
      {eyebrow && <span className="text-nw-500" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{eyebrow}</span>}
      {eyebrow && <div className="h-3.5 w-px bg-[rgba(255,255,255,0.1)]" />}
      <span className="text-nw-100" style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  )
}

// Panel body — consistent padding below PanelHeader
export function PanelBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? ''} style={{ padding: 20 }}>{children}</div>
}

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  ripple?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-nw-750 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${className}`}
      style={{ ...(padding ? { padding: 22 } : {}), boxShadow: 'var(--nw-card-shadow, 0 2px 12px rgba(0,0,0,0.15))' }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className} style={{ marginBottom: 18 }}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-brand text-nw-100 ${className}`} style={{ fontSize: 18, fontWeight: 700 }}>{children}</h3>
}
