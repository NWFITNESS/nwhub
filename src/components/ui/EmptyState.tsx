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
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-7 text-center text-xs text-nw-600">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]">
        <Icon size={16} className="text-nw-500" />
      </div>
      <p className="text-sm font-medium text-nw-400">{title}</p>
      {description && <p className="text-xs text-nw-500 max-w-xs">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-2 inline-flex items-center gap-1.5 rounded-[7px] border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] px-3 py-[5px] text-xs font-medium text-gold-300 transition-colors hover:bg-[rgba(212,160,23,0.22)]"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
