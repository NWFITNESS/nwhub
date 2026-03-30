import { createClient } from '@/lib/supabase/server'
import { BlogPostEditor } from '@/components/editor/BlogPostEditor'
import type { BlogCategory } from '@/lib/types'

export default async function NewBlogPostPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('id, name, slug')
    .order('name')

  return (
    <>
      <main className="p-10 page-pad">
        <BlogPostEditor categories={(categories ?? []) as BlogCategory[]} />
      </main>
    </>
  )
}
