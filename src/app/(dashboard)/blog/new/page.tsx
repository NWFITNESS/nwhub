import { TopBar } from '@/components/layout/TopBar'
import { BlogPostEditor } from '@/components/editor/BlogPostEditor'

export default function NewBlogPostPage() {
  return (
    <>
      <TopBar title="Blog — New Post" />
      <main className="p-6">
        <BlogPostEditor />
      </main>
    </>
  )
}
