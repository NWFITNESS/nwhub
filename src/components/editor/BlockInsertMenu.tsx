'use client'

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { LayoutTemplate } from 'lucide-react'

interface Props {
  editor: Editor
}

export function BlockInsertMenu({ editor }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function insertTwoColumn() {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'twoColumnBlock',
        attrs: { imageUrl: '', imageAlt: '', layout: '50/50', imagePosition: 'right' },
        content: [{ type: 'paragraph' }],
      })
      .run()
    setOpen(false)
  }

  function insertImageOverlay() {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'imageOverlayBlock',
        attrs: { imageUrl: '', overlayOpacity: 'medium' },
        content: [{ type: 'paragraph' }],
      })
      .run()
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Insert Layout Block"
        className={`p-1.5 rounded transition-colors ${
          open
            ? 'bg-[#967705]/30 text-[#c9a70a]'
            : 'text-white/50 hover:text-white hover:bg-white/10'
        }`}
      >
        <LayoutTemplate size={14} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#1e1e1e] border border-white/15 rounded-lg shadow-2xl overflow-hidden min-w-[210px]">
          <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30 border-b border-white/10">
            Insert Layout Block
          </p>

          <button
            type="button"
            onClick={insertTwoColumn}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/[0.06] transition-colors text-left"
          >
            <div className="w-10 h-7 flex gap-0.5 shrink-0 rounded overflow-hidden">
              <div className="flex-1 bg-white/25 rounded-sm" />
              <div className="flex-1 bg-white/10 rounded-sm" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Two Columns</p>
              <p className="text-xs text-white/40">Text + Image</p>
            </div>
          </button>

          <div className="border-t border-white/[0.06]" />

          <button
            type="button"
            onClick={insertImageOverlay}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/[0.06] transition-colors text-left"
          >
            <div className="w-10 h-7 bg-white/10 rounded overflow-hidden relative shrink-0">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-1 left-1 right-1 h-1 bg-white/50 rounded-sm" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Image Overlay</p>
              <p className="text-xs text-white/40">Text on photo</p>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
