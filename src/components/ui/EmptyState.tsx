import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
        <Icon size={20} className="text-white/30" />
      </div>
      <p className="text-sm font-medium text-white/60 mb-1">{title}</p>
      {description && <p className="text-xs text-white/30 max-w-xs mb-4">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#967705]/15 text-[#c9a70a] hover:bg-[#967705]/25 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
