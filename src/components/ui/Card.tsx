// Panel — surface card used across all pages
export function Panel({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 shadow-[0_2px_12px_rgba(0,0,0,0.15)] ${className ?? ''}`}>
      {children}
    </div>
  )
}

// Panel header row
export function PanelHeader({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  const trailing = action ?? children
  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-[rgba(255,255,255,0.08)]" style={{ padding: '12px 18px' }}>
      {eyebrow && <span className="text-[11px] font-bold uppercase tracking-[1.6px] text-nw-400">{eyebrow}</span>}
      {eyebrow && <div className="h-3.5 w-px bg-[rgba(255,255,255,0.12)]" />}
      <span className="text-sm font-semibold text-nw-100">{title}</span>
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  )
}

// Panel body — consistent padding below PanelHeader
export function PanelBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? ''} style={{ padding: 18 }}>{children}</div>
}

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  ripple?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.12)] bg-nw-750 shadow-[0_2px_12px_rgba(0,0,0,0.15)] ${className}`} style={padding ? { padding: 20 } : undefined}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className} style={{ marginBottom: 18 }}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-bold text-white ${className}`}>{children}</h3>
}
