import { NextResponse } from 'next/server'
import { outlookFetch, getOutlookTokens } from '@/lib/outlook'
import { requireAuth } from '@/lib/auth-guard'

// GET — debug the Outlook connection
export async function GET() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const tokens = await getOutlookTokens()
  if (!tokens) return NextResponse.json({ error: 'Not connected', connected: false })

  const debug: Record<string, unknown> = { connected: true, email: tokens.email }

  // Check /me profile
  try {
    const meRes = await outlookFetch('/me?$select=displayName,mail,userPrincipalName')
    if (meRes.ok) {
      debug.profile = await meRes.json()
    } else {
      debug.profile_error = `${meRes.status}: ${await meRes.text().catch(() => '')}`
    }
  } catch (e) { debug.profile_error = String(e) }

  // Check mail folders
  try {
    const foldersRes = await outlookFetch('/me/mailFolders?$select=displayName,totalItemCount,unreadItemCount&$top=10')
    if (foldersRes.ok) {
      debug.folders = (await foldersRes.json()).value
    } else {
      debug.folders_error = `${foldersRes.status}: ${await foldersRes.text().catch(() => '')}`
    }
  } catch (e) { debug.folders_error = String(e) }

  // Try fetching messages from inbox
  try {
    const msgRes = await outlookFetch('/me/mailFolders/inbox/messages?$top=5&$select=id,subject,from,receivedDateTime&$orderby=receivedDateTime desc')
    if (msgRes.ok) {
      const data = await msgRes.json()
      debug.inbox_messages = data.value?.length ?? 0
      debug.inbox_sample = (data.value ?? []).map((m: { subject?: string; from?: { emailAddress?: { address?: string } }; receivedDateTime?: string }) => ({
        subject: m.subject?.slice(0, 50),
        from: m.from?.emailAddress?.address,
        date: m.receivedDateTime,
      }))
    } else {
      debug.inbox_error = `${msgRes.status}: ${await msgRes.text().catch(() => '')}`
    }
  } catch (e) { debug.inbox_error = String(e) }

  return NextResponse.json(debug)
}
