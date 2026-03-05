'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

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

  useEffect(() => {
    const ro = new ResizeObserver(recalculate)
    if (containerRef.current) ro.observe(containerRef.current)
    if (innerRef.current) ro.observe(innerRef.current)
    recalculate()
    return () => ro.disconnect()
  }, [recalculate])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: scaledHeight ?? 'auto' }}
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
