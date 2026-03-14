'use client'

import { EditableZone } from './EditableZone'
import { SectionFullPreview } from './SectionFullPreview'

type PageSection = {
  section_key: string
  sort_order: number | null
  content: Record<string, unknown>
  draft_content: Record<string, unknown> | null
  updated_at: string
}

interface Props {
  sections: PageSection[]
  liveEdits: Record<string, Record<string, unknown>>
  selectedKey: string | null
  onSectionClick: (key: string) => void
}

export function FullPagePreview({ sections, liveEdits, selectedKey, onSectionClick }: Props) {
  return (
    <div>
      {sections.map((section) => {
        const key = section.section_key
        const effectiveContent = liveEdits[key] ?? section.draft_content ?? section.content

        return (
          <EditableZone
            key={key}
            label={key.replace(/_/g, ' ')}
            isSelected={key === selectedKey}
            onSelect={() => onSectionClick(key)}
          >
            <SectionFullPreview
              sectionKey={key}
              content={effectiveContent}
            />
          </EditableZone>
        )
      })}
    </div>
  )
}
