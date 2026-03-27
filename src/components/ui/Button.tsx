'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'default' | 'gold' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-gradient-to-br from-[#f2ca50] to-[#d4af37] hover:from-[#f5d060] hover:to-[#dbb93a] text-[#3c2f00] font-semibold tracking-wide hover:shadow-[0_0_24px_rgba(212,175,55,0.4)] active:scale-[0.98]',
  secondary: 'bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] border border-[#4d4635]/30 hover:border-[#4d4635]/60 active:scale-[0.98]',
  ghost: 'hover:bg-[#2a2a2a] text-[#d0c5af]/60 hover:text-[#e5e2e1] active:scale-[0.98]',
  destructive: 'bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-600/25 active:scale-[0.98]',
  default: 'border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-nw-300 hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100 hover:border-[rgba(255,255,255,0.14)]',
  gold:    'border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300 hover:bg-[rgba(212,160,23,0.22)]',
  danger:  'border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-red-400 hover:bg-[rgba(239,68,68,0.18)]',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-[5px] text-xs rounded-[7px]',
  md: 'px-4 py-2.5 text-[15px] rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
