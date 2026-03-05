'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, Plus, Globe, PenLine, Eye,
} from 'lucide-react'
import type { BlogPost, BlogCategory } from '@/lib/types'

type SortKey = 'title' | 'status' | 'category' | 'published_at' | 'created_at'
type SortDir = 'asc' | 'desc'

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

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  async function handleToggleStatus(post: BlogPost & { category?: BlogCategory | null }) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    setToggling(post.id)

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, status: newStatus, published_at: newStatus === 'published' ? new Date().toISOString() : null }
          : p
      )
    )

    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        // Revert on error
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? post : p))
        )
      } else {
        startTransition(() => router.refresh())
      }
    } finally {
      setToggling(null)
    }
  }

  const filtered = useMemo(() => {
    let result = [...posts]

    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus)
    }
    if (filterCategory) {
      result = result.filter((p) => p.category_id === filterCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      let aVal: string | number | null = null
      let bVal: string | number | null = null

      if (sortKey === 'title') { aVal = a.title; bVal = b.title }
      else if (sortKey === 'status') { aVal = a.status; bVal = b.status }
      else if (sortKey === 'category') { aVal = a.category?.name ?? ''; bVal = b.category?.name ?? '' }
      else if (sortKey === 'published_at') { aVal = a.published_at ?? ''; bVal = b.published_at ?? '' }
      else if (sortKey === 'created_at') { aVal = a.created_at; bVal = b.created_at }

      if (aVal === null || aVal === '') return sortDir === 'asc' ? 1 : -1
      if (bVal === null || bVal === '') return sortDir === 'asc' ? -1 : 1
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })

    return result
  }, [posts, filterStatus, filterCategory, search, sortKey, sortDir])

  const publishedCount = posts.filter((p) => p.status === 'published').length
  const draftCount = posts.filter((p) => p.status === 'draft').length

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown size={12} className="text-white/20" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-[#c9a70a]" />
      : <ArrowDown size={12} className="text-[#c9a70a]" />
  }

  return (
    <div>
      {/* Stats row */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-1.5 text-sm text-white/40">
          <span className="font-semibold text-white">{posts.length}</span> posts
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1.5 text-sm text-green-400/70">
          <Globe size={12} />
          <span className="font-semibold text-green-400">{publishedCount}</span> published
        </div>
        <div className="flex items-center gap-1.5 text-sm text-yellow-400/70">
          <PenLine size={12} />
          <span className="font-semibold text-yellow-400">{draftCount}</span> drafts
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full pl-9 pr-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#967705]/50 transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center rounded-lg border border-white/10 overflow-hidden">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors capitalize ${
                filterStatus === s
                  ? 'bg-[#967705]/20 text-[#c9a70a]'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-[#111111] border border-white/10 rounded-lg text-sm text-white/60 focus:outline-none focus:border-[#967705]/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        )}

        <Link href="/blog/new" className="ml-auto">
          <Button variant="primary" size="sm">
            <Plus size={14} /> New Post
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.08] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-[#161616] border-b border-white/[0.06]">
          <button
            onClick={() => handleSort('title')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-widest hover:text-white/70 transition-colors text-left"
          >
            Title <SortIcon col="title" />
          </button>
          <button
            onClick={() => handleSort('status')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-widest hover:text-white/70 transition-colors"
          >
            Status <SortIcon col="status" />
          </button>
          <button
            onClick={() => handleSort('category')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-widest hover:text-white/70 transition-colors"
          >
            Category <SortIcon col="category" />
          </button>
          <button
            onClick={() => handleSort('published_at')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/40 uppercase tracking-widest hover:text-white/70 transition-colors"
          >
            Published <SortIcon col="published_at" />
          </button>
          <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Actions</span>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-white/30 text-sm">
            {search || filterStatus !== 'all' || filterCategory
              ? 'No posts match your filters.'
              : 'No blog posts yet. Create your first post.'}
          </div>
        ) : (
          filtered.map((post, i) => (
            <div
              key={post.id}
              className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 transition-colors hover:bg-white/[0.02] ${
                i < filtered.length - 1 ? 'border-b border-white/[0.04]' : ''
              }`}
            >
              {/* Title + slug */}
              <div className="min-w-0">
                <Link
                  href={`/blog/${post.id}`}
                  className="font-medium text-white hover:text-[#c9a70a] transition-colors truncate block"
                >
                  {post.title}
                </Link>
                {post.slug && (
                  <span className="text-xs text-white/25 font-mono">/blog/{post.slug}</span>
                )}
              </div>

              {/* Status + quick toggle */}
              <div className="flex items-center gap-2">
                <Badge variant={post.status}>{post.status}</Badge>
                <button
                  onClick={() => handleToggleStatus(post)}
                  disabled={toggling === post.id}
                  title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                  className={`w-8 h-5 rounded-full relative transition-colors ${
                    post.status === 'published'
                      ? 'bg-green-500/70 hover:bg-red-500/50'
                      : 'bg-white/10 hover:bg-green-500/40'
                  } ${toggling === post.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      post.status === 'published' ? 'translate-x-3' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Category */}
              <span className="text-sm text-white/40">
                {post.category?.name ?? <span className="text-white/20">—</span>}
              </span>

              {/* Date */}
              <span className="text-xs text-white/30 whitespace-nowrap">
                {post.published_at
                  ? format(new Date(post.published_at), 'dd MMM yyyy')
                  : <span className="text-white/20">—</span>
                }
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Link href={`/blog/${post.id}`}>
                  <Button variant="ghost" size="sm" className="px-2 py-1.5">
                    <PenLine size={13} />
                  </Button>
                </Link>
                {post.slug && (
                  <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="px-2 py-1.5">
                      <Eye size={13} />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-white/20 mt-3 text-right">
          {filtered.length} of {posts.length} posts
        </p>
      )}
    </div>
  )
}
