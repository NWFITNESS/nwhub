'use client'

import type { PopupBlock } from './types'

interface Props {
  block: PopupBlock
  selected?: boolean
  onClick?: () => void
}

export function BlockRenderer({ block, selected, onClick }: Props) {
  const s = block.style

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: s.padding ?? 0,
    borderRadius: s.borderRadius ?? 0,
    opacity: (s.opacity ?? 100) / 100,
    backgroundColor: s.backgroundGradient ? undefined : s.backgroundColor,
    background: s.backgroundGradient ?? s.backgroundColor,
    borderWidth: s.borderWidth ?? 0,
    borderColor: s.borderColor ?? 'transparent',
    borderStyle: s.borderWidth ? 'solid' : 'none',
    overflow: 'hidden',
    cursor: 'pointer',
    outline: selected ? '2px solid #c9a70a' : '1px solid transparent',
    outlineOffset: selected ? 1 : 0,
    transition: 'outline 0.15s',
  }

  const textStyle: React.CSSProperties = {
    fontFamily: s.fontFamily ?? 'Inter',
    fontSize: s.fontSize ?? 16,
    fontWeight: s.fontWeight ?? 400,
    fontStyle: s.fontStyle ?? 'normal',
    textAlign: (s.textAlign ?? 'center') as React.CSSProperties['textAlign'],
    color: s.color ?? '#ffffff',
    lineHeight: s.lineHeight ? `${s.lineHeight}` : undefined,
    letterSpacing: s.letterSpacing ?? undefined,
    textDecoration: s.textDecoration ?? 'none',
  }

  switch (block.type) {
    case 'text':
      return (
        <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: s.textAlign === 'right' ? 'flex-end' : s.textAlign === 'left' ? 'flex-start' : 'center' }} onClick={onClick}>
          <p style={{ ...textStyle, margin: 0, width: '100%' }}>{block.content || 'Text'}</p>
        </div>
      )

    case 'image':
      return (
        <div style={{ ...baseStyle, position: 'relative' }} onClick={onClick}>
          {block.content ? (
            <img
              src={block.content}
              alt=""
              style={{
                width: '100%', height: '100%',
                objectFit: (s.objectFit ?? 'cover') as React.CSSProperties['objectFit'],
                objectPosition: s.objectPosition ?? '50% 50%',
                borderRadius: s.borderRadius ?? 0,
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: s.borderRadius ?? 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Click to add image</span>
            </div>
          )}
        </div>
      )

    case 'button': {
      const btnBg = s.buttonVariant === 'gold' ? 'linear-gradient(135deg, #967705, #c4a015)' : s.buttonVariant === 'outline' ? 'transparent' : 'rgba(255,255,255,0.06)'
      const btnBorder = s.buttonVariant === 'outline' ? '1px solid rgba(255,255,255,0.2)' : 'none'
      return (
        <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClick}>
          <div style={{ ...textStyle, background: btnBg, border: btnBorder, borderRadius: s.borderRadius ?? 8, padding: `${(s.padding ?? 12) / 2}px ${s.padding ?? 12}px`, width: '100%', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
            {block.content || 'Button'}
          </div>
        </div>
      )
    }

    case 'icon':
      return (
        <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClick}>
          <span style={{ fontSize: s.fontSize ?? 24, color: s.color ?? '#c9a70a' }}>
            {block.content === 'Star' ? '★' : block.content === 'Heart' ? '❤' : block.content === 'Fire' ? '🔥' : block.content === 'Check' ? '✓' : block.content === 'Arrow' ? '→' : block.content || '★'}
          </span>
        </div>
      )

    case 'badge':
      return (
        <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClick}>
          <span style={{ ...textStyle, textTransform: 'uppercase' as const }}>{block.content || 'Badge'}</span>
        </div>
      )

    case 'divider':
      return (
        <div style={{ ...baseStyle, display: 'flex', alignItems: 'center' }} onClick={onClick}>
          <div style={{ width: '100%', height: 1, backgroundColor: s.backgroundColor ?? 'rgba(255,255,255,0.1)' }} />
        </div>
      )

    case 'newsletter':
      return (
        <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', gap: 8 }} onClick={onClick}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: (s.borderRadius ?? 8) - 2, padding: '8px 12px', fontSize: s.fontSize ?? 13, color: 'rgba(255,255,255,0.3)' }}>
              {s.placeholderText ?? 'Enter your email'}
            </div>
            <div style={{ background: 'linear-gradient(135deg, #967705, #c4a015)', borderRadius: (s.borderRadius ?? 8) - 2, padding: '8px 16px', fontSize: s.fontSize ?? 13, fontWeight: 700, color: '#000', whiteSpace: 'nowrap' as const }}>
              {s.buttonText ?? 'Subscribe'}
            </div>
          </div>
        </div>
      )

    default:
      return <div style={baseStyle} onClick={onClick} />
  }
}
