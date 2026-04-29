import { getAllBlocks } from '@/lib/kids/queries'
import RegisterPageClient from './RegisterPageClient'

export const dynamic = 'force-dynamic'

export default async function KidsRegisterPage() {
  const blocks = await getAllBlocks()
  const activeBlock = blocks.find((b) => b.is_active) ?? blocks[0] ?? null

  return <RegisterPageClient blocks={blocks} initialBlockId={activeBlock?.id ?? null} />
}
