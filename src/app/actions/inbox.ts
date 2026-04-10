'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Mark an email as handled — sets archived=true so it drops off the
 * "Needs Action" filter. The email stays in the DB for history but no
 * longer appears in the active inbox view.
 */
export async function archiveEmail(emailId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('email_classifications')
    .update({ archived: true })
    .eq('id', emailId)
  if (error) throw new Error(`Failed to archive email: ${error.message}`)
  revalidatePath('/inbox')
}

/**
 * Bulk-archive multiple emails at once. Same as archiveEmail but for a
 * list of IDs — one DB call instead of N.
 */
export async function bulkArchiveEmails(emailIds: string[]): Promise<void> {
  if (!emailIds.length) return
  const admin = createAdminClient()
  const { error } = await admin
    .from('email_classifications')
    .update({ archived: true })
    .in('id', emailIds)
  if (error) throw new Error(`Failed to bulk-archive: ${error.message}`)
  revalidatePath('/inbox')
}

/**
 * Un-archive an email — sets archived=false. Used if you accidentally
 * dismiss something you still need to action.
 */
export async function unarchiveEmail(emailId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('email_classifications')
    .update({ archived: false })
    .eq('id', emailId)
  if (error) throw new Error(`Failed to unarchive email: ${error.message}`)
  revalidatePath('/inbox')
}
