'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { Panel, PanelHeader } from '@/components/ui/Card'
import { PageStatCard } from '@/components/ui/PageStatCard'
import { ColumnToggle } from '@/components/ui/ColumnToggle'
import { useColumnVisibility } from '@/lib/use-column-visibility'
import { format } from 'date-fns'
import {
  ArrowUpDown, ArrowUp, ArrowDown, PenLine, Eye, FileText, CheckCircle, Clock,
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

  // Most recent post
  const lastPublished = posts.filter(p => p.published_at).sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))[0]
  const lastPublishedLabel = lastPublished?.published_at ? format(new Date(lastPublished.published_at), 'dd MMM yyyy') : 'Never'

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-nw-600" />
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-gold-400" /> : <ArrowDown size={12} className="text-gold-400" />
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PageStatCard label="Total Posts" value={posts.length} sub="All articles" icon={<FileText size={14} className="text-nw-200" />} />
        <PageStatCard label="Published" value={publishedCount} sub="Live on site" color="#22c55e" icon={<CheckCircle size={14} className="text-green-400" />} />
        <PageStatCard label="Drafts" value={draftCount} sub="In progress" color="#f59e0b" icon={<Clock size={14} className="text-amber-400" />} />
        <PageStatCard label="Last Published" value={lastPublishedLabel} sub={lastPublished?.title?.slice(0, 30) ?? ''} gold icon={<Eye size={14} className="text-gold-400" />} />
      </div>

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
            <div className="flex gap-1 rounded-xl bg-nw-800 border border-[rgba(255,255,255,0.06)]" style={{ padding: 4 }}>
              {(['all', 'published', 'draft'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="rounded-lg capitalize transition-all"
                  style={{
                    padding: '5px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    background: filterStatus === s ? 'rgba(201,167,10,0.12)' : 'transparent',
                    color: filterStatus === s ? '#C9A70A' : 'rgba(255,255,255,0.4)',
                    border: filterStatus === s ? '1px solid rgba(201,167,10,0.2)' : '1px solid transparent',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-9 rounded-lg border border-[rgba(255,255,255,0.08)] bg-nw-800 text-nw-200 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
                style={{ padding: '0 12px', fontSize: 13 }}
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
          <div className="grid gap-4 border-b border-[rgba(255,255,255,0.06)]" style={{ gridTemplateColumns: gridTemplate, padding: '10px 20px' }}>
            <button onClick={() => handleSort('title')} className="flex items-center gap-1.5 text-nw-500 hover:text-nw-300 transition-colors text-left" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Title <SortIcon col="title" />
            </button>
            {visible.has('status') && (
              <button onClick={() => handleSort('status')} className="flex items-center gap-1.5 text-nw-500 hover:text-nw-300 transition-colors" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Status <SortIcon col="status" />
              </button>
            )}
            {visible.has('category') && (
              <button onClick={() => handleSort('category')} className="flex items-center gap-1.5 text-nw-500 hover:text-nw-300 transition-colors" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Category <SortIcon col="category" />
              </button>
            )}
            {visible.has('published') && (
              <button onClick={() => handleSort('published_at')} className="flex items-center gap-1.5 text-nw-500 hover:text-nw-300 transition-colors" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Published <SortIcon col="published_at" />
              </button>
            )}
            <span className="text-nw-500" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ padding: '48px 20px' }}>
              <FileText size={32} className="text-nw-600 mb-3" />
              <p className="text-nw-400" style={{ fontSize: 14 }}>
                {search || filterStatus !== 'all' || filterCategory ? 'No posts match your filters.' : 'No blog posts yet. Create your first post.'}
              </p>
            </div>
          ) : (
            filtered.map((post) => (
              <div key={post.id} className="grid items-center gap-4 border-b border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[rgba(255,255,255,0.02)]" style={{ gridTemplateColumns: gridTemplate, padding: '14px 20px' }}>
                <div className="min-w-0">
                  <Link href={`/blog/manage/${post.id}`} className="text-nw-100 hover:text-gold-300 transition-colors truncate block" style={{ fontSize: 15, fontWeight: 500 }}>
                    {post.title}
                  </Link>
                  {post.slug && <span className="text-nw-500 font-mono" style={{ fontSize: 12 }}>/blog/{post.slug}</span>}
                </div>
                {visible.has('status') && (
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === 'published' ? 'sent' : 'draft'}>{post.status}</Badge>
                    <button
                      onClick={() => handleToggleStatus(post)}
                      disabled={toggling === post.id}
                      title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                      className={`w-9 h-5 rounded-full relative transition-colors ${post.status === 'published' ? 'bg-gold-500' : 'bg-nw-600'} ${toggling === post.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                      <span className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${post.status === 'published' ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                    </button>
                  </div>
                )}
                {visible.has('category') && <span className="text-nw-300" style={{ fontSize: 14 }}>{post.category?.name ?? <span className="text-nw-600">—</span>}</span>}
                {visible.has('published') && (
                  <span className="text-nw-400 whitespace-nowrap" style={{ fontSize: 13, fontWeight: 500 }}>
                    {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy') : <span className="text-nw-600">—</span>}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Link href={`/blog/manage/${post.id}`}><Button variant="ghost" size="sm"><PenLine size={14} /> Edit</Button></Link>
                  {post.status === 'published' && post.slug && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm"><Eye size={14} /></Button></a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile card rows */}
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ padding: '48px 20px' }}>
              <FileText size={32} className="text-nw-600 mb-3" />
              <p className="text-nw-400" style={{ fontSize: 14 }}>No posts found.</p>
            </div>
          ) : (
            filtered.map((post) => (
              <div key={post.id} className="border-b border-[rgba(255,255,255,0.04)]" style={{ padding: 20 }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link href={`/blog/manage/${post.id}`} className="text-nw-100 hover:text-gold-300 transition-colors" style={{ fontSize: 15, fontWeight: 500 }}>
                    {post.title}
                  </Link>
                  <Badge variant={post.status === 'published' ? 'sent' : 'draft'}>{post.status}</Badge>
                </div>
                {post.slug && <p className="text-nw-500 font-mono mb-2" style={{ fontSize: 12 }}>/blog/{post.slug}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-nw-400" style={{ fontSize: 13, fontWeight: 500 }}>
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
        <p className="text-nw-400 text-right" style={{ fontSize: 13, fontWeight: 500 }}>{filtered.length} of {posts.length} posts</p>
      )}
    </div>
  )
}
