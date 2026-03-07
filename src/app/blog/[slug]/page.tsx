import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import type { BlogPost, BlogCategory } from '@/lib/types'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export default async function PublicPostPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(id, name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const typedPost = post as unknown as BlogPost & { category?: BlogCategory | null }
  const readTime = estimateReadTime(typedPost.content ?? '')
  const publishedDate = typedPost.published_at
    ? format(new Date(typedPost.published_at), 'd MMMM yyyy')
    : format(new Date(typedPost.created_at), 'd MMMM yyyy')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <div className="relative w-full" style={{ aspectRatio: '21/9' }}>
        {typedPost.featured_image_url ? (
          <img
            src={typedPost.featured_image_url}
            alt={typedPost.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#967705]/20 to-[#0a0a0a]" />
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
            {typedPost.title}
          </h1>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {typedPost.category && (
            <span className="text-xs font-semibold uppercase tracking-widest text-[#c9a70a] border border-[#967705]/40 px-2.5 py-1 rounded-full">
              {typedPost.category.name}
            </span>
          )}
          {typedPost.author && (
            <>
              <span className="text-sm text-white/40">By {typedPost.author}</span>
              <span className="text-white/20">·</span>
            </>
          )}
          <span className="text-sm text-white/40">{publishedDate}</span>
          <span className="text-white/20">·</span>
          <span className="text-sm text-white/40">{readTime} min read</span>
        </div>

        {/* Excerpt */}
        {typedPost.excerpt && (
          <blockquote className="border-l-2 border-[#967705] pl-5 mb-8">
            <p className="text-lg text-white/60 leading-relaxed italic">{typedPost.excerpt}</p>
          </blockquote>
        )}

        {/* Body content */}
        {typedPost.content && (
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: typedPost.content }}
          />
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.07] flex items-center justify-between">
          <Link
            href="/blog"
            className="text-sm text-[#c9a70a] hover:text-white transition-colors flex items-center gap-1.5"
          >
            ← Back to Blog
          </Link>
          {typedPost.tags && typedPost.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {typedPost.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-white/30 border border-white/10 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
