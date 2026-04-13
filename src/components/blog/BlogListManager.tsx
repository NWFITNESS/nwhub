'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SearchInput } from '@/components/ui/SearchInput'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { ColumnToggle } from '@/components/ui/ColumnToggle'
import { useColumnVisibility } from '@/lib/use-column-visibility'
import { format } from 'date-fns'
import {
  ArrowUpDown, ArrowUp, ArrowDown, Plus, PenLine, Eye,
} from 'lucide-react'
import type { BlogPost, BlogCategory } from '@/lib/types'

type SortKey = 'title' | 'status' | 'category' | 'published_at' | 'created_at'
type SortDir = 'asc' | 'desc'

const COLUMNS = [
  { key: 'status', label: 'Status' },
  { key: 'category', label: 'Category' },
  { key: 'published', label: 'Published' },
]

interface BlogListManagerProps {
  initialPosts: (BlogPost & { category?: BlogCategory | null })[]
  categories: BlogCategory[]
}

export function BlogListManager({ initialPosts, categories }: BlogListManagerProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [posts, setPosts] = useState(initialPosts)
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all')
  const [filterCategory, setFilterCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [toggling, setToggling] = useState<string | null>(null)
  const { visible, toggle } = useColumnVisibility('blog', COLUMNS.map((c) => c.key))

  const gridTemplate = [
    '1fr',
    visible.has('status') ? 'auto' : null,
    visible.has('category') ? 'auto' : null,
    visible.has('published') ? 'auto' : null,
    'auto',
  ].filter(Boolean).join(' ')

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  async function handleToggleStatus(post: BlogPost & { category?: BlogCategory | null }) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    setToggling(post.id)
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null } : p))
    try {
      const res = await fetch(`/api/blog/${post.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
      if (!res.ok) setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)))
      else startTransition(() => router.refresh())
    } finally { setToggling(null) }
  }

  const filtered = useMemo(() => {
    let result = [...posts]
    if (filterStatus !== 'all') result = result.filter((p) => p.status === filterStatus)
    if (filterCategory) result = result.filter((p) => p.category_id === filterCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      let aVal: string | number | null = null, bVal: string | number | null = null
      if (sortKey === 'title') { aVal = a.title; bVal = b.title }
      else if (sortKey === 'status') { aVal = a.status; bVal = b.status }
      else if (sortKey === 'category') { aVal = a.category?.name ?? ''; bVal = b.category?.name ?? '' }
      else if (sortKey === 'published_at') { aVal = a.published_at ?? ''; bVal = b.published_at ?? '' }
      else if (sortKey === 'created_at') { aVal = a.created_at; bVal = b.created_at }
      if (aVal === null || aVal === '') return sortDir === 'asc' ? 1 : -1
      if (bVal === null || bVal === '') return sortDir === 'asc' ? -1 : 1
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
    return result
  }, [posts, filterStatus, filterCategory, search, sortKey, sortDir])

  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status === 'draft').length

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={11} className="text-nw-600" />
    return sortDir === 'asc' ? <ArrowUp size={11} className="text-gold-400" /> : <ArrowDown size={11} className="text-gold-400" />
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <Panel>
        <PanelHeader eyebrow="Stats" title="Blog Overview" />
        <div className="flex items-center gap-6 px-[17px] py-3">
          <div>
            <div className="text-[10px] uppercase text-nw-500 tracking-[1px]">Posts</div>
            <div className="text-[13px] font-medium text-nw-200">{posts.length}</div>
          </div>
          <span className="text-nw-600">·</span>
          <div>
            <div className="text-[10px] uppercase text-nw-500 tracking-[1px]">Published</div>
            <div className="text-[13px] font-medium text-[#4ade80]">{publishedCount}</div>
          </div>
          <span className="text-nw-600">·</span>
          <div>
            <div className="text-[10px] uppercase text-nw-500 tracking-[1px]">Drafts</div>
            <div className="text-[13px] font-medium text-nw-200">{draftCount}</div>
          </div>
        </div>
      </Panel>

      {/* Table Panel */}
      <Panel>
        <PanelHeader eyebrow="Posts" title="All Articles" action={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search posts..."
              className="w-52"
            />
            <div className="flex gap-0.5">
              {(['all', 'published', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-[7px] px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                    filterStatus === s
                      ? 'bg-[rgba(212,160,23,0.15)] text-gold-300 border border-[rgba(212,160,23,0.3)]'
                      : 'text-nw-400 hover:text-nw-200 border border-transparent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-9 rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-[13px] text-nw-200 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            )}
            <ColumnToggle columns={COLUMNS} visible={visible} onToggle={toggle} />
          </div>
        } />

        {/* Desktop table */}
        <div className="hidden md:block">
          {/* Header */}
          <div className="grid gap-4 border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5" style={{ gridTemplateColumns: gridTemplate }}>
            <button onClick={() => handleSort('title')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500 hover:text-nw-300 transition-colors text-left">
              Title <SortIcon col="title" />
            </button>
            {visible.has('status') && (
              <button onClick={() => handleSort('status')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500 hover:text-nw-300 transition-colors">
                Status <SortIcon col="status" />
              </button>
            )}
            {visible.has('category') && (
              <button onClick={() => handleSort('category')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500 hover:text-nw-300 transition-colors">
                Category <SortIcon col="category" />
              </button>
            )}
            {visible.has('published') && (
              <button onClick={() => handleSort('published_at')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500 hover:text-nw-300 transition-colors">
                Published <SortIcon col="published_at" />
              </button>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500">Actions</span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13px] text-nw-500">
              {search || filterStatus !== 'all' || filterCategory ? 'No posts match your filters.' : 'No blog posts yet. Create your first post.'}
            </div>
          ) : (
            filtered.map((post) => (
              <div key={post.id} className="grid items-center gap-4 border-b border-[rgba(255,255,255,0.05)] px-4 py-3 transition-colors hover:bg-[rgba(255,255,255,0.03)]" style={{ gridTemplateColumns: gridTemplate }}>
                <div className="min-w-0">
                  <Link href={`/blog/manage/${post.id}`} className="text-[13px] font-medium text-nw-200 hover:text-gold-300 transition-colors truncate block">
                    {post.title}
                  </Link>
                  {post.slug && <span className="text-[11px] text-nw-500 font-mono">/blog/{post.slug}</span>}
                </div>
                {visible.has('status') && (
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === 'published' ? 'sent' : 'draft'}>{post.status}</Badge>
                    <button
                      onClick={() => handleToggleStatus(post)}
                      disabled={toggling === post.id}
                      title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                      className={`w-8 h-[18px] rounded-[9px] relative transition-colors ${post.status === 'published' ? 'bg-gold-500' : 'bg-nw-600'} ${toggling === post.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white shadow transition-transform ${post.status === 'published' ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>
                )}
                {visible.has('category') && <span className="text-[13px] text-nw-400">{post.category?.name ?? <span className="text-nw-600">—</span>}</span>}
                {visible.has('published') && (
                  <span className="text-[11px] text-nw-500 whitespace-nowrap">
                    {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy') : <span className="text-nw-600">—</span>}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Link href={`/blog/manage/${post.id}`}><Button variant="ghost" size="sm"><PenLine size={13} /> Edit</Button></Link>
                  {post.status === 'published' && post.slug && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm"><Eye size={13} /></Button></a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile card rows */}
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13px] text-nw-500">No posts found.</div>
          ) : (
            filtered.map((post) => (
              <div key={post.id} className="border-b border-[rgba(255,255,255,0.05)] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/blog/manage/${post.id}`} className="text-[13px] font-medium text-nw-200 hover:text-gold-300 transition-colors">
                    {post.title}
                  </Link>
                  <Badge variant={post.status === 'published' ? 'sent' : 'draft'}>{post.status}</Badge>
                </div>
                {post.slug && <p className="text-[11px] text-nw-500 font-mono mb-2">/blog/{post.slug}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-nw-500">
                    {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy') : 'Draft'}
                  </span>
                  <Link href={`/blog/manage/${post.id}`}><Button variant="ghost" size="sm">Edit</Button></Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      {filtered.length > 0 && (
        <p className="text-[11px] text-nw-500 text-right">{filtered.length} of {posts.length} posts</p>
      )}
    </div>
  )
}
