import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { BlogListManager } from '@/components/blog/BlogListManager'
import { MobileBlogManager } from '@/components/mobile/MobileBlogManager'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'
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

  const totalPosts = posts?.length ?? 0
  const typedPosts = (posts ?? []) as unknown as (BlogPost & { category?: BlogCategory | null })[]

  return (
    <>
      <MobileBlogManager posts={typedPosts} />

      <div className="hidden lg:block bg-nw-900 min-h-screen">
        <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
          <PageHeader
            eyebrow="Admin Panel"
            title="Blog"
            titleGold="& Posts"
            description={`${totalPosts} post${totalPosts !== 1 ? 's' : ''}`}
            actions={
              <Link href="/blog/manage/new">
                <Button variant="primary" size="sm">
                  <Plus size={14} /> New Post
                </Button>
              </Link>
            }
          />
          <BlogListManager
            initialPosts={typedPosts}
            categories={(categories ?? []) as BlogCategory[]}
          />
        </main>
      </div>
    </>
  )
}
