type BadgeVariant = 'new' | 'read' | 'replied' | 'draft' | 'published' | 'sent' | 'subscribed' | 'unsubscribed' | 'bounced' | 'active' | 'default'

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
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

export function statusToBadge(status: string): BadgeVariant {
  return (status as BadgeVariant) ?? 'default'
}
