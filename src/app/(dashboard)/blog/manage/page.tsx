import { createClient } from '@/lib/supabase/server'
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

  const typedPosts = (posts ?? []) as unknown as (BlogPost & { category?: BlogCategory | null })[]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Content"
        title="Blog"
        titleGold="& Posts"
        actions={
          <Link href="/blog/manage/new">
            <Button variant="gold" size="sm">
              <Plus size={14} /> New Post
            </Button>
          </Link>
        }
      />
      <BlogListManager
        initialPosts={typedPosts}
        categories={(categories ?? []) as BlogCategory[]}
      />
    </div>
  )
}
