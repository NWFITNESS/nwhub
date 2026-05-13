import { createAdminClient } from '@/lib/supabase/admin'

interface ChangelogEntry {
  project: 'nwhub' | 'website'
  title: string
  description?: string
  reason?: string
  category?: string
  level?: 'info' | 'improvement' | 'fix' | 'breaking'
  files_changed?: number
  commit_hash?: string
}

export async function logChange(entry: ChangelogEntry) {
  const supabase = createAdminClient()
  await supabase.from('changelog_entries').insert({
    project: entry.project,
    title: entry.title,
    description: entry.description || null,
    reason: entry.reason || null,
    category: entry.category || 'feature',
    level: entry.level || 'info',
    files_changed: entry.files_changed || 0,
    commit_hash: entry.commit_hash || null,
  })
}

export async function logChanges(entries: ChangelogEntry[]) {
  const supabase = createAdminClient()
  await supabase.from('changelog_entries').insert(
    entries.map(e => ({
      project: e.project,
      title: e.title,
      description: e.description || null,
      reason: e.reason || null,
      category: e.category || 'feature',
      level: e.level || 'info',
      files_changed: e.files_changed || 0,
      commit_hash: e.commit_hash || null,
    }))
  )
}
