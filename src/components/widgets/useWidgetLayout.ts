'use client'

import { useState, useCallback } from 'react'
import type { Layouts } from 'react-grid-layout'

export interface WidgetDef {
  id: string
  name: string
  category: 'kpi' | 'chart' | 'table' | 'misc'
  defaultLayout: { w: number; h: number; x?: number; y?: number }
}

function buildDefaultLayouts(widgets: WidgetDef[]): Layouts {
  // Auto-pack: place items left-to-right, 12-col grid
  let curX = 0
  let curY = 0
  let rowH = 0

  const lgItems = widgets.map((w) => {
    const { w: width, h, x, y } = w.defaultLayout
    if (x !== undefined && y !== undefined) {
      return { i: w.id, x, y, w: width, h }
    }
    if (curX + width > 12) {
      curX = 0
      curY += rowH
      rowH = 0
    }
    const item = { i: w.id, x: curX, y: curY, w: width, h }
    curX += width
    rowH = Math.max(rowH, h)
    return item
  })

  return {
    lg: lgItems,
    md: lgItems,
    sm: lgItems.map((item) => ({ ...item, w: Math.min(item.w, 6), x: item.x % 6 })),
    xs: lgItems.map((item) => ({ ...item, w: Math.min(item.w, 4), x: 0 })),
    xxs: lgItems.map((item) => ({ ...item, w: 2, x: 0 })),
  }
}

export function useWidgetLayout(
  page: 'dashboard' | 'financials',
  allWidgets: WidgetDef[],
) {
  const layoutKey = `nwhub_${page}_layouts`
  const widgetsKey = `nwhub_${page}_widgets`

  const defaultLayoutsObj = buildDefaultLayouts(allWidgets)
  const defaultIds = allWidgets.map((w) => w.id)

  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (typeof window === 'undefined') return defaultLayoutsObj
    try {
      const saved = localStorage.getItem(layoutKey)
      return saved ? JSON.parse(saved) : defaultLayoutsObj
    } catch {
      return defaultLayoutsObj
    }
  })

  const [visibleIds, setVisibleIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return defaultIds
    try {
      const saved = localStorage.getItem(widgetsKey)
      if (!saved) return defaultIds
      const parsed: string[] = JSON.parse(saved)
      // Filter out unknown IDs
      return parsed.filter((id) => allWidgets.some((w) => w.id === id))
    } catch {
      return defaultIds
    }
  })

  const saveLayouts = useCallback((newLayouts: Layouts) => {
    setLayouts(newLayouts)
    if (typeof window !== 'undefined') {
      localStorage.setItem(layoutKey, JSON.stringify(newLayouts))
    }
  }, [layoutKey])

  const removeWidget = useCallback((id: string) => {
    setVisibleIds((prev) => {
      const next = prev.filter((v) => v !== id)
      if (typeof window !== 'undefined') {
        localStorage.setItem(widgetsKey, JSON.stringify(next))
      }
      return next
    })
  }, [widgetsKey])

  const addWidget = useCallback((id: string) => {
    setVisibleIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      if (typeof window !== 'undefined') {
        localStorage.setItem(widgetsKey, JSON.stringify(next))
      }
      return next
    })
  }, [widgetsKey])

  const resetLayout = useCallback(() => {
    setLayouts(defaultLayoutsObj)
    setVisibleIds(defaultIds)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(layoutKey)
      localStorage.removeItem(widgetsKey)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey, widgetsKey])

  return { layouts, visibleIds, saveLayouts, removeWidget, addWidget, resetLayout }
}
