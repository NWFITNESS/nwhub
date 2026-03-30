'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'default' | 'gold' | 'ghost' | 'danger' | 'primary' | 'secondary' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base = 'inline-flex items-center justify-center gap-1.5 rounded-[7px] border font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const variantMap: Record<Variant, string> = {
  default:     'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-nw-300 hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100 hover:border-[rgba(255,255,255,0.14)]',
  gold:        'border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300 hover:bg-[rgba(212,160,23,0.22)]',
  ghost:       'border-transparent bg-transparent text-nw-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-200',
  danger:      'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-red-400 hover:bg-[rgba(239,68,68,0.18)]',
  // Aliases for backward compat
  primary:     'border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300 hover:bg-[rgba(212,160,23,0.22)]',
  secondary:   'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-nw-300 hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100 hover:border-[rgba(255,255,255,0.14)]',
  destructive: 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-red-400 hover:bg-[rgba(239,68,68,0.18)]',
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-[5px] text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', loading, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variantMap[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
