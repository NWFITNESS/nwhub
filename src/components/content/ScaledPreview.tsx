'use client'

import { useRef, useState, useLayoutEffect, useCallback } from 'react'

const TARGET_WIDTH = 1100

export function ScaledPreview({
  children,
  onScaleChange,
}: {
  children: React.ReactNode
  onScaleChange?: (scale: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [scaledHeight, setScaledHeight] = useState<number | undefined>()

  const recalculate = useCallback(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!container || !inner) return
    const s = container.offsetWidth / TARGET_WIDTH
    const h = inner.scrollHeight * s
    setScale(s)
    setScaledHeight(h)
    onScaleChange?.(s)
  }, [onScaleChange])

  // useLayoutEffect fires synchronously before the browser paints, so the user
  // never sees the uncalculated state. The ResizeObserver handles subsequent changes.
  useLayoutEffect(() => {
    recalculate()
    const ro = new ResizeObserver(recalculate)
    if (containerRef.current) ro.observe(containerRef.current)
    if (innerRef.current) ro.observe(innerRef.current)
    return () => ro.disconnect()
  }, [recalculate])

  // While scaledHeight is being measured, use overflow:visible so the absolute
  // inner div is visible and its scrollHeight can be read correctly. Once we have
  // a measurement, switch to overflow:hidden to clip the scaled content cleanly.
  const measured = scaledHeight !== undefined

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        height: measured ? scaledHeight : 'auto',
        overflow: measured ? 'hidden' : 'visible',
      }}
    >
      <div
        ref={innerRef}
        className="absolute top-0 left-0 origin-top-left bg-[#0a0a0a]"
        style={{ width: TARGET_WIDTH, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
