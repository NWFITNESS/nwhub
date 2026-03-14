'use client'

import { X } from 'lucide-react'
import { SectionEditor } from './SectionEditor'

type PageSection = {
  section_key: string
  content: Record<string, unknown>
  draft_content: Record<string, unknown> | null
  updated_at: string
}

interface Props {
  section: PageSection | undefined
  editingContent: Record<string, unknown>
  slug: string
  onSave: (key: string, content: Record<string, unknown>) => Promise<void>
  onContentChange: (content: Record<string, unknown>) => void
  onClose: () => void
  onDiscardDraft: () => void
  discarding?: boolean
}

export function EditPanel({
  section,
  editingContent,
  slug,
  onSave,
  onContentChange,
  onClose,
  onDiscardDraft,
  discarding,
}: Props) {
  const isOpen = section != null

  return (
    <div
      className={`fixed top-[5rem] right-0 bottom-0 w-96 bg-[#0d0d0d] border-l border-white/[0.08] flex flex-col z-30 transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {section && (
        <>
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.08] flex-shrink-0 flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Editing</p>
              <p className="text-white font-semibold text-sm capitalize">
                {section.section_key.replace(/_/g, ' ')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/30 hover:text-white transition-colors p-1 rounded mt-0.5"
            >
              <X size={16} />
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-5">
            <SectionEditor
              key={section.section_key}
              pageSlug={slug}
              sectionKey={section.section_key}
              initialContent={editingContent}
              onSave={onSave}
              onContentChange={onContentChange}
              saveLabel="Save Draft"
            />
          </div>

          {/* Discard draft */}
          {section.draft_content != null && (
            <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
              <button
                type="button"
                onClick={onDiscardDraft}
                disabled={discarding}
                className="w-full text-center text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {discarding ? 'Discarding…' : 'Discard draft for this section'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
