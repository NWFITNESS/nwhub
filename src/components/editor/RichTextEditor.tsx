'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { useRef, useState } from 'react'
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, Code, Quote, List, ListOrdered,
  Strikethrough, Undo, Redo, Upload, Loader2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronDown,
} from 'lucide-react'
import { TwoColumnBlock } from './extensions/twoColumnBlock'
import { ImageOverlayBlock } from './extensions/imageOverlayBlock'
import { BlockInsertMenu } from './BlockInsertMenu'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  disabled?: boolean
  children: React.ReactNode
}

const FONT_OPTIONS = [
  { label: 'League Spartan', value: null, css: "'League Spartan', sans-serif" },
  { label: 'Inter', value: "'Inter', sans-serif", css: "'Inter', sans-serif" },
  { label: 'Oswald', value: "'Oswald', sans-serif", css: "'Oswald', sans-serif" },
  { label: 'Roboto Slab', value: "'Roboto Slab', serif", css: "'Roboto Slab', serif" },
] as const

function ToolbarButton({ onClick, active, title, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded transition-colors disabled:opacity-40 ${
        active ? 'bg-[#967705]/30 text-[#c9a70a]' : 'text-white/50 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />
}

function FontFamilySelect({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false)
  if (!editor) return null

  const activeFontValue = editor.getAttributes('textStyle').fontFamily ?? null
  const activeOption = FONT_OPTIONS.find((o) => o.value === activeFontValue) ?? FONT_OPTIONS[0]

  function handleSelect(option: typeof FONT_OPTIONS[number]) {
    if (option.value === null) {
      editor!.chain().focus().unsetFontFamily().run()
    } else {
      editor!.chain().focus().setFontFamily(option.value).run()
    }
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
        style={{ fontFamily: activeOption.css }}
      >
        {activeOption.label}
        <ChevronDown size={11} className="opacity-50" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-[#1e1e1e] border border-white/15 rounded-lg shadow-2xl py-1 min-w-[160px]">
            {FONT_OPTIONS.map((option) => {
              const isActive = option.value === activeFontValue
              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#967705]/20 text-[#c9a70a]'
                      : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                  }`}
                  style={{ fontFamily: option.css }}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing…',
  minHeight = 300,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      TwoColumnBlock,
      ImageOverlayBlock,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from === to) { setBubblePos(null); return }
      const domSel = window.getSelection()
      if (!domSel || domSel.rangeCount === 0) { setBubblePos(null); return }
      const rect = domSel.getRangeAt(0).getBoundingClientRect()
      if (rect.width === 0) { setBubblePos(null); return }
      setBubblePos({ top: rect.top - 52, left: rect.left + rect.width / 2 })
    },
    onBlur: () => setBubblePos(null),
    editorProps: {
      attributes: { class: 'tiptap-prose' },
    },
  })

  if (!editor) return null

  function addLink() {
    const url = window.prompt('URL:')
    if (url) editor?.chain().focus().setLink({ href: url }).run()
  }

  function addImageUrl() {
    const url = window.prompt('Image URL:')
    if (url) editor?.chain().focus().setImage({ src: url }).run()
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/media', { method: 'POST', body: form })
      const data = await res.json()
      if (data.public_url) {
        editor?.chain().focus().setImage({ src: data.public_url, alt: file.name }).run()
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="tiptap-editor border border-white/10 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 bg-[#161616] border-b border-white/10">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
          disabled={!editor.can().undo()}
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
          disabled={!editor.can().redo()}
        >
          <Redo size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify size={14} />
        </ToolbarButton>

        <Divider />

        <FontFamilySelect editor={editor} />

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline Code"
        >
          <Code size={14} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link">
          <LinkIcon size={14} />
        </ToolbarButton>

        <ToolbarButton onClick={addImageUrl} active={false} title="Insert Image by URL">
          <ImageIcon size={14} />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          active={false}
          title="Upload Image"
          disabled={uploading}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <Divider />

        <BlockInsertMenu editor={editor} />
      </div>

      {bubblePos && (
        <div
          style={{ position: 'fixed', top: bubblePos.top, left: bubblePos.left, transform: 'translateX(-50%)', zIndex: 50 }}
          className="bg-[#1e1e1e] border border-white/15 rounded-lg shadow-2xl px-2 py-1.5 flex gap-0.5"
          onMouseDown={(e) => e.preventDefault()}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold"
          >
            <Bold size={13} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic"
          >
            <Italic size={13} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough size={13} />
          </ToolbarButton>
          <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Link">
            <LinkIcon size={13} />
          </ToolbarButton>
          <div className="w-px h-4 bg-white/10 mx-0.5 self-center shrink-0" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="H1"
          >
            <Heading1 size={13} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="H2"
          >
            <Heading2 size={13} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="H3"
          >
            <Heading3 size={13} />
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} style={{ '--min-height': `${minHeight}px` } as React.CSSProperties} />
    </div>
  )
}
