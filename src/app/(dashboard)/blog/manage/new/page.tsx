import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
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
      <TopBar title="Blog — New Post" />
      <main className="p-10" style={{ paddingLeft: '48px', paddingRight: '48px' }}>
        <BlogPostEditor categories={(categories ?? []) as BlogCategory[]} />
      </main>
    </>
  )
}
