// Panel — surface card used across all pages
export function Panel({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 ${className ?? ''}`}>
      {children}
    </div>
  )
}

// Panel header row
export function PanelHeader({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  const trailing = action ?? children
  return (
    <div className="flex flex-shrink-0 items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[11px]">
      {eyebrow && <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">{eyebrow}</span>}
      {eyebrow && <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />}
      <span className="text-[13px] font-medium text-nw-200">{title}</span>
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  )
}

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  ripple?: boolean
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`relative overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-5 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
}

