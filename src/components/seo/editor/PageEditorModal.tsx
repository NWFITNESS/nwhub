'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ArrowLeft, Save, Check, ChevronRight, Type, Link2, FileText } from 'lucide-react'

interface EditableBlock {
  id: string
  type: 'text' | 'link' | 'image' | 'meta'
  label: string
  content: string
  tag?: string
}

interface Props {
  pageId: string
  urlPath: string
  title: string
  publicUrl: string
  briefContent?: Record<string, unknown> | null
  onClose: () => void
  onSaved: (version: number) => void
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://northernwarrior.co.uk'

/**
 * Extract editable blocks from the brief's JSON content.
 * This gives us a block list even when the iframe bridge doesn't connect.
 */
function extractBlocksFromBrief(content: Record<string, unknown>): EditableBlock[] {
  const blocks: EditableBlock[] = []

  function walk(obj: unknown, prefix: string) {
    if (typeof obj === 'string') {
      blocks.push({
        id: prefix,
        type: 'text',
        label: prefix.split('.').pop()?.replace(/_/g, ' ') ?? prefix,
        content: obj,
        tag: obj.length > 100 ? 'p' : 'span',
      })
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => walk(item, `${prefix}.${i}`))
    } else if (obj && typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj)) {
        if (key === 'meta') continue // skip meta block for now
        walk(val, prefix ? `${prefix}.${key}` : key)
      }
    }
  }

  walk(content, '')
  return blocks
}

export function PageEditorModal({ pageId, urlPath, title, publicUrl, briefContent, onClose, onSaved }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [editorToken, setEditorToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [iframeBlocks, setIframeBlocks] = useState<EditableBlock[]>([])
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Blocks: prefer iframe-discovered blocks, fallback to brief-extracted
  const briefBlocks = briefContent ? extractBlocksFromBrief(briefContent) : []
  const blocks = iframeBlocks.length > 0 ? iframeBlocks : briefBlocks
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  // Fetch editor token on mount
  useEffect(() => {
    fetch('/api/seo/page/editor-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: urlPath }),
    })
      .then(r => r.json())
      .then(data => { setEditorToken(data.token); setTokenLoading(false) })
      .catch(() => setTokenLoading(false))
  }, [urlPath])

  // Listen for postMessage from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const data = e.data
      if (!data?.type) return
      if (data.type === 'editor:ready') {
        setIframeReady(true)
        if (Array.isArray(data.blocks)) setIframeBlocks(data.blocks)
      }
      if (data.type === 'editor:block_clicked' && data.block_id) {
        setSelectedBlockId(data.block_id)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const iframeSrc = editorToken ? `${SITE_URL}${urlPath}?nw_edit=${editorToken}` : null
  const hasPendingChanges = Object.keys(pendingChanges).length > 0

  const postToIframe = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*')
  }, [])

  const handleBlockEdit = useCallback((blockId: string, content: string) => {
    setPendingChanges(prev => ({ ...prev, [blockId]: content }))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      postToIframe({ type: 'editor:update', block_id: blockId, content })
    }, 100)
  }, [postToIframe])

  const handleBlockSelect = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
    postToIframe({ type: 'editor:highlight', block_id: blockId })
    postToIframe({ type: 'editor:scroll', block_id: blockId })
  }, [postToIframe])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/seo/page/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: pageId, changes: pendingChanges }),
      })
      const data = await res.json()
      if (res.ok) onSaved(data.version)
    } catch { /* handled by onSaved not being called */ }
    finally { setSaving(false) }
  }

  function handleDiscard() {
    if (hasPendingChanges && !confirm('Discard all changes?')) return
    setPendingChanges({})
    postToIframe({ type: 'editor:revert' })
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
      case 'meta': return <FileText size={13} />
      default: return <Type size={13} />
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-nw-900 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
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
        {copied && <Check size={14} className="text-[#22c55e] flex-shrink-0" />}
        <Button variant="gold" size="sm" onClick={handleSave} loading={saving} disabled={!hasPendingChanges}>
          <Save size={13} /> Save
        </Button>
      </div>

      {/* Preview iframe — fixed 40% height */}
      <div className="flex-shrink-0 border-b border-[rgba(212,160,23,0.2)] relative" style={{ height: '40%' }}>
        {tokenLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-2 border-gold-400 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-[13px] text-nw-400">Loading editor...</p>
            </div>
          </div>
        ) : iframeSrc ? (
          <>
            <iframe
              ref={iframeRef}
              src={iframeSrc}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts"
              title="Page editor preview"
            />
            {!iframeReady && (
              <div className="absolute inset-0 bg-nw-900/80 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gold-400 border-t-transparent animate-spin mx-auto mb-2" />
                  <p className="text-[11px] text-nw-400">Connecting to page...</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ padding: 20 }}>
              <p className="text-[13px] text-red-400 mb-2">Couldn&apos;t load editor</p>
              <p className="text-[11px] text-nw-500">Token generation failed. Close and try again.</p>
            </div>
          </div>
        )}
      </div>

      {/* Block list — remaining 60%, scrollable */}
      <div className="flex-1 overflow-y-auto bg-nw-750">
        <div className="border-b border-[rgba(255,255,255,0.06)] flex-shrink-0" style={{ padding: '10px 16px' }}>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">
              {blocks.length > 0 ? `${blocks.length} Editable Blocks` : 'Editable Blocks'}
            </p>
            {hasPendingChanges && (
              <Badge variant="gold">{Object.keys(pendingChanges).length} changed</Badge>
            )}
          </div>
          {!iframeReady && blocks.length > 0 && (
            <p className="text-[10px] text-nw-500 mt-1">Editing from brief content (iframe not connected)</p>
          )}
        </div>

        {blocks.length === 0 ? (
          <div style={{ padding: 20 }} className="text-center">
            <p className="text-[13px] text-nw-400">No editable blocks found</p>
            <p className="text-[11px] text-nw-500 mt-1">
              The page needs <code className="text-nw-300 bg-nw-800 rounded px-1">data-nw-editable</code> attributes, or a brief with content to edit.
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
    <div className={`border-b border-[rgba(255,255,255,0.06)] transition-colors ${isSelected ? 'bg-[rgba(212,160,23,0.06)] border-l-2 border-l-gold-400' : ''}`}>
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
          {block.tag === 'p' || value.length > 100 ? (
            <textarea
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)] resize-none"
              style={{ padding: '8px 12px', minHeight: 80 }}
            />
          ) : (
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[13px] text-white outline-none focus:border-[rgba(212,160,23,0.4)]"
              style={{ padding: '8px 12px' }}
            />
          )}
          <p className="text-[10px] text-nw-500 mt-1">{value.length} chars · {block.id}</p>
        </div>
      )}
    </div>
  )
}
