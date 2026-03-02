'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Field, Select } from '@/components/ui/Input'
import { RichTextEditor } from './RichTextEditor'
import { Save, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ui/Modal'
import type { BlogPost } from '@/lib/types'

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface Props {
  initialPost?: BlogPost & { category?: { id: string; name: string; slug: string } | null }
}

export function BlogPostEditor({ initialPost }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(initialPost?.status ?? 'draft')
  const [featuredImageUrl, setFeaturedImageUrl] = useState(initialPost?.featured_image_url ?? '')
  const [tags, setTags] = useState((initialPost?.tags ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!initialPost) setSlug(slugify(value))
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')

    const payload = {
      title: title.trim(),
      slug: slug || slugify(title),
      excerpt: excerpt.trim() || null,
      content,
      featured_image_url: featuredImageUrl.trim() || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      status,
      published_at: status === 'published' ? (initialPost?.published_at ?? new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    }

    let queryError
    if (initialPost) {
      const { error: e } = await supabase.from('blog_posts').update(payload).eq('id', initialPost.id)
      queryError = e
    } else {
      const { error: e } = await supabase.from('blog_posts').insert(payload)
      queryError = e
    }

    setSaving(false)
    if (queryError) {
      setError(queryError.message)
    } else {
      router.push('/blog')
      router.refresh()
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('blog_posts').delete().eq('id', initialPost!.id)
    setDeleting(false)
    setDeleteOpen(false)
    router.push('/blog')
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{initialPost ? 'Edit Post' : 'New Post'}</h2>
        <div className="flex items-center gap-2">
          {initialPost && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            <Save size={14} /> {status === 'published' ? 'Publish' : 'Save Draft'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Field label="Title">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              className="text-lg"
            />
          </Field>
          <Field label="Slug">
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="post-slug" />
          </Field>
          <Field label="Excerpt">
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short description..." />
          </Field>
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Content</label>
            <RichTextEditor content={content} onChange={setContent} placeholder="Write your post..." />
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Field label="Featured Image URL">
            <Input value={featuredImageUrl} onChange={(e) => setFeaturedImageUrl(e.target.value)} placeholder="https://..." />
            {featuredImageUrl && (
              <img src={featuredImageUrl} alt="Preview" className="mt-2 rounded-lg w-full aspect-video object-cover" />
            )}
          </Field>
          <Field label="Tags (comma separated)">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="fitness, training, hyrox" />
          </Field>
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
    </div>
  )
}
