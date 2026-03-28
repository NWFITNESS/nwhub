import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { ContactsTable } from '@/components/contacts/ContactsTable'
import { MobileEnquiriesList } from '@/components/mobile/MobileEnquiriesList'

export default async function EnquiriesPage() {
  const supabase = await createClient()
  const { data: enquiries } = await supabase
    .from('contact_enquiries')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <>
      {/* Mobile layout */}
      <MobileEnquiriesList enquiries={enquiries ?? []} />

      {/* Desktop layout */}
      <div className="hidden lg:block bg-nw-900 min-h-screen">
        <TopBar title="Enquiries" />
        <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
          <PageHeader eyebrow="Admin Panel" title="Contact" titleGold="Enquiries" description={`${enquiries?.length ?? 0} enquiries`} />
          <ContactsTable initialEnquiries={enquiries ?? []} />
        </main>
      </div>
    </>
  )
}
