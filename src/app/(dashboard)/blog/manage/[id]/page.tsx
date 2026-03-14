import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BlogPostEditor } from '@/components/editor/BlogPostEditor'
import { notFound } from 'next/navigation'
import type { BlogPost, BlogCategory } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('*, category:blog_categories(id, name, slug)')
      .eq('id', id)
      .single(),
    supabase
      .from('blog_categories')
      .select('id, name, slug')
      .order('name'),
  ])

  if (!post) notFound()

  return (
    <>
      <TopBar title={`Blog — ${post.title}`} />
      <main className="p-10 page-pad">
        <BlogPostEditor
          initialPost={post as unknown as BlogPost & { category?: BlogCategory | null }}
          categories={(categories ?? []) as BlogCategory[]}
        />
      </main>
    </>
  )
}
