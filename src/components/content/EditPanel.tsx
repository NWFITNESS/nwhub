'use client'

import { Pencil, X, AlertTriangle } from 'lucide-react'
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
      className={`fixed top-[5rem] right-0 bottom-0 w-[22rem] flex flex-col z-30 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{
        background: 'linear-gradient(180deg, #161616 0%, #0f0f0f 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-16px 0 48px rgba(0,0,0,0.6)',
      }}
    >
      {/* Gold top accent */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, transparent 0%, #967705 25%, #c9a70a 50%, #967705 75%, transparent 100%)' }}
      />

      {section && (
        <>
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(150,119,5,0.15)', border: '1px solid rgba(150,119,5,0.25)' }}
              >
                <Pencil size={15} className="text-[#c9a70a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[10px] font-semibold tracking-[0.12em] uppercase leading-none mb-1"
                  style={{ color: 'rgba(201,167,10,0.7)' }}
                >
                  Editing section
                </p>
                <p className="text-white font-semibold capitalize truncate leading-none">
                  {section.section_key.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.08] transition-colors flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Draft indicator */}
            {section.draft_content != null && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
                <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-400/80">Unsaved draft</p>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-y-auto p-5 editor-scroll-container">
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
                className="w-full text-center text-xs text-white/25 hover:text-red-400 transition-colors disabled:opacity-40 py-1"
              >
                {discarding ? 'Discarding…' : '↩ Discard draft for this section'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
