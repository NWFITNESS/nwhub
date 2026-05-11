'use client'

import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'
import type { PopupBlock, BlockStyle } from './types'
import { FONT_OPTIONS } from './types'

interface Props {
  block: PopupBlock
  onUpdate: (updates: Partial<PopupBlock>) => void
  onDelete: () => void
  onImagePick?: () => void
}

export function StylePanel({ block, onUpdate, onDelete, onImagePick }: Props) {
  const s = block.style

  function updateStyle(updates: Partial<BlockStyle>) {
    onUpdate({ style: { ...s, ...updates } })
  }

  function updateContent(content: string) {
    onUpdate({ content })
  }

  const isText = block.type === 'text' || block.type === 'button' || block.type === 'badge'
  const isImage = block.type === 'image'
  const isButton = block.type === 'button'
  const isIcon = block.type === 'icon'

  return (
    <div className="flex flex-col gap-3">
      {/* Block type label */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">
          {block.type} block
        </p>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
          style={{ padding: '2px 6px' }}
        >
          <Trash2 size={11} /> Delete
        </button>
      </div>

      {/* Content */}
      {(isText || isIcon) && (
        <Field label="Content">
          {block.type === 'text' ? (
            <textarea
              value={block.content}
              onChange={e => updateContent(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none focus:border-[rgba(212,160,23,0.4)] resize-none"
              style={{ padding: '6px 10px', minHeight: 60 }}
            />
          ) : isIcon ? (
            <select
              value={block.content}
              onChange={e => updateContent(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
              style={{ padding: '6px 10px' }}
            >
              {['Star', 'Heart', 'Fire', 'Check', 'Arrow', '💪', '🏋️', '🔥', '⚡', '🎯'].map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          ) : (
            <input
              value={block.content}
              onChange={e => updateContent(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none focus:border-[rgba(212,160,23,0.4)]"
              style={{ padding: '6px 10px' }}
            />
          )}
        </Field>
      )}

      {/* Image */}
      {isImage && (
        <Field label="Image">
          <div className="flex gap-2">
            <input
              value={block.content}
              onChange={e => updateContent(e.target.value)}
              placeholder="Image URL or browse..."
              className="flex-1 rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
              style={{ padding: '6px 10px' }}
            />
            {onImagePick && (
              <button
                onClick={onImagePick}
                className="rounded-lg border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-[11px] font-bold text-gold-300"
                style={{ padding: '6px 10px' }}
              >
                Browse
              </button>
            )}
          </div>
        </Field>
      )}

      {/* Button link */}
      {isButton && (
        <>
          <Field label="Button Text">
            <input
              value={block.content}
              onChange={e => updateContent(e.target.value)}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
              style={{ padding: '6px 10px' }}
            />
          </Field>
          <Field label="Link URL">
            <input
              value={s.buttonLink ?? ''}
              onChange={e => updateStyle({ buttonLink: e.target.value })}
              placeholder="/start-here"
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
              style={{ padding: '6px 10px' }}
            />
          </Field>
          <Field label="Button Style">
            <div className="flex gap-1">
              {(['gold', 'outline', 'ghost'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => updateStyle({ buttonVariant: v })}
                  className={`flex-1 rounded-lg border text-[10px] font-bold uppercase transition-colors ${
                    s.buttonVariant === v
                      ? 'border-[rgba(212,160,23,0.4)] bg-[rgba(212,160,23,0.15)] text-gold-300'
                      : 'border-[rgba(255,255,255,0.08)] text-nw-400'
                  }`}
                  style={{ padding: '4px 8px' }}
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      {/* Font controls */}
      {isText && (
        <>
          <Field label="Font">
            <select
              value={s.fontFamily ?? 'Inter'}
              onChange={e => updateStyle({ fontFamily: e.target.value })}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
              style={{ padding: '6px 10px' }}
            >
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Size">
              <input
                type="number"
                value={s.fontSize ?? 16}
                onChange={e => updateStyle({ fontSize: Number(e.target.value) })}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
                style={{ padding: '6px 10px' }}
                min={8} max={72}
              />
            </Field>
            <Field label="Weight">
              <select
                value={s.fontWeight ?? 400}
                onChange={e => updateStyle({ fontWeight: Number(e.target.value) })}
                className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
                style={{ padding: '6px 10px' }}
              >
                <option value={300}>Light</option>
                <option value={400}>Regular</option>
                <option value={600}>Semi-bold</option>
                <option value={700}>Bold</option>
                <option value={900}>Black</option>
              </select>
            </Field>
          </div>

          {/* B / I / U toggles */}
          <div className="flex gap-1">
            <ToggleBtn active={s.fontWeight === 700} onClick={() => updateStyle({ fontWeight: s.fontWeight === 700 ? 400 : 700 })} icon={<Bold size={13} />} />
            <ToggleBtn active={s.fontStyle === 'italic'} onClick={() => updateStyle({ fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })} icon={<Italic size={13} />} />
            <ToggleBtn active={s.textDecoration === 'underline'} onClick={() => updateStyle({ textDecoration: s.textDecoration === 'underline' ? 'none' : 'underline' })} icon={<Underline size={13} />} />
            <div className="w-px bg-[rgba(255,255,255,0.08)] mx-1" />
            <ToggleBtn active={s.textAlign === 'left'} onClick={() => updateStyle({ textAlign: 'left' })} icon={<AlignLeft size={13} />} />
            <ToggleBtn active={s.textAlign === 'center' || !s.textAlign} onClick={() => updateStyle({ textAlign: 'center' })} icon={<AlignCenter size={13} />} />
            <ToggleBtn active={s.textAlign === 'right'} onClick={() => updateStyle({ textAlign: 'right' })} icon={<AlignRight size={13} />} />
          </div>
        </>
      )}

      {/* Color */}
      <Field label="Text Color">
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={s.color ?? '#ffffff'}
            onChange={e => updateStyle({ color: e.target.value })}
            className="w-8 h-8 rounded border-0 cursor-pointer"
            style={{ padding: 0 }}
          />
          <input
            value={s.color ?? '#ffffff'}
            onChange={e => updateStyle({ color: e.target.value })}
            className="flex-1 rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[11px] text-white outline-none font-mono"
            style={{ padding: '4px 8px' }}
          />
        </div>
      </Field>

      {/* Background */}
      <Field label="Background">
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={s.backgroundColor ?? '#000000'}
            onChange={e => updateStyle({ backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border-0 cursor-pointer"
            style={{ padding: 0 }}
          />
          <input
            value={s.backgroundColor ?? ''}
            onChange={e => updateStyle({ backgroundColor: e.target.value })}
            placeholder="transparent"
            className="flex-1 rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[11px] text-white outline-none font-mono"
            style={{ padding: '4px 8px' }}
          />
        </div>
      </Field>

      {/* Image controls */}
      {isImage && (
        <Field label="Object Fit">
          <select
            value={s.objectFit ?? 'cover'}
            onChange={e => updateStyle({ objectFit: e.target.value as BlockStyle['objectFit'] })}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
            style={{ padding: '6px 10px' }}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </Field>
      )}

      {/* Layout */}
      <div className="grid grid-cols-3 gap-2">
        <Field label="Padding">
          <input
            type="number"
            value={s.padding ?? 0}
            onChange={e => updateStyle({ padding: Number(e.target.value) })}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
            style={{ padding: '4px 8px' }}
            min={0} max={64}
          />
        </Field>
        <Field label="Radius">
          <input
            type="number"
            value={s.borderRadius ?? 0}
            onChange={e => updateStyle({ borderRadius: Number(e.target.value) })}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
            style={{ padding: '4px 8px' }}
            min={0} max={50}
          />
        </Field>
        <Field label="Opacity">
          <input
            type="number"
            value={s.opacity ?? 100}
            onChange={e => updateStyle({ opacity: Number(e.target.value) })}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
            style={{ padding: '4px 8px' }}
            min={0} max={100}
          />
        </Field>
      </div>

      {/* Border */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Border Width">
          <input
            type="number"
            value={s.borderWidth ?? 0}
            onChange={e => updateStyle({ borderWidth: Number(e.target.value) })}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[12px] text-white outline-none"
            style={{ padding: '4px 8px' }}
            min={0} max={10}
          />
        </Field>
        <Field label="Border Color">
          <div className="flex gap-1 items-center">
            <input
              type="color"
              value={s.borderColor ?? '#ffffff'}
              onChange={e => updateStyle({ borderColor: e.target.value })}
              className="w-6 h-6 rounded border-0 cursor-pointer"
              style={{ padding: 0 }}
            />
            <input
              value={s.borderColor ?? ''}
              onChange={e => updateStyle({ borderColor: e.target.value })}
              className="flex-1 rounded-lg border border-[rgba(255,255,255,0.12)] bg-nw-800 text-[10px] text-white outline-none font-mono"
              style={{ padding: '3px 6px' }}
            />
          </div>
        </Field>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-[1.4px] text-nw-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}

function ToggleBtn({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border transition-colors ${
        active
          ? 'border-[rgba(212,160,23,0.4)] bg-[rgba(212,160,23,0.15)] text-gold-300'
          : 'border-[rgba(255,255,255,0.08)] text-nw-400 hover:text-nw-200'
      }`}
      style={{ padding: '5px 8px', minHeight: 28 }}
    >
      {icon}
    </button>
  )
}
