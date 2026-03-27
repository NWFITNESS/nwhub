type BadgeVariant = 'new' | 'read' | 'replied' | 'draft' | 'published' | 'sent' | 'subscribed' | 'unsubscribed' | 'bounced' | 'active' | 'default' | 'done' | 'todo' | 'gold' | 'green' | 'amber'

const variantStyles: Record<BadgeVariant, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  read: 'bg-white/5 text-white/50 border-white/10',
  replied: 'bg-green-500/15 text-green-400 border-green-500/30',
  draft: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  published: 'bg-green-500/15 text-green-400 border-green-500/30',
  sent: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  subscribed: 'bg-green-500/15 text-green-400 border-green-500/30',
  unsubscribed: 'bg-white/5 text-white/40 border-white/10',
  bounced: 'bg-red-500/15 text-red-400 border-red-500/30',
  active: 'bg-green-500/15 text-green-400 border-green-500/30',
  default: 'bg-white/5 text-white/60 border-white/10',
  done:    'bg-[rgba(74,222,128,0.1)] text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  todo:    'bg-[rgba(100,116,139,0.1)] text-nw-500 border border-[rgba(255,255,255,0.07)]',
  gold:    'bg-[rgba(212,160,23,0.18)] text-gold-300 border border-[rgba(212,160,23,0.25)]',
  green:   'bg-[rgba(74,222,128,0.1)] text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  amber:   'bg-[rgba(245,158,11,0.1)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-[8px] px-[7px] py-[2px] text-[9px] font-semibold uppercase tracking-[0.8px] ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function statusToBadge(status: string): BadgeVariant {
  return (status as BadgeVariant) ?? 'default'
}
