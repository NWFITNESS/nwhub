import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import type { BlogPost, BlogCategory } from '@/lib/types'

export const revalidate = 60

export default async function PublicBlogPage() {
  const supabase = await createClient()

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('*, category:blog_categories(id, name, slug)')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
    supabase.from('blog_categories').select('id, name, slug').order('name'),
  ])

  const typedPosts = (posts ?? []) as unknown as (BlogPost & { category?: BlogCategory | null })[]
  const typedCategories = (categories ?? []) as BlogCategory[]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero header */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Training Insights</h1>
        <div className="w-16 h-1 bg-[#967705] rounded-full mb-4" />
        <p className="text-white/50 text-lg max-w-xl">
          Expert advice, training tips, and stories from the gym floor.
        </p>

        {/* Category filter links */}
        {typedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            <Link
              href="/blog"
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#967705]/40 text-[#c9a70a] hover:bg-[#967705]/10 transition-colors"
            >
              All
            </Link>
            {typedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-[#967705]/40 hover:text-[#c9a70a] transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Post grid */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        {typedPosts.length === 0 ? (
          <div className="text-center py-24 text-white/30">No posts published yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {typedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-xl overflow-hidden border border-white/[0.07] bg-[#111111] hover:border-[#967705]/40 hover:shadow-[0_0_20px_rgba(150,119,5,0.15)] transition-all duration-300"
              >
                {/* Featured image */}
                <div className="aspect-video overflow-hidden">
                  {post.featured_image_url ? (
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#967705]/30 to-[#161616] flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#967705]/20 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-[#967705]/40" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  {post.category && (
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-[#c9a70a] border border-[#967705]/30 px-2 py-0.5 rounded-full mb-3">
                      {post.category.name}
                    </span>
                  )}
                  <h2 className="font-semibold text-white text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#c9a70a] transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-white/40 leading-relaxed line-clamp-2 mb-3">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="text-xs text-white/25">
                    {post.published_at
                      ? format(new Date(post.published_at), 'd MMM yyyy')
                      : format(new Date(post.created_at), 'd MMM yyyy')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
