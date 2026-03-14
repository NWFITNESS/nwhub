import { createAdminClient } from '@/lib/supabase/admin'
import { TopBar } from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { AiChatDashboard } from '@/components/chat/AiChatDashboard'
import { DEFAULT_CHAT_SETTINGS } from '@/lib/chat-defaults'
import type { ChatSettings, ChatSession } from '@/lib/types'

export default async function AiChatPage() {
  const supabase = createAdminClient()

  const [{ data: settingsData }, { data: sessionsData }] = await Promise.all([
    supabase
      .from('global_settings')
      .select('value')
      .eq('key', 'chat_settings')
      .single(),
    supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const rawSettings = settingsData?.value as Partial<ChatSettings> | null
  const settings: ChatSettings = {
    ...DEFAULT_CHAT_SETTINGS,
    ...(rawSettings ?? {}),
    // Mask API key before passing to client component
    api_key: rawSettings?.api_key ? '••••••••' : '',
  }

  const sessions = (sessionsData ?? []) as ChatSession[]

  return (
    <>
      <TopBar title="AI Chat" />
      <main className="flex flex-col gap-6 p-4 lg:p-8 min-h-[calc(100vh-5rem)]">
        <PageHeader
          title="AI Chat Widget"
          description="Manage the public chat assistant, edit the system prompt, and review conversations"
        />
        <AiChatDashboard initialSettings={settings} initialSessions={sessions} />
      </main>
    </>
  )
}
