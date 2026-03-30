import { AIEmailCreatorClient } from '@/components/mailchimp/AIEmailCreatorClient'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function AIEmailCreatorPage() {
  return (
    <>
      <main className="page-pad flex flex-col gap-6 py-6 lg:py-8 min-h-[calc(100vh-5rem)]">
        <AIEmailCreatorClient />
      </main>
    </>
  )
}
