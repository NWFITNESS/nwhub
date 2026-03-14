'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Upload, Trash2 } from 'lucide-react'
import { IframeCanvas } from './IframeCanvas'
import { FloatingEditor } from './FloatingEditor'

type PageSection = {
  section_key: string
  sort_order: number | null
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
  saveAndPublishAction: (
    slug: string,
    edits: Record<string, Record<string, unknown>>
  ) => Promise<void>
}

interface EditorPos {
  clientX: number
  clientY: number
}

export function VisualEditorPage({
  slug,
  label,
  sections,
  draftCount,
  saveDraftAction,
  saveAndPublishAction,
}: VisualEditorPageProps) {
  const router = useRouter()
  const [liveEdits, setLiveEdits] = useState<Record<string, Record<string, unknown>>>({})
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [editorPos, setEditorPos] = useState<EditorPos | null>(null)
  const [publishing, startPublish] = useTransition()
  const [discarding, startDiscard] = useTransition()

  const hasLiveEdits = Object.keys(liveEdits).length > 0
  const hasChanges = hasLiveEdits || draftCount > 0

  function getEffective(sectionKey: string): Record<string, unknown> {
    const s = sections.find((x) => x.section_key === sectionKey)
    return liveEdits[sectionKey] ?? s?.draft_content ?? s?.content ?? {}
  }

  // ── Section click → open floating editor ────────────────────────────────────

  function handleSectionClick(key: string, clientX: number, clientY: number) {
    setSelectedKey(key)
    setEditorPos({ clientX, clientY })
  }

  // ── Live field update → update liveEdits + propagate to iframe ───────────────

  function handleContentChange(content: Record<string, unknown>) {
    if (!selectedKey) return
    setLiveEdits((prev) => ({ ...prev, [selectedKey]: content }))
  }

  // ── Save draft for current section ───────────────────────────────────────────

  async function handleSaveDraftCurrent() {
    if (!selectedKey) return
    await saveDraftAction(slug, selectedKey, getEffective(selectedKey))
    router.refresh()
  }

  // ── Publish all ──────────────────────────────────────────────────────────────

  function handlePublish() {
    startPublish(async () => {
      await saveAndPublishAction(slug, liveEdits)
      setLiveEdits({})
      setSelectedKey(null)
      setEditorPos(null)
      router.refresh()
    })
  }

  // ── Discard all drafts ────────────────────────────────────────────────────────

  function handleDiscardAll() {
    startDiscard(async () => {
      setLiveEdits({})
      setSelectedKey(null)
      setEditorPos(null)
      await Promise.all(
        sections
          .filter((s) => s.draft_content != null)
          .map((s) => saveDraftAction(slug, s.section_key, null))
      )
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">

      {/* ── Top toolbar ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-[#0d0d0d] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/50 border border-white/[0.08] bg-white/[0.03] hover:text-white hover:border-white/20 hover:bg-white/[0.06] transition-all duration-200"
          >
            <ChevronLeft size={13} />
            All Pages
          </Link>
          <span className="text-white/20 text-sm">/</span>
          <p className="text-sm font-semibold text-white">{label}</p>
          {hasChanges && (
            <span className="px-2 py-0.5 rounded-full bg-[#967705]/20 border border-[#967705]/40 text-[10px] text-[#c4a015] font-semibold">
              {hasLiveEdits ? 'unsaved changes' : `${draftCount} draft${draftCount !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleDiscardAll}
              disabled={discarding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-400/40 text-white/40 hover:text-red-400 disabled:opacity-50 transition-colors text-xs font-medium"
            >
              <Trash2 size={12} />
              {discarding ? 'Discarding…' : 'Discard All'}
            </button>
          )}
          {hasChanges && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#967705] hover:bg-[#b08e06] disabled:opacity-60 transition-colors text-white text-xs font-semibold"
            >
              <Upload size={13} />
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* ── Canvas — scrollable, iframe renders at full page height ── */}
      <div
        id="editor-canvas"
        className="editor-scroll-container bg-[#0a0a0a]"
        style={{
          height: 'calc(100vh - 5rem)',
          overflowY: 'scroll',
          overflowX: 'hidden',
        }}
      >
        <IframeCanvas
          slug={slug}
          liveEdits={liveEdits}
          selectedKey={selectedKey}
          onSectionClick={handleSectionClick}
        />
      </div>

      {/* ── Floating contextual editor — portal to body, position: fixed ── */}
      {selectedKey && editorPos && (
        <FloatingEditor
          sectionKey={selectedKey}
          content={getEffective(selectedKey)}
          clientX={editorPos.clientX}
          clientY={editorPos.clientY}
          onContentChange={handleContentChange}
          onSaveDraft={handleSaveDraftCurrent}
          onClose={() => { setSelectedKey(null); setEditorPos(null) }}
        />
      )}

    </div>
  )
}
