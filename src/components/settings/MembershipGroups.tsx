'use client'

import { useState } from 'react'
import { X, Plus, Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const DEFAULT_GROUPS = ['unlimited', 'coach', 'out of hours', '2 sessions', '2x sessions', '2 sessions a week']

interface Props {
  initialGroups: string[]
}

export function MembershipGroups({ initialGroups }: Props) {
  const [groups, setGroups] = useState<string[]>(initialGroups.length > 0 ? initialGroups : DEFAULT_GROUPS)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function addGroup() {
    const tag = input.trim().toLowerCase()
    if (tag && !groups.includes(tag)) {
      setGroups(prev => [...prev, tag])
      setSaved(false)
    }
    setInput('')
  }

  function removeGroup(tag: string) {
    setGroups(prev => prev.filter(g => g !== tag))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'member_groups', value: groups }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[1px] text-nw-500 mb-2">
          Membership groups that count as &quot;Member&quot;
        </p>
        <p className="text-xs font-medium text-nw-400 mb-3">
          Contacts with any of these group tags will count toward your Total Members stat on the dashboard. These are matched against the WodBoard membership type after a sync.
        </p>
      </div>

      {/* Current groups */}
      <div className="flex flex-wrap gap-2">
        {groups.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.08)] px-2.5 py-1 text-[12px] text-gold-300"
          >
            {tag}
            <button onClick={() => removeGroup(tag)} className="text-gold-400 hover:text-red-400 transition-colors">
              <X size={11} />
            </button>
          </span>
        ))}
        {groups.length === 0 && (
          <p className="text-[12px] text-nw-500 italic">No groups defined — all contacts with status &quot;member&quot; or &quot;trial&quot; will be counted.</p>
        )}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addGroup() } }}
          placeholder="Add membership group (e.g. unlimited)"
          className="h-9 flex-1 rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-[13px] text-nw-200 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
        />
        <Button variant="default" size="sm" onClick={addGroup} disabled={!input.trim()}>
          <Plus size={13} /> Add
        </Button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button variant="gold" size="sm" onClick={handleSave} loading={saving}>
          {saved ? <><Check size={13} /> Saved</> : <><Save size={13} /> Save Groups</>}
        </Button>
        {saved && <span className="text-[11px] text-[#4ade80]">Dashboard will update on next page load</span>}
      </div>

      {/* Reset to defaults */}
      <button
        onClick={() => { setGroups(DEFAULT_GROUPS); setSaved(false) }}
        className="text-xs font-medium text-nw-400 hover:text-nw-300 transition-colors self-start"
      >
        Reset to defaults
      </button>
    </div>
  )
}
