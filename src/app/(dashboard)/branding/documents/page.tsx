import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { DocumentsManager } from '@/components/branding/DocumentsManager'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: docs } = await supabase
    .from('media')
    .select('*')
    .in('category', ['document', 'letterhead', 'template', 'pdf'])
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Branding"
        title="Business"
        titleGold="Documents"
        description="Upload and manage business documents, letterheads, and templates"
      />
      <DocumentsManager initialDocs={docs ?? []} />
    </div>
  )
}
