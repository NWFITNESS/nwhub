import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { BlogListManager } from '@/components/blog/BlogListManager'
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

  return (
    <>
      <TopBar title="Blog" />
      <main className="flex flex-col gap-6 p-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="Blog & Posts"
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
          initialPosts={(posts ?? []) as unknown as (BlogPost & { category?: BlogCategory | null })[]}
          categories={(categories ?? []) as BlogCategory[]}
        />
      </main>
    </>
  )
}
