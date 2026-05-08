'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Save, Copy, Check, ChevronRight, Type, Link2, Image, FileText } from 'lucide-react'
import { usePostMessageBridge, type EditableBlock } from './usePostMessageBridge'

interface Props {
  pageId: string
  urlPath: string
  title: string
  publicUrl: string
  onClose: () => void
  onSaved: (version: number) => void
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://northernwarrior.co.uk'

export function PageEditorModal({ pageId, urlPath, title, publicUrl, onClose, onSaved }: Props) {
  const {
    iframeRef, blocks, selectedBlockId, setSelectedBlockId,
    ready, highlightBlock, scrollToBlock, updateBlock, revert,
  } = usePostMessageBridge()

  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [editorToken, setEditorToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch editor token on mount
  useState(() => {
    fetch('/api/seo/page/editor-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: urlPath }),
    })
      .then(r => r.json())
      .then(data => { setEditorToken(data.token); setTokenLoading(false) })
      .catch(() => setTokenLoading(false))
  })

  const iframeSrc = editorToken
    ? `${SITE_URL}${urlPath}?nw_edit=${editorToken}`
    : null

  const hasPendingChanges = Object.keys(pendingChanges).length > 0

  const handleBlockEdit = useCallback((blockId: string, content: string) => {
    setPendingChanges(prev => ({ ...prev, [blockId]: content }))

    // Debounced live update to iframe
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateBlock(blockId, content)
    }, 100)
  }, [updateBlock])

  const handleBlockSelect = useCallback((blockId: string) => {
    highlightBlock(blockId)
    scrollToBlock(blockId)
    setSelectedBlockId(blockId)
  }, [highlightBlock, scrollToBlock, setSelectedBlockId])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/seo/page/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, changes: pendingChanges }),
      })
      const data = await res.json()
      if (res.ok) {
        onSaved(data.version)
      }
    } catch { /* handled by onSaved not being called */ }
    finally { setSaving(false) }
  }

  function handleDiscard() {
    if (hasPendingChanges && !confirm('Discard all changes?')) return
    setPendingChanges({})
    revert()
    onClose()
  }

  function copyUrl() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const blockIcon = (type: string) => {
    switch (type) {
      case 'link': return <Link2 size={13} />
      case 'image': return <Image size={13} />
      case 'meta': return <FileText size={13} />
      default: return <Type size={13} />
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-nw-900 flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.08)] bg-nw-800 flex-shrink-0"
        style={{ padding: '8px 12px', height: 48 }}
      >
        <button onClick={handleDiscard} className="text-nw-400 hover:text-nw-200 transition-colors" style={{ padding: 6, minHeight: 44, minWidth: 44 }} aria-label="Close editor">
          <ArrowLeft size={18} />
        </button>
        <button onClick={copyUrl} className="flex-1 min-w-0 text-left">
          <p className="text-[11px] text-nw-500 truncate font-mono">{urlPath}</p>
        </button>
        {copied && <Check size={14} className="text-[#4ade80] flex-shrink-0" />}
        <Button variant="gold" size="sm" onClick={handleSave} loading={saving} disabled={!hasPendingChanges}>
          <Save size={13} /> Save
        </Button>
      </div>

      {/* Preview iframe — top half */}
      <div className="flex-1 min-h-0 border-b border-[rgba(212,160,23,0.2)] relative">
        {tokenLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-[13px] text-nw-400">Loading editor...</p>
            </div>
          </div>
        ) : iframeSrc ? (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts"
            title="Page editor preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ padding: 20 }}>
              <p className="text-[13px] text-red-400 mb-2">Couldn&apos;t load editor</p>
              <p className="text-[11px] text-nw-500">Token generation failed. Close and try again.</p>
            </div>
          </div>
        )}

        {/* Ready indicator */}
        {iframeSrc && !ready && !tokenLoading && (
          <div className="absolute inset-0 bg-nw-900/80 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-6 h-6 rounded-full border-2 border-gold-400 border-t-transparent animate-spin mx-auto mb-2" />
              <p className="text-[11px] text-nw-400">Waiting for page...</p>
            </div>
          </div>
        )}
      </div>

      {/* Block list — bottom half */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-nw-750">
        <div className="border-b border-[rgba(255,255,255,0.06)]" style={{ padding: '10px 16px' }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">
              Editable Blocks
            </p>
            {hasPendingChanges && (
              <Badge variant="gold">{Object.keys(pendingChanges).length} changed</Badge>
            )}
          </div>
        </div>

        {!ready && blocks.length === 0 ? (
          <div style={{ padding: 20 }} className="text-center">
            <p className="text-[13px] text-nw-400">
              {tokenLoading ? 'Loading...' : 'No editable blocks found on this page'}
            </p>
            <p className="text-[11px] text-nw-500 mt-1">
              Add <code className="text-nw-300 bg-nw-800 rounded px-1">data-nw-editable=&quot;block-id&quot;</code> to elements on the public site
            </p>
          </div>
        ) : (
          <div>
            {blocks.map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                pendingContent={pendingChanges[block.id]}
                onSelect={() => handleBlockSelect(block.id)}
                onChange={(content) => handleBlockEdit(block.id, content)}
                icon={blockIcon(block.type)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, isSelected, pendingContent, onSelect, onChange, icon }: {
  block: EditableBlock
  isSelected: boolean
  pendingContent?: string
  onSelect: () => void
  onChange: (content: string) => void
  icon: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const value = pendingContent ?? block.content
  const isChanged = pendingContent !== undefined

  return (
    <div
      className={`border-b border-[rgba(255,255,255,0.06)] transition-colors ${
        isSelected ? 'bg-[rgba(212,160,23,0.06)] border-l-2 border-l-gold-400' : ''
      }`}
    >
      <button
        onClick={() => { onSelect(); setExpanded(!expanded) }}
        className="w-full flex items-center gap-2.5 text-left"
        style={{ padding: '10px 16px', minHeight: 44 }}
      >
        <span className="text-nw-400 flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-nw-200 truncate">{block.label}</p>
          {!expanded && (
            <p className="text-[11px] text-nw-500 truncate">{value.slice(0, 60)}{value.length > 60 ? '...' : ''}</p>
          )}
        </div>
        {isChanged && <Badge variant="gold">Edited</Badge>}
        <ChevronRight size={12} className={`text-nw-500 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 12px' }}>
          {block.type === 'text' && block.tag === 'p' ? (
            <textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)] resize-none min-h-[80px]"
              style={{ padding: '8px 12px' }}
            />
          ) : (
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)]"
              style={{ padding: '8px 12px' }}
            />
          )}
          <p className="text-[10px] text-nw-500 mt-1">{value.length} characters · {block.tag ?? block.type}</p>
        </div>
      )}
    </div>
  )
}
