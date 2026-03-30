# NWHub Design System — Claude Code Master Reference
# Save this file to: C:\Users\mathe\nwhub\.claude\skills\nwhub-ux-ui\SKILL.md
# Claude Code reads this automatically on every session.

---

## THIS FILE OVERRIDES ALL PREVIOUS DESIGN DECISIONS

The old NWHub design used:
- A decorative animated gold swirl background — **REMOVE IT EVERYWHERE**
- Near-black `#0a0a0a` flat backgrounds — **REPLACE with slate tokens below**
- Bright yellow `#f5c518` / `yellow-400` buttons — **REPLACE with gold tokens below**
- Dark muddy cards with no elevation — **REPLACE with nw-750 + gold glow**
- A hamburger drawer sidebar on mobile — **REPLACE with bottom tab bar**

The new design is already live on the Overview page (`/`). **Every other page must match it exactly.**

Open and study `nwhub-redesign.html` (in your project root) before writing any code. That file is the visual law.

---

## DESIGN PHILOSOPHY

Semi-dark slate theme. Premium, cinematic. Inspired by Linear, Vercel, and Financo dashboards.
- Backgrounds are deep blue-slate, not black
- Cards are slightly lifted surfaces with gold glow
- The only decorative element is the gold accent — used sparingly
- Text is bright enough to read comfortably without straining
- No animated background. No swirl. No flow field. Delete any that exist.

---

## COLOUR TOKENS

These are the ONLY colours used in NWHub. No raw Tailwind `gray-*`, `zinc-*`, `slate-*` classes.
Use `nw-*` and `gold-*` tokens exclusively.

### Add to `tailwind.config.ts` → `theme.extend.colors`:

```ts
'nw-950': '#0b0e14',   // sidebar, topbar bg
'nw-900': '#111520',   // page/app bg
'nw-850': '#161c2a',   // secondary bg
'nw-800': '#1c2333',   // input bg
'nw-750': '#22293d',   // card / panel surface  ← most used
'nw-700': '#293248',   // card hover state
'nw-600': '#374059',   // borders (strong)
'nw-500': '#607080',   // muted label text
'nw-400': '#8296b4',   // secondary text
'nw-300': '#aabdd8',   // nav item text
'nw-200': '#d2deee',   // primary body text
'nw-100': '#edf3fb',   // brightest text / hover

'gold-600': '#b8870f',
'gold-500': '#d4a017',
'gold-400': '#e8b933',
'gold-300': '#f2cb55',  // primary gold accent ← most used
'gold-200': '#f8df8a',
'gold-100': '#fdf4d4',
```

### Add to `theme.extend.boxShadow`:
```ts
'gold-sm':  '0 4px 24px rgba(212,160,23,0.07), 0 1px 4px rgba(212,160,23,0.04)',
'gold-md':  '0 6px 32px rgba(212,160,23,0.13), 0 2px 8px rgba(212,160,23,0.07)',
'sidebar':  '4px 0 32px rgba(212,160,23,0.08), 2px 0 8px rgba(212,160,23,0.05)',
```

### Add to `theme.extend.fontFamily`:
```ts
brand: ['Rajdhani', 'sans-serif'],
ui:    ['Inter', 'sans-serif'],
```

### Semantic colours (inline rgba — not tokenised):
```
Panel border:        rgba(255, 255, 255, 0.11)
Panel border hover:  rgba(255, 255, 255, 0.18)
Panel bg subtle:     rgba(255, 255, 255, 0.04)
Divider:             rgba(255, 255, 255, 0.07)
Topbar border:       rgba(255, 255, 255, 0.09)
Sidebar gold border: rgba(212, 160, 23, 0.18)
Gold bg subtle:      rgba(212, 160, 23, 0.11)
Gold bg icon:        rgba(212, 160, 23, 0.10)
Gold border icon:    rgba(212, 160, 23, 0.22)
Status green:        #4ade80
Status amber:        #f59e0b
Status red:          #f87171
```

---

## TYPOGRAPHY

### Fonts
- **Rajdhani** — brand font. All headings, page titles, stat values, logo text, topbar brand
- **Inter** — UI font. Everything else: nav, body, labels, descriptions, badges

### Import in `src/app/layout.tsx`:
```tsx
import { Rajdhani, Inter } from 'next/font/google'
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['500','600','700'], variable: '--font-brand' })
const inter    = Inter({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-ui' })
// Apply both variables to <html> element
```

### Type scale:
| Use | Font | Size | Weight | Tracking | Transform |
|---|---|---|---|---|---|
| Page H1 | Rajdhani | 28px | 700 | 0.3px | — |
| Topbar brand | Rajdhani | 14px | 700 | 2px | uppercase |
| Logo name | Rajdhani | 12.5px | 700 | 1.8px | uppercase |
| Stat values | Rajdhani | 32px | 700 | -0.5px | — |
| Section headings | Rajdhani | 20px | 600 | 0.5px | — |
| Panel titles | Inter | 13px | 500 | — | — |
| Nav items | Inter | 13px | 400/500 | — | — |
| Body text | Inter | 13px | 400 | — | — |
| Card labels | Inter | 10px | 600 | 1.1px | uppercase |
| Eyebrow labels | Inter | 9–10px | 600 | 1.4–1.8px | uppercase |
| Sub-nav items | Inter | 12px | 400 | — | — |
| Badges / tags | Inter | 9px | 600 | 0.8px | uppercase |
| Table headers | Inter | 10px | 600 | 1.1px | uppercase |
| Table cells | Inter | 13px | 400 | — | — |

---

## APP SHELL

```
┌──────────────────────────────────────────────────────┐
│  DESKTOP (min-width: 768px)                          │
│  ┌──────────┐  ┌───────────────────────────────────┐ │
│  │ Sidebar  │  │ Topbar (54px fixed height)        │ │
│  │ 58px     │  ├───────────────────────────────────┤ │
│  │ collapsed│  │ Content area (overflow-y: auto)   │ │
│  │ 228px    │  │ padding: 22px 24px                │ │
│  │ expanded │  │                                   │ │
│  └──────────┘  └───────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  MOBILE (max-width: 767px)                           │
│  ┌───────────────────────────────────────────────┐   │
│  │ Mobile App Bar (48px)                         │   │
│  ├───────────────────────────────────────────────┤   │
│  │ Content area (padding: 16px, pb: 80px)        │   │
│  │                                               │   │
│  ├───────────────────────────────────────────────┤   │
│  │ Bottom Tab Bar (56px fixed)                   │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Global body:** `bg-[#090c12]`, `font-ui`, `antialiased`
**Dashboard bg:** `bg-nw-900`
**No decorative background elements anywhere.**

---

## SIDEBAR (Desktop)

File: `src/components/layout/Sidebar.tsx`

### Behaviour
- Collapsed: `w-[58px]` — icons only, all text `opacity-0`
- Expanded: `w-[228px]` — on `mouseenter` OR `.pinned` class
- Transition: `transition-[width] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]`
- Sidebar in normal flow — main content shifts right naturally
- Sub-menus: accordion, one open at a time
- Pull hint: gold tab on right edge, shown once, dismissed on first hover via `localStorage`
- Active route: use `usePathname()` from `next/navigation`

### Sidebar wrapper:
```tsx
className="relative z-20 flex flex-shrink-0 flex-col bg-nw-950 border-r border-[rgba(212,160,23,0.18)] shadow-sidebar overflow-hidden transition-[width] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
// Width: w-[58px] collapsed, w-[228px] expanded
```

### Logo row (h-[54px]):
```tsx
// Container
className="flex h-[54px] min-h-[54px] items-center gap-[11px] overflow-hidden whitespace-nowrap border-b border-[rgba(255,255,255,0.09)] px-[13px]"

// Logo mark (always visible)
className="flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-300 font-brand text-sm font-bold tracking-[0.5px] text-nw-950 flex-shrink-0"
// Text: "NW"

// Logo text (fades in on expand)
className="pointer-events-none leading-[1.15] transition-opacity duration-[260ms]"
// opacity-0 collapsed, opacity-100 expanded
// .logo-name: "font-brand text-[12.5px] font-bold uppercase tracking-[1.8px] text-white"
// .logo-sub:  "text-[9.5px] uppercase tracking-[0.6px] text-nw-500"
// Text: "NORTHERN WARRIOR" / "Admin Dashboard"
```

### Section labels (shown on expand):
```tsx
className="overflow-hidden whitespace-nowrap px-[18px] text-[9px] font-semibold uppercase tracking-[1.6px] text-nw-600 transition-[opacity,max-height] duration-[260ms]"
// max-h-0 opacity-0 collapsed → max-h-8 pt-3 pb-1 opacity-100 expanded
// Sections: "Main" and "Platform"
```

### Nav item:
```tsx
// Base
className="relative mx-[7px] my-px flex h-[38px] cursor-pointer items-center gap-[10px] overflow-hidden whitespace-nowrap rounded-[7px] px-[11px] text-[13px] transition-colors duration-150 select-none"

// Default: text-nw-400, hover: bg-[rgba(255,255,255,0.04)] text-nw-200
// Active:  bg-[rgba(212,160,23,0.11)] text-gold-300 font-medium

// Active left bar (::before equivalent)
className="absolute left-0 top-[22%] h-[56%] w-[2.5px] rounded-r-sm bg-gold-400"

// Icon (always visible, 16x16px)
className="flex h-4 w-4 min-w-[16px] items-center justify-center flex-shrink-0"
// Active icon: stroke color gold-400

// Label text (fades in)
className="flex flex-1 items-center justify-between min-w-0 transition-opacity duration-[260ms]"
// opacity-0 collapsed → opacity-100 expanded
```

### Nav badges:
```tsx
className="rounded-[9px] bg-[rgba(212,160,23,0.18)] px-1.5 py-px text-[9px] font-semibold text-gold-300"
```

### Chevron (for expandable items):
```tsx
className="text-nw-600 transition-transform duration-200"
// rotate-90 when open
```

### Sub-items container:
```tsx
className="overflow-hidden transition-[max-height] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
// max-h-0 closed → max-h-56 open
```

### Sub-item:
```tsx
className="relative mx-[7px] flex h-[30px] cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-[6px] pl-10 pr-[11px] text-xs transition-colors duration-150"
// before: absolute left-6 top-1/2 h-px w-[7px] bg-nw-700
// Default: text-nw-500, hover: bg-[rgba(255,255,255,0.04)] text-nw-300, before:bg-nw-500
// Active: text-gold-300, before:bg-gold-600

// Text (fades in on sidebar expand)
className="transition-opacity duration-[260ms]"
// opacity-0 collapsed → opacity-100 expanded
```

### Collapsed tooltips:
```tsx
// Fixed position tooltip shown when sidebar is collapsed and item is hovered
className="fixed z-[999] rounded-md border border-nw-600 bg-nw-750 px-2.5 py-[5px] text-xs text-nw-200 shadow-[0_6px_18px_rgba(0,0,0,0.45)] pointer-events-none whitespace-nowrap"
// Position via JS: top = item rect.top + rect.height/2, left = 58 + 10px
// Only show when sidebar.offsetWidth <= 60
```

### Pull hint tab:
```tsx
className="pointer-events-none absolute right-[-22px] top-1/2 flex -translate-y-1/2 flex-col items-center gap-[5px] rounded-r-[7px] border border-l-0 border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.13)] px-[7px] py-[10px] text-[9px] font-semibold uppercase tracking-[0.8px] text-gold-400 [writing-mode:vertical-rl]"
// Dismiss: localStorage.setItem('nwhub-hint', '1'), transition-opacity, opacity-0 on expand
```

### Footer:
```tsx
// Container
className="flex flex-shrink-0 items-center gap-[9px] overflow-hidden whitespace-nowrap border-t border-[rgba(255,255,255,0.09)] px-[11px] py-[10px]"

// Avatar (always visible)
className="flex h-[30px] w-[30px] min-w-[30px] items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-300 font-brand text-[11px] font-bold text-nw-950 flex-shrink-0"

// User info + sign out (fade in on expand)
// opacity-0 collapsed → opacity-100 expanded
// name: text-xs font-medium text-nw-200
// role: text-[10px] text-nw-500
// sign-out: text-nw-600 hover:text-nw-300
```

### Navigation structure:
```
MAIN
├── Overview          /                    no children
├── Inbox Intelligence /inbox              → All Enquiries /enquiries, AI Chat /ai-chat, Contacts /contacts
├── Financials         /financials         → Revenue Overview, Xero P&L (tabs on same page)
└── Engagement         /leads              → Members /leads, Attendance /calendar, SMS /sms

PLATFORM
├── Content            /content            → Blog /blog/manage, Email Campaigns /mailchimp, Website Editor /content, Media /media
└── System             /settings           → Integrations /sync, Settings /settings, Security /settings?tab=security

Also in system (sidebar bottom or settings page):
  Workflows /workflows, Branding /branding, Kids & Teens /kids
```

---

## TOPBAR (Desktop)

File: `src/components/layout/TopBar.tsx`

```tsx
// Container
className="flex h-[54px] min-h-[54px] flex-shrink-0 items-center gap-[14px] border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-[22px]"

// Brand
className="font-brand text-sm font-bold uppercase tracking-[2px] text-nw-300"
// Text: "NW HUB"

// Divider
className="h-[18px] w-px bg-[rgba(255,255,255,0.09)]"

// Breadcrumb
className="flex items-center gap-1.5 text-xs text-nw-500"
// Current page: text-nw-200

// Right: ml-auto, flex items-center gap-2
```

### Topbar buttons:
```tsx
// Default button
className="flex items-center gap-1.5 rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] px-3 py-[5px] text-xs text-nw-300 transition-colors hover:border-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100"

// Gold button (primary action)
className="flex items-center gap-1.5 rounded-[7px] border border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] px-3 py-[5px] text-xs text-gold-300 transition-colors hover:bg-[rgba(212,160,23,0.22)]"
```

---

## MOBILE APP BAR

File: `src/components/mobile/MobileAppBar.tsx`

```tsx
// Container (only shown on mobile, md:hidden)
className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-4"

// Left: hamburger or back button (text-nw-400)
// Centre: NW logo mark (24px) + page title (font-brand text-sm font-bold uppercase tracking-[1.5px] text-white)
// Right: notification bell (text-nw-400)
```

---

## BOTTOM TAB BAR (Mobile)

File: `src/components/mobile/BottomTabBar.tsx`

```tsx
// Container (only shown on mobile, md:hidden)
className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-[rgba(255,255,255,0.09)] bg-nw-950 px-2"

// Each tab
className="flex flex-col items-center gap-0.5 rounded-[8px] px-3 py-1.5 transition-colors"
// Default: text-nw-500
// Active:  text-gold-300

// Icon: 20x20px
// Label: text-[10px] font-medium

// Active indicator: 2px gold dot above icon or underline
```

Tabs (5): Overview, Members, Content, Revenue, More

---

## SHARED COMPONENTS

### Panel (surface card)
```tsx
// src/components/ui/Card.tsx — export function Panel
className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750"

// Panel hover variant (clickable panels)
className="... transition-[background,border-color] duration-150 hover:border-[rgba(255,255,255,0.18)] hover:bg-nw-700 cursor-pointer"
```

### Panel header
```tsx
// PanelHeader component
className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[11px] flex-shrink-0"

// Eyebrow text
className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500"

// Divider
className="h-3 w-px bg-[rgba(255,255,255,0.09)]"

// Title
className="text-[13px] font-medium text-nw-200"

// Right side action slot: ml-auto
```

### Stat card
```tsx
// src/components/widgets/dashboard/StatCard.tsx
className="relative cursor-default overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-nw-750 p-[15px_17px_13px] shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md"

// Label
className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400"

// Icon box (28x28px)
className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)]"

// Value
className="font-brand text-[32px] font-bold leading-none tracking-[-0.5px] text-white"
// Gold variant: text-gold-300

// Sub text
className="flex items-center gap-1 text-[11px] text-nw-500"

// Accent bar (absolute bottom)
className="absolute bottom-0 left-0 right-0 h-[2px]"
// Default: bg-gradient-to-r from-nw-600 to-transparent
// Gold: bg-gradient-to-r from-[rgba(212,160,23,0.65)] to-transparent
```

### Page header
```tsx
// src/components/layout/PageHeader.tsx
// Eyebrow
className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500"

// H1
className="font-brand text-[28px] font-bold leading-none tracking-[0.3px] text-white"
// Gold word: className="text-gold-400"

// Date
className="mt-px text-xs text-nw-500"
```

### Button variants
```tsx
// src/components/ui/Button.tsx
// Base: rounded-[7px] border font-ui font-medium transition-colors inline-flex items-center gap-1.5
// Size sm: px-3 py-[5px] text-xs
// Size md: px-4 py-2 text-sm

// default: border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-nw-300 hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100 hover:border-[rgba(255,255,255,0.14)]
// gold:    border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300 hover:bg-[rgba(212,160,23,0.22)]
// ghost:   border-transparent bg-transparent text-nw-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-200
// danger:  border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-red-400 hover:bg-[rgba(239,68,68,0.18)]
```

### Input
```tsx
// src/components/ui/Input.tsx
className="h-9 w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-[13px] text-nw-200 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
```

### Badge variants
```tsx
// src/components/ui/Badge.tsx
// Base: inline-flex items-center rounded-[8px] px-[7px] py-[2px] text-[9px] font-semibold uppercase tracking-[0.8px]

// done:    bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]
// todo:    bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]
// gold:    bg-[rgba(212,160,23,0.18)] text-gold-300  border border-[rgba(212,160,23,0.25)]
// active:  bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]
// paused:  bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]
// amber:   bg-[rgba(245,158,11,0.1)]  text-[#f59e0b] border border-[rgba(245,158,11,0.2)]
// danger:  bg-[rgba(248,113,113,0.1)] text-red-400   border border-[rgba(248,113,113,0.2)]
```

### Empty state
```tsx
// src/components/ui/EmptyState.tsx
className="flex flex-1 flex-col items-center justify-center gap-2 p-7 text-center text-xs text-nw-600"
// Icon circle: h-9 w-9 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]
```

### Table
```tsx
// src/components/ui/Table.tsx
// Wrapper: w-full overflow-x-auto
// Table: w-full border-collapse text-[13px]

// Th: border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500
// Td: border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-300
// Tr hover: hover:bg-[rgba(255,255,255,0.03)]
```

### Workflow / integration card
```tsx
// Used on /workflows and /sync pages
className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4 transition-[background,border-color] duration-150 hover:border-[rgba(255,255,255,0.18)] hover:bg-nw-700"

// Icon box (40x40px)
className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-nw-800"

// Name: text-[13px] font-medium text-nw-200
// Description: text-[11px] text-nw-500
```

### Toggle switch
```tsx
// Active: bg-gold-500, inactive: bg-nw-600
// Thumb: bg-white, 14x14px, translate-x on active
```

### Steps / how-to list
```tsx
// Used on /sync page for "How to sync" instructions
// Step number circle
className="flex h-7 w-7 min-w-[28px] items-center justify-center rounded-full bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.3)] font-brand text-sm font-bold text-gold-300"

// Step title: text-[13px] font-medium text-nw-200
// Step desc:  text-[11px] text-nw-500
```

### Drop zone
```tsx
// Used on /sync and /media pages
className="flex flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] p-8 text-center transition-colors hover:border-[rgba(212,160,23,0.3)] hover:bg-[rgba(212,160,23,0.03)]"
// Upload icon: text-nw-500
// Primary text: text-[13px] font-medium text-nw-300
// Sub text: text-xs text-nw-500
```

### Review card (Branding Studio)
```tsx
// Used on /branding page
className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 p-4"
// Avatar: 36x36px rounded-full, initials, bg-gradient-to-br from-nw-600 to-nw-700 text-nw-300
// Name: text-[13px] font-medium text-nw-200
// Stars: text-gold-400 (filled) / text-nw-600 (empty)
// Date: text-[11px] text-nw-500
// Review text: text-xs text-nw-400 leading-relaxed
// "Create Post" button: gold variant, full width, mt-3
```

### Content/page card (Site Content grid)
```tsx
// Used on /content page
className="overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 transition-[background,border-color] duration-150 hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700"

// Card icon area (top, 56px tall)
className="flex h-14 items-center justify-center border-b border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]"
// Icon: 28x28px, rounded-[7px], color from page type

// Card body (p-4)
// Page name: text-[13px] font-medium text-nw-200
// Last updated: text-[11px] text-nw-500 flex items-center gap-1
// Published badge: <Badge variant="done">Published</Badge>

// Card footer (border-t, p-3, flex gap-2)
// "Edit Content" button: gold variant, flex-1
// Eye icon button: ghost variant, w-9
```

### Recharts theme (ALL charts)
```tsx
// Apply to every chart component
<XAxis stroke="#607080" tick={{ fill: '#8296b4', fontSize: 11 }} tickLine={false} axisLine={false} />
<YAxis stroke="#607080" tick={{ fill: '#8296b4', fontSize: 11 }} tickLine={false} axisLine={false} />
<CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
<Tooltip
  contentStyle={{ background: '#22293d', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 8, fontSize: 12 }}
  labelStyle={{ color: '#d2deee' }}
  itemStyle={{ color: '#f2cb55' }}
  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
/>
// Primary colour: stroke="#e8b933" fill="#e8b933"
// Area gradient:
<defs>
  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%"  stopColor="#e8b933" stopOpacity={0.2} />
    <stop offset="95%" stopColor="#e8b933" stopOpacity={0} />
  </linearGradient>
</defs>
```

---

## PAGE LAYOUTS

### Standard page layout (most pages):
```tsx
<div className="flex flex-col gap-4">
  <PageHeader eyebrow="..." title="..." titleGold="..." />
  {/* Optional stat row */}
  <div className="grid grid-cols-4 gap-[10px]">
    <StatCard ... /> × 4
  </div>
  {/* Main content */}
  <div className="grid grid-cols-[1fr_280px] gap-3">
    <Panel>...</Panel>
    <div className="flex flex-col gap-3">...</div>
  </div>
</div>
```

### Full-height page layout (editor, inbox):
```tsx
<div className="flex h-full flex-col gap-0">
  <div className="flex-shrink-0 ...header..."></div>
  <div className="flex flex-1 min-h-0 overflow-hidden">
    {/* content fills remaining height */}
  </div>
</div>
```

### Mobile page layout:
```tsx
// Replace all desktop grid layouts with single-column stacked cards
// Use card-row pattern (not tables)
// Wrap in padding: p-4 pb-20 (leave room for bottom tab bar)
```

---

## PAGE-SPECIFIC SPECS

### /content (Site Content)
- 3-column grid of content/page cards (see component above)
- Filter bar: "All / Published / Drafts" tabs at top
- Stats strip: Total Pages · Published · Drafts · Last Updated

### /media (Media Library)
- 4-column image grid (masonry or fixed aspect ratio)
- Upload drop zone at top
- Category filter chips: All, Hero, General, Logo, Kids
- Select mode for bulk operations
- Image card hover: overlay with filename + category badge

### /branding (Branding Studio)
- 2-column grid of review cards
- Overall rating header (stars + "X reviews on Google")
- Each card has Create Post gold button
- No decorative background

### /sync (WodBoard Sync)
- Single centred column, max-width 600px
- How-to-sync steps using steps component (3 numbered steps)
- Drop zone below steps
- Info note at bottom: text-[11px] text-nw-500

### /workflows (Workflows)
- 4-col stat row at top
- Workflow cards grouped by category (section label above each group)
- Each workflow card: icon + name + badge (Active/Paused) + toggle + chevron
- Stats below name: Active/Completed/Pending in text-[11px] text-nw-500

### /inbox (Inbox Intelligence)
- Tall layout: stat row + split panel (list left, detail right)
- Email list items: sender, subject, preview, time, category badge
- Selected email shows full detail in right panel
- Category filters: All, Needs Attention, New Lead, Receipt, Newsletter

### /financials (Financials)
- 4-col stat row (Monthly Revenue gold, others default)
- 2-col grid: chart panel left (2/3), breakdown + transactions right (1/3)
- All charts use Recharts gold theme

### /leads (Engagement)
- 4-col stat row
- Contacts table in Panel with search + filter
- Right column: mini chart + SMS summary panel

### /settings (System Settings)
- Tab nav: General · Integrations · Security · Notifications
- Tab active: border-b-2 border-gold-400 text-gold-300
- Tab inactive: border-transparent text-nw-400 hover:text-nw-200
- Settings fields in panels, 2-col layout

### /blog/manage (Blog)
- Table of posts in Panel
- New Post gold button top right
- Published/Draft badges
- Edit/Delete action buttons per row

### /mailchimp (Email Campaigns)
- 4-col stat row
- Campaigns table
- New Campaign gold button

---

## WHAT TO DELETE / REPLACE

These patterns exist in the current codebase and must be removed:

```
❌ Any component with: bg-black, bg-[#0a0a0a], bg-[#111], bg-gray-900, bg-zinc-900
✅ Replace with: bg-nw-900 (page) or bg-nw-750 (card/panel)

❌ Any animated background: FlowFieldBackground, swirl CSS, gold-swirl, decorative canvas
✅ Delete entirely. No replacement.

❌ Yellow buttons: bg-yellow-400, bg-[#f5c518], text-black on yellow
✅ Replace with Button variant="gold" (bg-[rgba(212,160,23,0.12)] text-gold-300)

❌ Old card styles: bg-gray-800, bg-[#1a1a1a], border-gray-700
✅ Replace with: bg-nw-750 border-[rgba(255,255,255,0.11)]

❌ Old text colours: text-gray-300, text-gray-400, text-white (on cards)
✅ Replace with: text-nw-200, text-nw-400, text-nw-300 respectively

❌ Hamburger sidebar drawer on mobile
✅ Replace with BottomTabBar component (already exists at src/components/mobile/BottomTabBar.tsx)

❌ Any page missing a PageHeader component
✅ Add PageHeader with eyebrow + title at top of every page
```

---

## HOW CLAUDE CODE SHOULD WORK THROUGH THIS

1. **Read this file completely first**
2. **Open `nwhub-redesign.html` in browser** — this is the visual law
3. Work in this order:
   - `tailwind.config.ts` — add all tokens
   - `src/app/layout.tsx` — fonts
   - `src/components/layout/Sidebar.tsx`
   - `src/components/layout/TopBar.tsx`
   - `src/components/mobile/MobileAppBar.tsx`
   - `src/components/mobile/BottomTabBar.tsx`
   - `src/app/(dashboard)/layout.tsx`
   - Shared UI: `Card.tsx`, `Button.tsx`, `Badge.tsx`, `Input.tsx`, `Table.tsx`, `EmptyState.tsx`, `PageHeader.tsx`
   - `src/components/widgets/dashboard/StatCard.tsx`
   - Then every page component: `/`, `/financials`, `/leads`, `/content`, `/blog/manage`, `/mailchimp`, `/workflows`, `/branding`, `/sync`, `/media`, `/settings`, `/inbox`, `/enquiries`
4. **Keep all data fetching, API calls, props, and logic** — only change classNames and visual structure
5. **After each file: confirm completion** before moving on
6. **Run `git diff` before each commit** to verify no logic was lost

---

## INBOX INTELLIGENCE PAGE — RESTORE AND REBUILD

This page (`/inbox`) was accidentally deleted. Restore it:

**`src/app/(dashboard)/inbox/page.tsx`** — server component, renders `<InboxClient />`
**`src/app/(dashboard)/inbox/InboxClient.tsx`** — client component with:
- Fetch emails from `/api/inbox/emails`
- Filter by category state
- Split panel layout (list + detail)
- Apply full NWHub design system

If git history is available: `git log --oneline -- src/app/(dashboard)/inbox/` to find last good commit.

---

*This SKILL.md is the single source of truth for all NWHub UI decisions.
Visual reference: `nwhub-redesign.html` in project root.
Last updated: March 2026*
