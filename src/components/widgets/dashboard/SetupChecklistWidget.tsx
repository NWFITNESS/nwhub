'use client'

import { CheckCircle2, Circle } from 'lucide-react'

interface ChecklistItem {
  label: string
  done: boolean
}

interface Props {
  checklist: ChecklistItem[]
}

export function SetupChecklistWidget({ checklist }: Props) {
  const doneCount = checklist.filter((i) => i.done).length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-[#C9A70A]">
          {doneCount}/{checklist.length}
        </span>
      </div>
      <p className="text-xs text-white/30 mb-4">Complete these to get NWHub fully running.</p>

      <div className="h-1.5 bg-white/[0.06] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#967705] to-[#C9A70A] rounded-full transition-all duration-700"
          style={{ width: `${(doneCount / checklist.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-3 flex-1">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            {item.done
              ? <CheckCircle2 size={17} className="text-[#C9A70A] flex-shrink-0" />
              : <Circle size={17} className="text-white/20 flex-shrink-0" />}
            <span className={`text-sm flex-1 ${item.done ? 'text-white/50' : 'text-white/40'}`}>
              {item.label}
            </span>
            {item.done && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#967705]/15 text-[#C9A70A] border border-[#967705]/25 uppercase tracking-wider">
                done
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
