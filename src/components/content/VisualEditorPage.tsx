'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, X, Upload, Pencil, Eye } from 'lucide-react'
import { SectionBlock } from './SectionPreview'
import { SectionEditor } from './SectionEditor'
import { SectionFullPreview } from './SectionFullPreview'

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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
        active
          ? 'border-[#967705] text-white'
          : 'border-transparent text-white/40 hover:text-white/70'
      }`}
    >
      {children}
    </button>
  )
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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [publishing, startPublish] = useTransition()
  const [discarding, startDiscard] = useTransition()

  const selectedSection = sections.find((s) => s.section_key === selectedKey)

  // Effective content for the editor: draft takes precedence over live
  const editingContent = selectedSection
    ? (selectedSection.draft_content ?? selectedSection.content)
    : {}

  // Live content state — updated in real-time as the user edits fields
  const [liveContent, setLiveContent] = useState<Record<string, unknown>>(editingContent)

  // Reset live content and tab when section changes
  useEffect(() => {
    setLiveContent(editingContent)
    setActiveTab('edit')
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Left: section list ── */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <Link href="/content" className="text-white/40 hover:text-white transition-colors p-1 -ml-1 rounded">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h2 className="text-white font-semibold text-base leading-tight">{label}</h2>
              <p className="text-white/30 text-xs mt-0.5">
                {sections.length} section{sections.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Publish button — shown only when there are pending drafts */}
          {draftCount > 0 && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#967705] hover:bg-[#b08e06] disabled:opacity-60 transition-colors text-white text-sm font-semibold"
            >
              <Upload size={14} />
              {publishing ? 'Publishing…' : `Publish ${draftCount} change${draftCount !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {/* Empty state */}
        {sections.length === 0 ? (
          <div className="bg-[#161616] border border-white/[0.08] rounded-xl p-8 text-center">
            <p className="text-white/40 text-sm">No content sections found for this page.</p>
            <p className="text-white/20 text-xs mt-2">Run the seed SQL in Supabase to populate content.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <SectionBlock
                key={section.section_key}
                sectionKey={section.section_key}
                content={section.draft_content ?? section.content}
                hasDraft={section.draft_content != null}
                isSelected={selectedKey === section.section_key}
                onClick={handleSectionClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right: edit/preview panel ── */}
      <div
        className={`w-96 border-l border-white/[0.08] bg-[#0d0d0d] flex flex-col flex-shrink-0 ${
          selectedKey ? '' : 'hidden'
        }`}
      >
        {selectedKey && selectedSection && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">Editing</p>
                <p className="text-white font-semibold text-sm capitalize">
                  {selectedKey.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-white/30 hover:text-white transition-colors p-1 rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab toggle */}
            <div className="flex border-b border-white/[0.08]">
              <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')}>
                <Pencil size={11} />
                Edit
              </TabButton>
              <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
                <Eye size={11} />
                Preview
              </TabButton>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'edit' ? (
                /* Editor — key forces remount when section changes */
                <SectionEditor
                  key={selectedKey}
                  pageSlug={slug}
                  sectionKey={selectedKey}
                  initialContent={editingContent}
                  onSave={handleSaveDraft}
                  onContentChange={setLiveContent}
                  saveLabel="Save Draft"
                />
              ) : (
                /* Live preview */
                <SectionFullPreview
                  sectionKey={selectedKey}
                  content={liveContent}
                />
              )}
            </div>

            {/* Discard draft action */}
            {hasSelectedDraft && (
              <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">
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
        )}
      </div>
    </div>
  )
}
