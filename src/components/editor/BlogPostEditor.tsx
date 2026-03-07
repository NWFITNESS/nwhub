'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field, Select } from '@/components/ui/Input'
import { RichTextEditor } from './RichTextEditor'
import {
  Save, Trash2, Globe, ImagePlus, X, Loader2, ChevronDown, ChevronUp, Eye,
} from 'lucide-react'
import { ConfirmModal } from '@/components/ui/Modal'
import type { BlogPost, BlogCategory } from '@/lib/types'

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface Props {
  initialPost?: BlogPost & { category?: BlogCategory | null }
  categories: BlogCategory[]
}

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  content: string
  featuredImageUrl: string
  categoryName?: string
  excerpt: string
  author: string
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// ─── Phone frame component ─────────────────────────────────────────────────
function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      style={{
        transition: 'opacity 500ms ease, transform 500ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(16px)',
      }}
    >
      {/* Phone shell */}
      <div
        style={{
          width: 393,
          border: '11px solid #1c1c1e',
          borderRadius: 54,
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.05), 0 32px 80px rgba(0,0,0,0.8)',
          background: '#0a0a0a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Volume buttons (left) */}
        <div style={{
          position: 'absolute', left: -14, top: 120,
          width: 4, height: 32, background: '#2a2a2c', borderRadius: '2px 0 0 2px',
        }} />
        <div style={{
          position: 'absolute', left: -14, top: 164,
          width: 4, height: 32, background: '#2a2a2c', borderRadius: '2px 0 0 2px',
        }} />
        {/* Power button (right) */}
        <div style={{
          position: 'absolute', right: -14, top: 140,
          width: 4, height: 64, background: '#2a2a2c', borderRadius: '0 2px 2px 0',
        }} />

        {/* Screen */}
        <div
          style={{
            height: 844,
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 44,
            background: '#0a0a0a',
          }}
        >
          {/* Status bar + Dynamic Island */}
          <div style={{ flexShrink: 0, paddingTop: 16, paddingBottom: 8, position: 'relative', zIndex: 10 }}>
            {/* Dynamic Island */}
            <div style={{
              margin: '0 auto',
              width: 126, height: 37,
              background: '#000',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }} />
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </div>

          {/* Home indicator */}
          <div style={{
            flexShrink: 0,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBottom: 8,
          }}>
            <div style={{
              width: 134, height: 5,
              background: 'rgba(255,255,255,0.3)',
              borderRadius: 999,
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Post content (shared between desktop + mobile) ────────────────────────
function PostContent({
  title,
  content,
  featuredImageUrl,
  categoryName,
  excerpt,
  author,
  mobile,
}: {
  title: string
  content: string
  featuredImageUrl: string
  categoryName?: string
  excerpt: string
  author: string
  mobile?: boolean
}) {
  const readTime = estimateReadTime(content)
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="bg-[#0a0a0a] text-white min-h-full">
      {/* Hero */}
      <div className="relative w-full" style={{ aspectRatio: mobile ? '9/10' : '21/9' }}>
        {featuredImageUrl ? (
          <img src={featuredImageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#967705]/20 to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <h1 className={`font-bold text-white leading-tight drop-shadow-lg ${mobile ? 'text-2xl' : 'text-4xl md:text-5xl'}`}>
            {title || 'Untitled Post'}
          </h1>
        </div>
      </div>

      {/* Body */}
      <div className={`mx-auto px-6 py-10 ${mobile ? '' : 'max-w-3xl'}`}>
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {categoryName && (
            <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a70a] border border-[#967705]/40 px-2.5 py-1 rounded-full">
              {categoryName}
            </span>
          )}
          {author && (
            <>
              <span className="text-sm text-white/40">By {author}</span>
              <span className="text-white/20">·</span>
            </>
          )}
          <span className="text-sm text-white/40">{today}</span>
          <span className="text-white/20">·</span>
          <span className="text-sm text-white/40">{readTime} min read</span>
        </div>

        {/* Excerpt */}
        {excerpt && (
          <blockquote className="border-l-2 border-[#967705] pl-5 mb-8">
            <p className="text-lg text-white/60 leading-relaxed italic">{excerpt}</p>
          </blockquote>
        )}

        {/* Body HTML */}
        <div className="post-content" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  )
}

// ─── Preview modal ─────────────────────────────────────────────────────────
function PreviewModal({ open, onClose, title, content, featuredImageUrl, categoryName, excerpt, author }: PreviewModalProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const postProps = { title, content, featuredImageUrl, categoryName, excerpt, author }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050505]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-semibold text-[#c9a70a] uppercase tracking-widest">
            PREVIEW — this is how your post looks on the site
          </span>
          <div className="flex items-center rounded-md border border-white/10 overflow-hidden">
            {(['desktop', 'mobile'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  device === d
                    ? 'bg-[#967705]/20 text-[#c9a70a]'
                    : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <X size={15} /> Close
        </button>
      </div>

      {/* Preview area */}
      {device === 'desktop' ? (
        <div className="flex-1 overflow-y-auto">
          <PostContent {...postProps} mobile={false} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-4">
          <PhoneFrame>
            <PostContent {...postProps} mobile={true} />
          </PhoneFrame>
        </div>
      )}
    </div>
  )
}

// ─── Main editor ───────────────────────────────────────────────────────────
export function BlogPostEditor({ initialPost, categories }: Props) {
  const router = useRouter()

  // Core fields
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [categoryId, setCategoryId] = useState(initialPost?.category_id ?? '')
  const [tags, setTags] = useState((initialPost?.tags ?? []).join(', '))
  const [author, setAuthor] = useState(initialPost?.author ?? '')

  // Featured image
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialPost?.featured_image_url ?? '')
  const [imageUploading, setImageUploading] = useState(false)
  const featuredImageRef = useRef<HTMLInputElement>(null)

  // SEO
  const [seoOpen, setSeoOpen] = useState(false)
  const [seoTitle, setSeoTitle] = useState(initialPost?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(initialPost?.seo_description ?? '')

  // UI state
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!initialPost) setSlug(slugify(value))
  }

  function buildPayload(status: 'draft' | 'published') {
    return {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      excerpt: excerpt.trim() || null,
      content,
      featured_image_url: featuredImageUrl.trim() || null,
      category_id: categoryId || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      author: author.trim() || null,
      status,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      published_at: initialPost?.published_at ?? null,
    }
  }

  async function handleSave(targetStatus: 'draft' | 'published') {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(targetStatus)
    setError('')

    const payload = buildPayload(targetStatus)

    let res: Response
    if (initialPost) {
      res = await fetch(`/api/blog/${initialPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setSaving(null)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong')
      return
    }

    router.push('/blog/manage')
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    await fetch(`/api/blog/${initialPost!.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteOpen(false)
    router.push('/blog/manage')
    router.refresh()
  }

  async function handleFeaturedImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setImageUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/media', { method: 'POST', body: form })
      const data = await res.json()
      if (data.public_url) setFeaturedImageUrl(data.public_url)
    } finally {
      setImageUploading(false)
    }
  }

  const currentStatus = initialPost?.status ?? 'draft'
  const isPublished = currentStatus === 'published'
  const categoryName = categories.find((c) => c.id === categoryId)?.name

  return (
    <div className="max-w-none pb-16">
      {/* Sticky top action bar */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/[0.07] -mx-6 px-6 py-3 mb-6 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title…"
            className="w-full bg-transparent text-lg font-semibold text-white placeholder-white/20 outline-none border-none"
          />
          {initialPost && (
            <p className="text-xs text-white/25 mt-0.5">
              {isPublished ? 'Published' : 'Draft'} · Last saved {new Date(initialPost.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {initialPost && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={14} /> Preview
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSave('draft')}
            loading={saving === 'draft'}
            disabled={saving !== null}
          >
            <Save size={14} /> Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSave('published')}
            loading={saving === 'published'}
            disabled={saving !== null}
          >
            <Globe size={14} /> {isPublished ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2">
          <X size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Main editor column */}
        <div className="flex-1 min-w-0 space-y-5">
          <Field label="Slug">
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-sm shrink-0">/blog/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="post-slug"
                className="font-mono text-sm"
              />
            </div>
          </Field>

          <Field label="Excerpt">
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary shown in listings and previews…"
              className="min-h-[80px]"
            />
          </Field>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-1.5">Body</label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Write your post…"
              minHeight={500}
            />
          </div>

          {/* SEO accordion */}
          <div className="border border-white/[0.08] rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setSeoOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#161616] text-sm font-medium text-white/60 hover:text-white/80 transition-colors"
            >
              <span>SEO Meta</span>
              {seoOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {seoOpen && (
              <div className="px-4 py-4 space-y-4 bg-[#111111]">
                <Field label="SEO Title">
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || 'Page title for search engines'}
                    maxLength={60}
                  />
                  <p className="text-xs text-white/25 mt-1">{seoTitle.length}/60 chars</p>
                </Field>
                <Field label="Meta Description">
                  <Textarea
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={excerpt || 'Description shown in search results…'}
                    maxLength={160}
                    className="min-h-[70px]"
                  />
                  <p className="text-xs text-white/25 mt-1">{seoDescription.length}/160 chars</p>
                </Field>
                {/* Live SERP preview */}
                {(seoTitle || title) && (
                  <div className="rounded-lg border border-white/[0.06] p-3 bg-white/[0.02]">
                    <p className="text-xs text-white/25 mb-2 uppercase tracking-widest">Search preview</p>
                    <p className="text-[#8ab4f8] text-sm font-medium leading-tight truncate">
                      {seoTitle || title}
                    </p>
                    <p className="text-[#34a853] text-xs mt-0.5">northernwarrior.co.uk/blog/{slug || 'your-post-slug'}</p>
                    <p className="text-white/40 text-xs mt-1 line-clamp-2">
                      {seoDescription || excerpt || 'Add a meta description to preview it here.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 shrink-0 space-y-5">
          {/* Status + details */}
          <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 space-y-4">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">Details</p>

            <Field label="Status">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${
                isPublished
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-400' : 'bg-yellow-400'}`} />
                {isPublished ? 'Published' : 'Draft'}
              </div>
            </Field>

            <Field label="Category">
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </Field>

            <Field label="Tags">
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="fitness, hyrox, training"
              />
              <p className="text-xs text-white/25 mt-1">Comma separated</p>
            </Field>

            <Field label="Published by">
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Northern Warrior"
              />
            </Field>
          </div>

          {/* Featured image */}
          <div className="rounded-xl border border-white/[0.08] bg-[#111111] p-4 space-y-3">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">Featured Image</p>

            {featuredImageUrl ? (
              <div className="relative group">
                <img
                  src={featuredImageUrl}
                  alt="Featured"
                  className="w-full aspect-video object-cover rounded-lg border border-white/10"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => featuredImageRef.current?.click()}
                    className="px-2.5 py-1.5 bg-[#967705] text-black text-xs font-semibold rounded-md hover:bg-[#b08e06] transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeaturedImageUrl('')}
                    className="px-2.5 py-1.5 bg-red-600/80 text-white text-xs font-semibold rounded-md hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => featuredImageRef.current?.click()}
                disabled={imageUploading}
                className="w-full aspect-video border-2 border-dashed border-white/[0.1] rounded-lg flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/50 hover:border-white/20 transition-colors"
              >
                {imageUploading
                  ? <Loader2 size={20} className="animate-spin" />
                  : <ImagePlus size={20} />
                }
                <span className="text-xs">{imageUploading ? 'Uploading…' : 'Upload image'}</span>
              </button>
            )}

            {imageUploading && (
              <div className="flex items-center gap-2 text-xs text-white/30">
                <Loader2 size={12} className="animate-spin" /> Uploading to storage…
              </div>
            )}

            <Field label="Or paste URL">
              <Input
                value={featuredImageUrl}
                onChange={(e) => setFeaturedImageUrl(e.target.value)}
                placeholder="https://…"
                className="text-xs"
              />
            </Field>

            <input
              ref={featuredImageRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFeaturedImageUpload}
            />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${title}"? This cannot be undone.`}
        confirmLabel="Delete Post"
        loading={deleting}
      />

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        content={content}
        featuredImageUrl={featuredImageUrl}
        categoryName={categoryName}
        excerpt={excerpt}
        author={author}
      />
    </div>
  )
}
