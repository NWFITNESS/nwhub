import type { Trial } from '@/app/(dashboard)/calendar/types'

export interface TrialBarSegment {
  trial: Trial
  left: number
  width: number
  top: number
  isContinuation: boolean
}

const VARIANTS = [
  {
    bg:     'rgba(212,160,23,0.1)',
    border: 'rgba(212,160,23,0.22)',
    color:  'var(--r-gold-300)',
    accent: 'var(--r-gold-400)',
  },
  {
    bg:     'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.22)',
    color:  '#60a5fa',
    accent: '#60a5fa',
  },
  {
    bg:     'rgba(167,139,250,0.1)',
    border: 'rgba(167,139,250,0.22)',
    color:  '#a78bfa',
    accent: '#a78bfa',
  },
]

export function TrialBar({ segment }: { segment: TrialBarSegment }) {
  const { trial, left, width, top, isContinuation } = segment
  const v = VARIANTS[(trial.color_variant ?? 0) % 3]

  return (
    <div
      role="presentation"
      style={{
        position: 'absolute',
        left,
        width,
        top,
        height: 17,
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: isContinuation ? '0 4px 4px 0' : 4,
        borderLeft: isContinuation ? 'none' : `2px solid ${v.accent}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 6px',
        fontSize: 9,
        fontWeight: 600,
        color: v.color,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        zIndex: 2,
        pointerEvents: 'none',
        letterSpacing: '0.3px',
        fontFamily: 'var(--font-ui, Inter), sans-serif',
      }}
    >
      {isContinuation
        ? `${trial.member_name} (cont.)`
        : `${trial.member_name} · 14-day trial`}
    </div>
  )
}

// ── Bar geometry calculator ────────────────────────────────────────────────────

export function computeTrialSegments(
  trials: Trial[],
  cells: { dateStr: string; row: number; col: number }[],
  cellWidth: number,
  cellHeight: number,
): TrialBarSegment[] {
  const segments: TrialBarSegment[] = []
  // Track how many trials overlap on each row (for vertical stacking)
  const rowTrialIndex: Record<number, number> = {}

  trials.forEach((trial, tIdx) => {
    // Assign color variant based on index
    trial = { ...trial, color_variant: (tIdx % 3) as 0 | 1 | 2 }

    const startDate = new Date(trial.start_date)
    const endDate = new Date(trial.end_date)

    // Group cells that belong to this trial, organized by row
    const trialCells = cells.filter(c => {
      const d = new Date(c.dateStr)
      return d >= startDate && d <= endDate
    })

    if (trialCells.length === 0) return

    // Group by row
    const byRow: Record<number, typeof trialCells> = {}
    trialCells.forEach(c => {
      if (!byRow[c.row]) byRow[c.row] = []
      byRow[c.row].push(c)
    })

    const rows = Object.keys(byRow).map(Number).sort((a, b) => a - b)
    rows.forEach((row, rowIdx) => {
      const rowCells = byRow[row].sort((a, b) => a.col - b.col)
      const firstCol = rowCells[0].col
      const span = rowCells.length

      if (!rowTrialIndex[row]) rowTrialIndex[row] = 0
      const trialIndex = rowTrialIndex[row]++

      segments.push({
        trial,
        left: firstCol * cellWidth + 3,
        width: span * cellWidth - 6,
        top: row * cellHeight + 27 + trialIndex * 20,
        isContinuation: rowIdx > 0,
      })
    })
  })

  return segments
}
