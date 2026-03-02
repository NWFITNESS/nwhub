import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import type { BlogPost } from '@/lib/types'

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(name)')
    .order('created_at', { ascending: false })

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row: Record<string, unknown>) => (
        <Link href={`/blog/${row.id}`} className="font-medium text-white hover:text-[#c9a70a] transition-colors">
          {String(row.title)}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.status as 'draft' | 'published'}>{String(row.status)}</Badge>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row: Record<string, unknown>) => {
        const cat = row.category as { name: string } | null
        return <span className="text-white/50">{cat?.name ?? '—'}</span>
      },
    },
    {
      key: 'published_at',
      label: 'Published',
      render: (row: Record<string, unknown>) => (
        <span className="text-white/40 text-xs">
          {row.published_at ? format(new Date(String(row.published_at)), 'dd MMM yyyy') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2 justify-end">
          <Link href={`/blog/${row.id}`}>
            <Button variant="ghost" size="sm">Edit</Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <>
      <TopBar
        title="Blog"
        actions={
          <Link href="/blog/new">
            <Button variant="primary" size="sm">
              <Plus size={14} /> New Post
            </Button>
          </Link>
        }
      />
      <main className="p-6">
        <PageHeader
          title="Blog Posts"
          description={`${posts?.length ?? 0} posts`}
          actions={
            <Link href="/blog/new">
              <Button variant="primary" size="sm">
                <Plus size={14} /> New Post
              </Button>
            </Link>
          }
        />
        <Table
          columns={columns}
          data={(posts ?? []) as unknown as Record<string, unknown>[]}
          emptyMessage="No blog posts yet. Create your first post."
        />
      </main>
    </>
  )
}
