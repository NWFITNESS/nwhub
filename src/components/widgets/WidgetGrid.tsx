'use no memo'
'use client'

import { useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layouts } from 'react-grid-layout'
import { Settings2, Plus, Check } from 'lucide-react'
import { WidgetPicker } from './WidgetPicker'
import type { WidgetDef } from './useWidgetLayout'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface WidgetGridProps {
  layouts: Layouts
  visibleIds: string[]
  allWidgets: WidgetDef[]
  saveLayouts: (layouts: Layouts) => void
  removeWidget: (id: string) => void
  addWidget: (id: string) => void
  renderWidget: (id: string, isCustomising: boolean, onRemove: (id: string) => void) => React.ReactNode
}

export function WidgetGrid({
  layouts,
  visibleIds,
  allWidgets,
  saveLayouts,
  removeWidget,
  addWidget,
  renderWidget,
}: WidgetGridProps) {
  const [isCustomising, setIsCustomising] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Filter layouts to only visible widgets
  const filteredLayouts: Layouts = {}
  for (const [bp, items] of Object.entries(layouts)) {
    filteredLayouts[bp] = items.filter((item) => visibleIds.includes(item.i))
  }

  return (
    <>
      {/* Toolbar — rendered as TopBar actions via portal pattern; here we embed inline above grid */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setIsCustomising(!isCustomising)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
            isCustomising
              ? 'text-gold-300 border-gold-600/50 bg-gold-600/10'
              : 'text-nw-400 border-[rgba(255,255,255,0.1)] hover:text-nw-200 hover:border-[rgba(255,255,255,0.2)]'
          }`}
        >
          {isCustomising ? <Check size={14} /> : <Settings2 size={14} />}
          {isCustomising ? 'Done' : 'Customise'}
        </button>
        {isCustomising && (
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-nw-400 border border-[rgba(255,255,255,0.1)] hover:text-nw-200 hover:border-[rgba(255,255,255,0.2)] transition-all duration-200"
          >
            <Plus size={14} />
            Add widgets
          </button>
        )}
      </div>

      <ResponsiveGridLayout
        layouts={filteredLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        margin={[12, 12]}
        draggableHandle=".widget-drag-handle"
        isDraggable={isCustomising}
        isResizable={isCustomising}
        onLayoutChange={(_, all) => saveLayouts(all)}
        useCSSTransforms
      >
        {visibleIds.map((id) => (
          <div key={id}>
            {renderWidget(id, isCustomising, removeWidget)}
          </div>
        ))}
      </ResponsiveGridLayout>

      <WidgetPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        allWidgets={allWidgets}
        visibleIds={visibleIds}
        onAdd={addWidget}
        onRemove={removeWidget}
      />
    </>
  )
}
