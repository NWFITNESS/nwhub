import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  children: ReactNode
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] text-[#888] block">{label}</label>
      {children}
    </div>
  )
}
