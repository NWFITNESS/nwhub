'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { SectionEditor } from './SectionEditor'

interface Props {
  pageSlug: string
  sectionKey: string
  content: Record<string, unknown>
  updatedAt: string
  onSave: (sectionKey: string, content: Record<string, unknown>) => Promise<void>
}

export function SectionAccordion({ pageSlug, sectionKey, content, updatedAt, onSave }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-[#161616] border border-white/[0.08] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div>
          <span className="text-sm font-medium text-white capitalize">{sectionKey.replace(/_/g, ' ')}</span>
          <span className="ml-3 text-xs text-white/30">
            Updated {formatDistanceToNow(new Date(updatedAt))} ago
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/[0.06]">
          <div className="pt-4">
            <SectionEditor
              pageSlug={pageSlug}
              sectionKey={sectionKey}
              initialContent={content}
              onSave={onSave}
            />
          </div>
        </div>
      )}
    </div>
  )
}
