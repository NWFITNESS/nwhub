import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { BlogPostEditor } from '@/components/editor/BlogPostEditor'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(id, name, slug)')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <>
      <TopBar title={`Blog — ${post.title}`} />
      <main className="p-6">
        <BlogPostEditor initialPost={post} />
      </main>
    </>
  )
}
