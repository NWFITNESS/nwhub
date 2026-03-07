import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BlogListManager } from '@/components/blog/BlogListManager'
import type { BlogPost, BlogCategory } from '@/lib/types'

export default async function BlogManagePage() {
  const supabase = await createClient()

  const [{ data: posts }, { data: categories }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('*, category:blog_categories(id, name, slug)')
      .order('created_at', { ascending: false }),
    supabase
      .from('blog_categories')
      .select('id, name, slug')
      .order('name'),
  ])

  return (
    <>
      <TopBar title="Blog" />
      <main className="p-10">
        <BlogListManager
          initialPosts={(posts ?? []) as unknown as (BlogPost & { category?: BlogCategory | null })[]}
          categories={(categories ?? []) as BlogCategory[]}
        />
      </main>
    </>
  )
}
