'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', value, onClear, ...props }, ref) => {
    const hasValue = value !== undefined && value !== ''
    return (
      <div className={`relative ${className}`}>
        <Search
          size={16}
          className="absolute top-1/2 -translate-y-1/2 text-nw-400 pointer-events-none"
          strokeWidth={2}
          style={{ left: 12, zIndex: 1 }}
        />
        <input
          ref={ref}
          value={value}
          className="h-10 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-nw-800 text-sm text-nw-100 placeholder:text-nw-500 outline-none transition-all focus:border-[rgba(212,160,23,0.45)] focus:bg-nw-750 focus:shadow-[0_0_0_3px_rgba(212,160,23,0.08)]"
          style={{ paddingLeft: 38, paddingRight: 36 }}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 -translate-y-1/2 text-nw-500 hover:text-nw-300 transition-colors"
            style={{ right: 12 }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
