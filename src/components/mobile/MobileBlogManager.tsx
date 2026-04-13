'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PenLine, ChevronRight } from 'lucide-react'
import { MobileAppBar } from './MobileAppBar'
import { MobileSearch } from './MobileSearch'
import { FilterChips } from './FilterChips'
import { FAB } from './FAB'
import type { BlogPost, BlogCategory } from '@/lib/types'

type PostWithCategory = BlogPost & { category?: BlogCategory | null }

interface Props {
  posts: PostWithCategory[]
}

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft',     label: 'Draft' },
]

export function MobileBlogManager({ posts }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const router = useRouter()

  const filtered = posts.filter((p) => {
    const matchSearch = search === '' || p.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true : p.status === filter
    return matchSearch && matchFilter
  })

  async function togglePublished(post: PostWithCategory) {
    await fetch(`/api/blog/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: post.status !== 'published' }),
    })
    router.refresh()
  }

  return (
    <div className="lg:hidden flex flex-col bg-nw-950 min-h-[100dvh]">
      <MobileAppBar
        title="Blog"
        count={posts.length}
        actions={
          <Link
            href="/blog/manage/new"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-nw-400 active:bg-nw-800"
          >
            <PenLine size={18} className="text-gold-300" />
          </Link>
        }
      />
      <MobileSearch placeholder="Search posts…" value={search} onChange={setSearch} />
      <FilterChips filters={FILTERS} active={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto pb-[calc(56px+env(safe-area-inset-bottom)+60px)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[14px] text-nw-500">No posts found</p>
          </div>
        ) : (
          <div className="mx-3 mt-2 flex flex-col gap-2">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="bg-nw-900 rounded-xl border border-[rgba(255,255,255,0.09)] px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-nw-100 leading-snug">{post.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-600/10 border border-gold-600/20 text-gold-300">
                          {post.category.name}
                        </span>
                      )}
                      <span className="text-xs font-medium text-nw-400">
                        {new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                    <button
                      onClick={() => togglePublished(post)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors ${
                        post.status === 'published'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 active:bg-green-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20 active:bg-amber-500/20'
                      }`}
                    >
                      {post.status === 'published' ? 'Live' : 'Draft'}
                    </button>
                    <Link
                      href={`/blog/manage?edit=${post.id}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-nw-500 active:bg-nw-800"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FAB label="New Post" onClick={() => router.push('/blog/manage/new')} />
    </div>
  )
}
