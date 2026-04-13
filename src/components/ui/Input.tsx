import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const baseClass = 'h-10 w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-nw-800 px-4 text-sm text-nw-100 placeholder:text-nw-500 outline-none transition-all focus:border-[rgba(212,160,23,0.45)] focus:bg-nw-750 focus:shadow-[0_0_0_3px_rgba(212,160,23,0.08)]'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`${baseClass} ${className}`} {...props} />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea ref={ref} className={`${baseClass} resize-y min-h-[100px] py-3 ${className}`} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={`${baseClass} appearance-none pr-9 cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
      />
    </div>
  )
)
Select.displayName = 'Select'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
export function Label({ className = '', ...props }: LabelProps) {
  return <label className={`block text-sm font-semibold text-nw-200 mb-2 ${className}`} {...props} />
}

interface FieldProps {
  label?: string
  error?: string
  children: React.ReactNode
  className?: string
}
export function Field({ label, error, children, className = '' }: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-xs font-medium text-red-400 mt-1.5">{error}</p>}
    </div>
  )
}
