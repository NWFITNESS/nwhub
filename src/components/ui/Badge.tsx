type BadgeVariant = 'done' | 'todo' | 'gold' | 'active' | 'paused' | 'sent' | 'draft' | 'amber' | 'danger'
  | 'new' | 'read' | 'replied' | 'published' | 'subscribed' | 'unsubscribed' | 'bounced' | 'default' | 'green'

const base = 'inline-flex items-center rounded-[8px] px-[7px] py-[2px] text-[9px] font-semibold uppercase tracking-[0.8px]'

const variantStyles: Record<BadgeVariant, string> = {
  done:         'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  todo:         'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  gold:         'bg-[rgba(212,160,23,0.18)] text-gold-300  border border-[rgba(212,160,23,0.25)]',
  active:       'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  paused:       'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  sent:         'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  draft:        'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  amber:        'bg-[rgba(245,158,11,0.1)]  text-[#f59e0b] border border-[rgba(245,158,11,0.2)]',
  danger:       'bg-[rgba(248,113,113,0.1)] text-red-400   border border-[rgba(248,113,113,0.2)]',
  // Legacy aliases
  new:          'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  read:         'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  replied:      'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  published:    'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  subscribed:   'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  unsubscribed: 'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  bounced:      'bg-[rgba(248,113,113,0.1)] text-red-400   border border-[rgba(248,113,113,0.2)]',
  default:      'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  green:        'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`${base} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function statusToBadge(status: string): BadgeVariant {
  return (status as BadgeVariant) ?? 'default'
}
