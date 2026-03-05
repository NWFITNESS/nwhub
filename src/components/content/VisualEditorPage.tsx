'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, X, Upload } from 'lucide-react'
import { SectionBlock } from './SectionPreview'
import { SectionEditor } from './SectionEditor'
import { SectionFullPreview } from './SectionFullPreview'
import { ScaledPreview } from './ScaledPreview'

type PageSection = {
  section_key: string
  content: Record<string, unknown>
  draft_content: Record<string, unknown> | null
  updated_at: string
}

interface VisualEditorPageProps {
  slug: string
  label: string
  sections: PageSection[]
  draftCount: number
  saveDraftAction: (
    slug: string,
    sectionKey: string,
    content: Record<string, unknown> | null
  ) => Promise<void>
  publishPageAction: (slug: string) => Promise<void>
}

export function VisualEditorPage({
  slug,
  label,
  sections,
  draftCount,
  saveDraftAction,
  publishPageAction,
}: VisualEditorPageProps) {
  const router = useRouter()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [previewScale, setPreviewScale] = useState<number | null>(null)
  const [publishing, startPublish] = useTransition()
  const [discarding, startDiscard] = useTransition()

  const selectedSection = sections.find((s) => s.section_key === selectedKey)

  // Effective content for the editor: draft takes precedence over live
  const editingContent = selectedSection
    ? (selectedSection.draft_content ?? selectedSection.content)
    : {}

  // Live content state — updated in real-time as the user edits fields
  const [liveContent, setLiveContent] = useState<Record<string, unknown>>(editingContent)

  // Reset live content when section changes
  useEffect(() => {
    setLiveContent(editingContent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey])

  function handleSectionClick(key: string) {
    setSelectedKey(key)
  }

  function handleClose() {
    setSelectedKey(null)
  }

  async function handleSaveDraft(sectionKey: string, content: Record<string, unknown>) {
    await saveDraftAction(slug, sectionKey, content)
    router.refresh()
  }

  function handlePublish() {
    startPublish(async () => {
      await publishPageAction(slug)
      router.refresh()
    })
  }

  function handleDiscard() {
    if (!selectedKey) return
    startDiscard(async () => {
      await saveDraftAction(slug, selectedKey, null)
      router.refresh()
    })
  }

  const hasSelectedDraft = selectedSection?.draft_content != null

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">

      {/* ── Column 1: section list ── */}
      <div className="w-56 flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-[#0d0d0d] overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/content"
              className="text-white/40 hover:text-white transition-colors p-1 -ml-1 rounded"
            >
              <ChevronLeft size={16} />
            </Link>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">{label}</p>
              <p className="text-xs text-white/30 mt-0.5">
                {sections.length} section{sections.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {draftCount > 0 && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#967705] hover:bg-[#b08e06] disabled:opacity-60 transition-colors text-white text-xs font-semibold"
            >
              <Upload size={13} />
              {publishing
                ? 'Publishing…'
                : `Publish ${draftCount} change${draftCount !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {/* Section list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sections.length === 0 ? (
            <p className="text-white/20 text-xs italic text-center py-6">No sections found</p>
          ) : (
            sections.map((section) => (
              <SectionBlock
                key={section.section_key}
                sectionKey={section.section_key}
                content={section.draft_content ?? section.content}
                hasDraft={section.draft_content != null}
                isSelected={selectedKey === section.section_key}
                onClick={handleSectionClick}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Column 2: form editor ── */}
      <div className="w-96 flex-shrink-0 border-r border-white/[0.08] flex flex-col bg-[#0d0d0d]">
        {selectedKey && selectedSection ? (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.08] flex-shrink-0 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Editing</p>
                <p className="text-white font-semibold text-sm capitalize">
                  {selectedKey.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-white/30 hover:text-white transition-colors p-1 rounded mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-5">
              <SectionEditor
                key={selectedKey}
                pageSlug={slug}
                sectionKey={selectedKey}
                initialContent={editingContent}
                onSave={handleSaveDraft}
                onContentChange={setLiveContent}
                saveLabel="Save Draft"
              />
            </div>

            {/* Discard draft */}
            {hasSelectedDraft && (
              <div className="px-5 py-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={discarding}
                  className="w-full text-center text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {discarding ? 'Discarding…' : 'Discard draft for this section'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/20 text-sm">Select a section to edit</p>
          </div>
        )}
      </div>

      {/* ── Column 3: scaled live preview ── */}
      <div className="flex-1 overflow-y-auto bg-[#080808]">
        <div className="p-5">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/25">Live Preview</p>
              {selectedKey && (
                <p className="text-sm font-semibold text-white capitalize mt-0.5">
                  {selectedKey.replace(/_/g, ' ')}
                </p>
              )}
            </div>
            {previewScale !== null && (
              <span className="text-[10px] text-white/20 font-mono">
                {Math.round(previewScale * 100)}%
              </span>
            )}
          </div>

          {/* Browser-chrome frame */}
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            {selectedKey ? (
              <ScaledPreview onScaleChange={setPreviewScale}>
                <SectionFullPreview sectionKey={selectedKey} content={liveContent} />
              </ScaledPreview>
            ) : (
              <div className="h-64 flex items-center justify-center bg-[#0d0d0d]">
                <p className="text-white/15 text-sm">Preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
