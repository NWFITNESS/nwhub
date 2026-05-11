// ── Popup Builder Types ──────────────────────────────────────────────────────

export interface BlockStyle {
  // Text
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right'
  color?: string
  lineHeight?: number
  letterSpacing?: number
  textDecoration?: 'none' | 'underline'
  // Background
  backgroundColor?: string
  backgroundGradient?: string
  // Image
  objectFit?: 'cover' | 'contain' | 'fill'
  objectPosition?: string
  // Button
  buttonVariant?: 'gold' | 'outline' | 'ghost'
  buttonLink?: string
  // Layout
  padding?: number
  borderRadius?: number
  opacity?: number
  // Border
  borderWidth?: number
  borderColor?: string
}

export interface PopupBlock {
  id: string
  type: 'text' | 'image' | 'button' | 'icon' | 'badge' | 'divider'
  // react-grid-layout position
  x: number
  y: number
  w: number
  h: number
  // Content
  content: string
  // Styling
  style: BlockStyle
}

export interface PopupDesign {
  enabled: boolean
  display_mode: 'first_visit' | 'once_per_session' | 'every_page' | 'every_refresh'
  // Canvas
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string
  borderRadius: number
  // Blocks
  blocks: PopupBlock[]
  // Legacy
  dismiss_text: string
}

export const DEFAULT_DESIGN: PopupDesign = {
  enabled: true,
  display_mode: 'first_visit',
  width: 420,
  height: 540,
  backgroundColor: '#0e0e0e',
  borderRadius: 16,
  blocks: [],
  dismiss_text: "No thanks, I'll look around first",
}

export const BLOCK_DEFAULTS: Record<string, Partial<PopupBlock>> = {
  text: {
    type: 'text',
    w: 12, h: 3,
    content: 'Your text here',
    style: { fontSize: 16, fontWeight: 400, color: '#ffffff', textAlign: 'center', fontFamily: 'Inter' },
  },
  image: {
    type: 'image',
    w: 12, h: 8,
    content: '',
    style: { objectFit: 'cover', borderRadius: 0, opacity: 100 },
  },
  button: {
    type: 'button',
    w: 8, h: 2,
    content: 'Click here',
    style: { fontSize: 14, fontWeight: 700, color: '#000000', backgroundColor: '#c9a70a', buttonVariant: 'gold', buttonLink: '/start-here', borderRadius: 8, padding: 12, textAlign: 'center' },
  },
  icon: {
    type: 'icon',
    w: 2, h: 2,
    content: 'Star',
    style: { fontSize: 24, color: '#c9a70a', textAlign: 'center' },
  },
  badge: {
    type: 'badge',
    w: 6, h: 2,
    content: 'Limited offer',
    style: { fontSize: 10, fontWeight: 600, color: '#c9a70a', backgroundColor: 'rgba(150,119,5,0.15)', borderRadius: 20, padding: 8, textAlign: 'center', letterSpacing: 1.5 },
  },
  divider: {
    type: 'divider',
    w: 12, h: 1,
    content: '',
    style: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 0 },
  },
}

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Rajdhani', label: 'Rajdhani' },
  { value: 'system-ui', label: 'System' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'monospace', label: 'Monospace' },
]
