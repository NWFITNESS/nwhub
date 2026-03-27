'use client'

import { Check } from 'lucide-react'
import { BottomSheet } from './BottomSheet'

interface Option {
  value: string
  label: string
}

interface BottomSheetPickerProps {
  open: boolean
  onClose: () => void
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function BottomSheetPicker({
  open,
  onClose,
  options,
  value,
  onChange,
  placeholder = 'Select…',
}: BottomSheetPickerProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title={placeholder}>
      <div className="overflow-y-auto max-h-[60vh]">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); onClose() }}
            className="w-full flex items-center justify-between px-5 py-4 text-[14px] text-white border-b border-[#1e1e1e] last:border-0 active:bg-[#1e1e1e]"
          >
            <span>{opt.label}</span>
            {value === opt.value && (
              <Check size={16} className="text-[#e0c97f] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
