'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea, Field } from '@/components/ui/Input'

const SETTINGS_KEYS = [
  { key: 'nav', label: 'Navigation Links' },
  { key: 'footer', label: 'Footer Content' },
  { key: 'contact_info', label: 'Contact Info' },
  { key: 'social_links', label: 'Social Links' },
]

interface Props {
  initialSettings: Record<string, unknown>
}

export function GlobalSettingsEditor({ initialSettings }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(
      SETTINGS_KEYS.map(({ key }) => [key, JSON.stringify(initialSettings[key] ?? {}, null, 2)])
    )
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  async function handleSave(key: string) {
    try {
      const parsed = JSON.parse(settings[key])
      setSaving(key)
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: parsed }),
      })
      setSaving(null)
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
      setErrors((prev) => ({ ...prev, [key]: '' }))
    } catch {
      setErrors((prev) => ({ ...prev, [key]: 'Invalid JSON' }))
    }
  }

  return (
    <div className="space-y-4">
      {SETTINGS_KEYS.map(({ key, label }) => (
        <div key={key} className="bg-[#161616] border border-white/[0.08] rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">{label}</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSave(key)}
              loading={saving === key}
            >
              {saved === key ? '✓ Saved' : 'Save'}
            </Button>
          </div>
          <Textarea
            value={settings[key]}
            onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.value }))}
            className="font-mono text-xs min-h-[160px]"
          />
          {errors[key] && <p className="text-xs text-red-400 mt-1">{errors[key]}</p>}
        </div>
      ))}
    </div>
  )
}
