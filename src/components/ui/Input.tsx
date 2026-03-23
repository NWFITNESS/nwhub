import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const baseClass = 'w-full bg-[#1c1b1b] border border-[#4d4635]/30 rounded-lg px-3 py-2.5 text-[15px] text-[#e5e2e1] placeholder:text-[#d0c5af]/30 focus:outline-none focus:border-[#d4af37]/60 focus:bg-[#201f1f] transition-colors'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${baseClass} ${className}`} {...props} />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} className={`${baseClass} resize-y min-h-[80px] ${className}`} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={`${baseClass} appearance-none pr-8 cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
      />
    </div>
  )
)
Select.displayName = 'Select'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
export function Label({ className = '', ...props }: LabelProps) {
  return <label className={`block text-sm font-medium text-[#d0c5af]/70 mb-1.5 ${className}`} {...props} />
}

interface FieldProps {
  label?: string
  error?: string
  children: React.ReactNode
  className?: string
}
export function Field({ label, error, children, className = '' }: FieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
