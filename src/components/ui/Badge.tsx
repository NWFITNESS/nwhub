type BadgeVariant = 'done' | 'todo' | 'gold' | 'active' | 'paused' | 'sent' | 'draft' | 'amber' | 'danger'
  | 'new' | 'read' | 'replied' | 'published' | 'subscribed' | 'unsubscribed' | 'bounced' | 'default' | 'green'

const base = 'inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.8px]'

const variantStyles: Record<BadgeVariant, string> = {
  done:         'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
  todo:         'bg-[rgba(100,116,139,0.12)] text-nw-400    border border-[rgba(255,255,255,0.09)]',
  gold:         'bg-[rgba(212,160,23,0.2)]   text-gold-300  border border-[rgba(212,160,23,0.28)]',
  active:       'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
  paused:       'bg-[rgba(100,116,139,0.12)] text-nw-400    border border-[rgba(255,255,255,0.09)]',
  sent:         'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
  draft:        'bg-[rgba(100,116,139,0.12)] text-nw-400    border border-[rgba(255,255,255,0.09)]',
  amber:        'bg-[rgba(245,158,11,0.12)]  text-[#f59e0b] border border-[rgba(245,158,11,0.22)]',
  danger:       'bg-[rgba(248,113,113,0.12)] text-red-400   border border-[rgba(248,113,113,0.22)]',
  new:          'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
  read:         'bg-[rgba(100,116,139,0.12)] text-nw-400    border border-[rgba(255,255,255,0.09)]',
  replied:      'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
  published:    'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
  subscribed:   'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
  unsubscribed: 'bg-[rgba(100,116,139,0.12)] text-nw-400    border border-[rgba(255,255,255,0.09)]',
  bounced:      'bg-[rgba(248,113,113,0.12)] text-red-400   border border-[rgba(248,113,113,0.22)]',
  default:      'bg-[rgba(100,116,139,0.12)] text-nw-400    border border-[rgba(255,255,255,0.09)]',
  green:        'bg-[rgba(74,222,128,0.12)]  text-[#4ade80] border border-[rgba(74,222,128,0.22)]',
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
