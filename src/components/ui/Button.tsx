'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'default' | 'gold' | 'ghost' | 'danger' | 'primary' | 'secondary' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const base = 'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const variantMap: Record<Variant, string> = {
  default:     'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-nw-200 hover:bg-[rgba(255,255,255,0.1)] hover:text-nw-100 hover:border-[rgba(255,255,255,0.16)]',
  gold:        'border-[rgba(212,160,23,0.3)] bg-[rgba(212,160,23,0.14)] text-gold-300 hover:bg-[rgba(212,160,23,0.24)] hover:border-[rgba(212,160,23,0.4)]',
  ghost:       'border-transparent bg-transparent text-nw-300 hover:bg-[rgba(255,255,255,0.06)] hover:text-nw-100',
  danger:      'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] text-red-400 hover:bg-[rgba(239,68,68,0.2)]',
  primary:     'border-[rgba(212,160,23,0.3)] bg-[rgba(212,160,23,0.14)] text-gold-300 hover:bg-[rgba(212,160,23,0.24)] hover:border-[rgba(212,160,23,0.4)]',
  secondary:   'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-nw-200 hover:bg-[rgba(255,255,255,0.1)] hover:text-nw-100 hover:border-[rgba(255,255,255,0.16)]',
  destructive: 'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.12)] text-red-400 hover:bg-[rgba(239,68,68,0.2)]',
}

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
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
