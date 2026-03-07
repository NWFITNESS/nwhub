'use client'

import { useState } from 'react'

export function useColumnVisibility(tableId: string, defaultColumns: string[]) {
  const storageKey = `col-vis-${tableId}`

  const [visible, setVisible] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(defaultColumns)
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const arr = JSON.parse(stored) as string[]
        return new Set(arr.filter((k) => defaultColumns.includes(k)))
      }
    } catch {}
    return new Set(defaultColumns)
  })

  function toggle(key: string) {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem(storageKey, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  return { visible, toggle }
}
