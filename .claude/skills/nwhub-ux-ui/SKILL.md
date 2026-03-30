# NWHub Design System — Claude Code Master Reference v4
# REPLACE: C:\Users\mathe\nwhub\.claude\skills\nwhub-ux-ui\SKILL.md
# Claude Code reads this on every session automatically.

---

## STOP. READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.

The Overview page (/) already looks correct. Open it in the browser and keep it open.
Every other page must match it. This file tells you exactly how.
Visual law: open `nwhub-redesign.html` in the project root before writing anything.

---

## WHAT IS BROKEN RIGHT NOW — FIX ON EVERY PAGE

### 1. Background is still black
Pages are `#0d1117`. Wrong.
- Page bg → `bg-nw-900` (#111520)
- Sidebar/topbar → `bg-nw-950` (#0b0e14)
- Cards/panels → `bg-nw-750` (#22293d)
- Inputs → `bg-nw-800` (#1c2333)

### 2. Zero padding — everything crammed together
- Content area: `p-[22px_24px]` desktop, `p-4 pb-20` mobile
- Between major sections: `gap-4` minimum
- Inside panels: `p-4` or `p-[17px]`
- Between stat cards: `gap-[10px]`

### 3. NWHub compass icon replaced with plain "NW" text box
`src/components/NWHubIcon.tsx` exists — USE IT in the sidebar logo row.
Import `NWHubIcon` and render it at 32×32px. Never replace with a div.

### 4. Stat cards are giant unstyled black boxes
Every stat card must use the `StatCard` component:
- `bg-nw-750`, `border border-[rgba(255,255,255,0.13)]`
- `shadow-gold-sm` at rest, `shadow-gold-md` on hover
- Gold accent bar at bottom, value in Rajdhani 32px bold

### 5. Buttons are flat grey blobs or raw `<button>` elements
- ALL primary/CTA → `variant="gold"`
- Secondary → `variant="default"`
- Destructive → `variant="danger"`
- Never use raw `<button>` without the Button component

### 6. Campaign/blog/contact lists float on black with no surface
Every list or table must live inside a `Panel` with a `PanelHeader`.
No content sits directly on the page background.

### 7. Section headers use a gold left-border bar
Remove ALL `border-l-2 border-gold-*` section header patterns.
Replace with `PanelHeader` eyebrow + title.

### 8. Tab navigation is wrong
Active: `border-b-2 border-gold-400 text-gold-300`
Inactive: `border-b-2 border-transparent text-nw-400 hover:text-nw-200`
Container: `flex gap-1 border-b border-[rgba(255,255,255,0.07)]`

### 9. Mobile is desktop scaled down — this is completely wrong
Mobile is a SEPARATE layout. Not the desktop layout at small width.
Desktop grids: `hidden md:grid`
Mobile gets stacked single-column card layouts: `md:hidden`
No sidebar on mobile. MobileAppBar + BottomTabBar only.

### 10. Icon inconsistency
All icons: inline SVG, 15–16px, `stroke="currentColor"` `strokeWidth="1.7"` `fill="none"`.
Icon containers: 28–32px, `rounded-[7px]`, `bg-[rgba(212,160,23,0.10)]` `border border-[rgba(212,160,23,0.22)]`.

---

## COLOUR TOKENS

The ONLY colours in NWHub. No `gray-*`, `zinc-*`, `slate-*`, or raw hex inline.

### `tailwind.config.ts` → `theme.extend.colors`:
```ts
'nw-950': '#0b0e14',
'nw-900': '#111520',
'nw-850': '#161c2a',
'nw-800': '#1c2333',
'nw-750': '#22293d',
'nw-700': '#293248',
'nw-600': '#374059',
'nw-500': '#607080',
'nw-400': '#8296b4',
'nw-300': '#aabdd8',
'nw-200': '#d2deee',
'nw-100': '#edf3fb',
'gold-600': '#b8870f',
'gold-500': '#d4a017',
'gold-400': '#e8b933',
'gold-300': '#f2cb55',
'gold-200': '#f8df8a',
'gold-100': '#fdf4d4',
```

### `theme.extend.boxShadow`:
```ts
'gold-sm': '0 4px 24px rgba(212,160,23,0.07), 0 1px 4px rgba(212,160,23,0.04)',
'gold-md': '0 6px 32px rgba(212,160,23,0.13), 0 2px 8px rgba(212,160,23,0.07)',
'sidebar': '4px 0 32px rgba(212,160,23,0.08), 2px 0 8px rgba(212,160,23,0.05)',
```

### `theme.extend.fontFamily`:
```ts
brand: ['Rajdhani', 'sans-serif'],
ui: ['Inter', 'sans-serif'],
```

### Inline rgba values (use these exact strings):
```
Panel border:         border-[rgba(255,255,255,0.11)]
Panel border hover:   hover:border-[rgba(255,255,255,0.18)]
Panel hover bg:       hover:bg-nw-700
Divider:              border-[rgba(255,255,255,0.07)]
Subtle bg:            bg-[rgba(255,255,255,0.04)]
Topbar border:        border-[rgba(255,255,255,0.09)]
Sidebar gold border:  border-[rgba(212,160,23,0.18)]
Gold icon bg:         bg-[rgba(212,160,23,0.10)]
Gold icon border:     border-[rgba(212,160,23,0.22)]
Gold subtle bg:       bg-[rgba(212,160,23,0.11)]
Gold button bg:       bg-[rgba(212,160,23,0.12)]
Gold button border:   border-[rgba(212,160,23,0.28)]
Status green:         #4ade80
Status amber:         #f59e0b
Status red:           #f87171
```

---

## TYPOGRAPHY

### `src/app/layout.tsx`:
```tsx
import { Rajdhani, Inter } from 'next/font/google'
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['500','600','700'], variable: '--font-brand' })
const inter = Inter({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-ui' })
// Apply: <html className={`${rajdhani.variable} ${inter.variable}`}>
```

### Scale:
| Role | Font | Size | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Page H1 | Rajdhani | 28px | 700 | 0.3px | — |
| Topbar brand | Rajdhani | 14px | 700 | 2px | upper |
| Logo name | Rajdhani | 12.5px | 700 | 1.8px | upper |
| Stat value | Rajdhani | 32px | 700 | -0.5px | — |
| Panel title | Inter | 13px | 500 | — | — |
| Nav items | Inter | 13px | 400/500 | — | — |
| Body | Inter | 13px | 400 | — | — |
| Card label | Inter | 10px | 600 | 1.1px | upper |
| Eyebrow | Inter | 9–10px | 600 | 1.4–1.8px | upper |
| Badge | Inter | 9px | 600 | 0.8px | upper |
| Table header | Inter | 10px | 600 | 1.1px | upper |
| Table cell | Inter | 13px | 400 | — | — |
| Description | Inter | 11–12px | 400 | — | — |

---

## APP SHELL

### Desktop (md+):
```
[Sidebar 58px collapsed / 228px expanded] [Topbar 54px]
                                           [Content p-[22px_24px] overflow-y-auto]
```

### Mobile (<md):
```
[MobileAppBar 48px]
[Content p-4 pb-20 overflow-y-auto]
[BottomTabBar 56px fixed bottom]
```

Global body: `bg-[#090c12] antialiased`
Dashboard layout bg: `bg-nw-900`
NO decorative backgrounds anywhere.

---

## SIDEBAR

File: `src/components/layout/Sidebar.tsx`
Add `hidden md:flex` to aside — sidebar never shows on mobile.

### Behaviour:
- Collapsed: `w-[58px]` — icons only, text `opacity-0`
- Expanded: `w-[228px]` — on `mouseenter` or `.pinned` class
- Transition: `transition-[width] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)]`
- Normal flow — main content shifts right naturally
- Active route: `usePathname().startsWith(href)` from `next/navigation`
- Accordion sub-menus: one open at a time
- Pull hint: dismissed via `localStorage.setItem('nwhub-hint','1')` on first hover

### Wrapper:
```tsx
<aside className={`hidden md:flex relative z-20 flex-shrink-0 flex-col bg-nw-950 border-r border-[rgba(212,160,23,0.18)] shadow-sidebar overflow-hidden transition-[width] duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${expanded ? 'w-[228px]' : 'w-[58px]'}`}>
```

### Logo row (h-[54px]):
```tsx
<div className="flex h-[54px] min-h-[54px] items-center gap-[11px] overflow-hidden whitespace-nowrap border-b border-[rgba(255,255,255,0.09)] px-[13px]">
  {/* NWHubIcon compass — NOT a plain "NW" text box */}
  <div className="flex h-8 w-8 min-w-[32px] flex-shrink-0 items-center justify-center">
    <NWHubIcon size={28} />
  </div>
  <div className={`pointer-events-none leading-[1.15] transition-opacity duration-[260ms] ${expanded ? 'opacity-100' : 'opacity-0'}`}>
    <span className="block font-brand text-[12.5px] font-bold uppercase tracking-[1.8px] text-white">Northern Warrior</span>
    <span className="text-[9.5px] uppercase tracking-[0.6px] text-nw-500">Admin Dashboard</span>
  </div>
</div>
```

### Section label:
```tsx
<div className={`overflow-hidden whitespace-nowrap px-[18px] text-[9px] font-semibold uppercase tracking-[1.6px] text-nw-600 transition-[opacity,max-height] duration-[260ms] ${expanded ? 'max-h-8 pt-3 pb-1 opacity-100' : 'max-h-0 opacity-0'}`}>
```

### Nav item:
```tsx
<div className={`relative mx-[7px] my-px flex h-[38px] cursor-pointer items-center gap-[10px] overflow-hidden whitespace-nowrap rounded-[7px] px-[11px] text-[13px] transition-colors duration-150 select-none ${active ? 'bg-[rgba(212,160,23,0.11)] font-medium text-gold-300' : 'text-nw-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-200'}`}>
  {active && <span className="absolute left-0 top-[22%] h-[56%] w-[2.5px] rounded-r-sm bg-gold-400" />}
  <span className="flex h-4 w-4 min-w-[16px] flex-shrink-0 items-center justify-center">{icon}</span>
  <span className={`flex flex-1 min-w-0 items-center justify-between transition-opacity duration-[260ms] ${expanded ? 'opacity-100' : 'opacity-0'}`}>
    {label}
    <span className="flex items-center gap-[5px] flex-shrink-0">
      {badge && <span className="rounded-[9px] bg-[rgba(212,160,23,0.18)] px-1.5 py-px text-[9px] font-semibold text-gold-300">{badge}</span>}
      {hasChildren && <ChevronIcon className={`text-nw-600 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />}
    </span>
  </span>
</div>
```

### Sub-items container:
```tsx
<div className={`overflow-hidden transition-[max-height] duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'max-h-56' : 'max-h-0'}`}>
```

### Sub-item:
```tsx
<div className={`relative mx-[7px] flex h-[30px] cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-[6px] pl-10 pr-[11px] text-xs transition-colors duration-150 before:absolute before:left-6 before:top-1/2 before:h-px before:w-[7px] ${subActive ? 'text-gold-300 before:bg-gold-600' : 'text-nw-500 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-300 before:bg-nw-700 hover:before:bg-nw-500'}`}>
  <span className={`transition-opacity duration-[260ms] ${expanded ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
</div>
```

### Nav structure:
```
MAIN
├── Overview           /
├── Inbox Intelligence /inbox       → Enquiries /enquiries, AI Chat /ai-chat, Contacts /contacts
├── Financials         /financials
└── Engagement         /leads       → Members /leads, Calendar /calendar, SMS /sms

PLATFORM
├── Content            /content     → Blog /blog/manage, Email /mailchimp, Editor /content, Media /media
└── System             /settings    → Integrations /sync, Settings /settings, Branding /branding, Workflows /workflows
```

### Sidebar footer:
```tsx
<div className="flex flex-shrink-0 items-center gap-[9px] overflow-hidden whitespace-nowrap border-t border-[rgba(255,255,255,0.09)] px-[11px] py-[10px]">
  <div className="flex h-[30px] w-[30px] min-w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-300 font-brand text-[11px] font-bold text-nw-950">MA</div>
  <div className={`min-w-0 flex-1 transition-opacity duration-[260ms] ${expanded ? 'opacity-100' : 'opacity-0'}`}>
    <div className="text-xs font-medium text-nw-200">Mat</div>
    <div className="text-[10px] text-nw-500">Administrator</div>
  </div>
  <button className={`flex rounded-[5px] p-1 text-nw-600 hover:text-nw-300 transition-[opacity,color] ${expanded ? 'opacity-100' : 'opacity-0'}`}>{/* sign out SVG 14px */}</button>
</div>
```

---

## TOPBAR (Desktop only)

File: `src/components/layout/TopBar.tsx`

```tsx
<header className="hidden md:flex h-[54px] min-h-[54px] flex-shrink-0 items-center gap-[14px] border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-[22px]">
  <span className="font-brand text-sm font-bold uppercase tracking-[2px] text-nw-300">NW Hub</span>
  <div className="h-[18px] w-px bg-[rgba(255,255,255,0.09)]" />
  <nav className="flex items-center gap-1.5 text-xs text-nw-500">
    Admin Panel <ChevronIcon /> <span className="text-nw-200">{pageTitle}</span>
  </nav>
  <div className="ml-auto flex items-center gap-2">{/* right buttons */}</div>
</header>
```

---

## MOBILE APP BAR

File: `src/components/mobile/MobileAppBar.tsx`

```tsx
<header className="flex md:hidden h-12 flex-shrink-0 items-center justify-between border-b border-[rgba(255,255,255,0.09)] bg-nw-950 px-4">
  {/* Left: back/menu icon text-nw-400 */}
  <div className="flex items-center gap-2">
    <NWHubIcon size={22} />
    <span className="font-brand text-sm font-bold uppercase tracking-[1.5px] text-white">{pageTitle}</span>
  </div>
  {/* Right: bell icon text-nw-400 */}
</header>
```

---

## BOTTOM TAB BAR (Mobile only)

File: `src/components/mobile/BottomTabBar.tsx`

```tsx
<nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 md:hidden items-center justify-around border-t border-[rgba(255,255,255,0.09)] bg-nw-950 px-2">
  {tabs.map(tab => (
    <button key={tab.href} className={`relative flex flex-col items-center gap-0.5 rounded-[8px] px-3 py-1.5 transition-colors ${active(tab.href) ? 'text-gold-300' : 'text-nw-500'}`}>
      {tab.icon /* 20x20px SVG */}
      <span className="text-[10px] font-medium">{tab.label}</span>
      {active(tab.href) && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-gold-400" />}
    </button>
  ))}
</nav>
```

Tabs: Overview `/`, Members `/leads`, Content `/content`, Revenue `/financials`, More (opens sub-menu)

---

## DASHBOARD LAYOUT

File: `src/app/(dashboard)/layout.tsx`

```tsx
<div className="flex h-screen min-h-[600px] overflow-hidden bg-nw-900">
  <Sidebar />
  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
    <TopBar pageTitle={title} />
    <MobileAppBar pageTitle={title} />
    <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-[22px_24px] md:pb-[22px]">
      {children}
    </main>
    <BottomTabBar />
  </div>
</div>
```

---

## SHARED COMPONENTS

### Panel + PanelHeader (`src/components/ui/Card.tsx`)
```tsx
export function Panel({ children, className }: Props) {
  return <div className={`overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.11)] bg-nw-750 ${className ?? ''}`}>{children}</div>
}

export function PanelHeader({ eyebrow, title, action }: Props) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2 border-b border-[rgba(255,255,255,0.07)] px-[17px] py-[11px]">
      {eyebrow && <span className="text-[9px] font-semibold uppercase tracking-[1.4px] text-nw-500">{eyebrow}</span>}
      {eyebrow && <div className="h-3 w-px bg-[rgba(255,255,255,0.09)]" />}
      <span className="text-[13px] font-medium text-nw-200">{title}</span>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}
```

### StatCard (`src/components/widgets/dashboard/StatCard.tsx`)
```tsx
export function StatCard({ label, value, sub, icon, gold = false }) {
  return (
    <div className="relative cursor-default overflow-hidden rounded-[10px] border border-[rgba(255,255,255,0.13)] bg-nw-750 p-[15px_17px_13px] shadow-gold-sm transition-[background,border-color,box-shadow] duration-[180ms] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700 hover:shadow-gold-md">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-400">{label}</span>
        {icon && <div className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)]">{icon}</div>}
      </div>
      <div className={`mt-2 font-brand text-[32px] font-bold leading-none tracking-[-0.5px] ${gold ? 'text-gold-300' : 'text-white'}`}>{value}</div>
      {sub && <div className="mt-1.5 flex items-center gap-1 text-[11px] text-nw-500">{sub}</div>}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${gold ? 'bg-gradient-to-r from-[rgba(212,160,23,0.65)] to-transparent' : 'bg-gradient-to-r from-nw-600 to-transparent'}`} />
    </div>
  )
}
```

### PageHeader (`src/components/layout/PageHeader.tsx`)
```tsx
export function PageHeader({ eyebrow, title, titleGold, description, date }) {
  return (
    <div className="flex flex-col gap-[3px]">
      {eyebrow && <span className="text-[10px] font-semibold uppercase tracking-[1.8px] text-nw-500">{eyebrow}</span>}
      <h1 className="font-brand text-[28px] font-bold leading-none tracking-[0.3px] text-white">
        {title}{titleGold && <span className="text-gold-400"> {titleGold}</span>}
      </h1>
      {description && <p className="mt-1 text-[13px] text-nw-400">{description}</p>}
      {date && <span className="mt-px text-xs text-nw-500">{date}</span>}
    </div>
  )
}
```

### Button (`src/components/ui/Button.tsx`)
```tsx
const base = 'inline-flex items-center gap-1.5 rounded-[7px] border font-medium transition-colors cursor-pointer'
const sizes = {
  sm: 'px-3 py-[5px] text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}
const variants = {
  default: 'border-[rgba(255,255,255,0.09)] bg-[rgba(255,255,255,0.04)] text-nw-300 hover:bg-[rgba(255,255,255,0.08)] hover:text-nw-100 hover:border-[rgba(255,255,255,0.14)]',
  gold:    'border-[rgba(212,160,23,0.28)] bg-[rgba(212,160,23,0.12)] text-gold-300 hover:bg-[rgba(212,160,23,0.22)]',
  ghost:   'border-transparent bg-transparent text-nw-400 hover:bg-[rgba(255,255,255,0.04)] hover:text-nw-200',
  danger:  'border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-red-400 hover:bg-[rgba(239,68,68,0.18)]',
}
```

### Badge (`src/components/ui/Badge.tsx`)
```tsx
const base = 'inline-flex items-center rounded-[8px] px-[7px] py-[2px] text-[9px] font-semibold uppercase tracking-[0.8px]'
const variants = {
  done:    'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  todo:    'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  gold:    'bg-[rgba(212,160,23,0.18)] text-gold-300  border border-[rgba(212,160,23,0.25)]',
  active:  'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  paused:  'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  sent:    'bg-[rgba(74,222,128,0.1)]  text-[#4ade80] border border-[rgba(74,222,128,0.2)]',
  draft:   'bg-[rgba(100,116,139,0.1)] text-nw-500    border border-[rgba(255,255,255,0.07)]',
  amber:   'bg-[rgba(245,158,11,0.1)]  text-[#f59e0b] border border-[rgba(245,158,11,0.2)]',
  danger:  'bg-[rgba(248,113,113,0.1)] text-red-400   border border-[rgba(248,113,113,0.2)]',
}
```

### Input (`src/components/ui/Input.tsx`)
```tsx
className="h-9 w-full rounded-[7px] border border-[rgba(255,255,255,0.09)] bg-nw-800 px-3 text-[13px] text-nw-200 placeholder:text-nw-500 outline-none transition-colors focus:border-[rgba(212,160,23,0.4)] focus:bg-nw-750"
```

### Table (`src/components/ui/Table.tsx`)
```tsx
// Wrapper: w-full overflow-x-auto
// table: w-full border-collapse text-[13px]
// Th: border-b border-[rgba(255,255,255,0.07)] px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[1.1px] text-nw-500
// Td: border-b border-[rgba(255,255,255,0.05)] px-4 py-3 text-nw-300
// Tr: transition-colors hover:bg-[rgba(255,255,255,0.03)]
```

### EmptyState (`src/components/ui/EmptyState.tsx`)
```tsx
// Outer: flex flex-1 flex-col items-center justify-center gap-2 p-7 text-center text-xs text-nw-600
// Icon circle: flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]
```

### Tab navigation
```tsx
<div className="flex gap-1 border-b border-[rgba(255,255,255,0.07)]">
  <button className={`-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${active ? 'border-gold-400 text-gold-300' : 'border-transparent text-nw-400 hover:text-nw-200'}`}>{label}</button>
</div>
```

### Drop zone
```tsx
className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] p-8 text-center transition-colors hover:border-[rgba(212,160,23,0.3)] hover:bg-[rgba(212,160,23,0.03)]"
// Icon: text-nw-500 / Primary: text-[13px] font-medium text-nw-300 / Sub: text-xs text-nw-500
```

### How-to steps
```tsx
// Step row: flex items-start gap-3 rounded-[10px] bg-nw-800 border border-[rgba(255,255,255,0.07)] p-4
// Number: flex h-7 w-7 min-w-[28px] items-center justify-center rounded-full bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.3)] font-brand text-sm font-bold text-gold-300
// Title: text-[13px] font-medium text-nw-200 / Desc: text-[11px] text-nw-500 mt-0.5
```

### Workflow card
```tsx
// Panel p-4
// Icon box: 40×40px rounded-[8px] border border-[rgba(255,255,255,0.1)] bg-nw-800 flex items-center justify-center
// Name: text-[13px] font-medium text-nw-200
// Desc: text-[11px] text-nw-500 mt-0.5 leading-relaxed
// Stats row: flex gap-4 mt-3 / each: label text-[10px] uppercase tracking-[0.8px] text-nw-600, value text-nw-300 font-medium text-xs mt-0.5
```

### Review card (Branding)
```tsx
// Panel p-4
// Avatar: 36×36px rounded-full bg-gradient-to-br from-nw-600 to-nw-700 text-nw-300 font-brand font-bold text-sm
// Name: text-[13px] font-medium text-nw-200 / Stars: text-gold-400 filled, text-nw-600 empty / Date: text-[11px] text-nw-500
// Review: text-xs text-nw-400 leading-relaxed mt-2
// "Use this review" button: variant="gold" w-full mt-3
```

### Template picker card (Branding Post Studio)
```tsx
// Unselected: bg-nw-800 rounded-[8px] p-3 border border-[rgba(255,255,255,0.09)] cursor-pointer hover:border-[rgba(255,255,255,0.18)]
// Selected: border-gold-400 bg-[rgba(212,160,23,0.08)]
// Name: text-[13px] font-medium text-nw-200 / Sub: text-[11px] text-nw-500
```

### Content page card (Site Content)
```tsx
// Panel with hover: transition-[background,border-color] hover:border-[rgba(212,160,23,0.22)] hover:bg-nw-700
// Icon area: h-14 flex items-center justify-center border-b border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]
// Body p-4: name text-[13px] font-medium text-nw-200, updated text-[11px] text-nw-500, Published badge
// Footer border-t p-3 flex gap-2: Edit gold flex-1, eye ghost w-9
```

### Recharts theme (ALL charts)
```tsx
<XAxis stroke="#607080" tick={{ fill: '#8296b4', fontSize: 11 }} tickLine={false} axisLine={false} />
<YAxis stroke="#607080" tick={{ fill: '#8296b4', fontSize: 11 }} tickLine={false} axisLine={false} />
<CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
<Tooltip contentStyle={{ background: '#22293d', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#d2deee' }} itemStyle={{ color: '#f2cb55' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
// Line/bar: stroke="#e8b933" fill="#e8b933"
// Area grad: from rgba(232,185,51,0.2) to rgba(232,185,51,0)
```

---

## PAGE LAYOUTS

### Standard (most pages):
```tsx
<div className="flex flex-col gap-4">
  <PageHeader ... />
  {/* Stat row: 4-col desktop, 2-col mobile */}
  <div className="hidden md:grid grid-cols-4 gap-[10px]"><StatCard />×4</div>
  <div className="grid grid-cols-2 gap-3 md:hidden"><StatCard />×2</div>
  {/* Main: 2-col desktop, stacked mobile */}
  <div className="flex flex-col gap-3 md:grid md:grid-cols-[1fr_280px]">
    <Panel>...</Panel>
    <div className="flex flex-col gap-3">...</div>
  </div>
</div>
```

### Full-height (inbox, editor):
```tsx
<div className="flex h-full flex-col">
  <div className="flex-shrink-0 border-b border-[rgba(255,255,255,0.07)] bg-nw-850 px-6 py-3">{/* sub-header */}</div>
  <div className="flex flex-1 min-h-0 overflow-hidden">{/* fills height */}</div>
</div>
```

---

## PAGE-SPECIFIC NOTES

### /mailchimp (Email Marketing)
- Audience stat → use `StatCard` component. NOT a giant standalone black box.
- Each campaign → its own Panel card, NOT raw text rows on black
- Campaign card: date (text-[11px] text-nw-500), title (text-[13px] font-medium text-nw-200), preview (text-[11px] text-nw-500), stats row
- Stats: sent count (text-nw-400), open rate (text-[#4ade80]), click rate (text-gold-300)
- All stat percentages shown as coloured text, not plain gray

### /blog/manage (Blog)
- Stats bar (posts/published/drafts) in a Panel at top — NOT floating on black
- Table inside Panel with PanelHeader — NOT raw table on page background
- Search input in PanelHeader action slot

### /workflows
- Each workflow group: section label (`text-[10px] font-semibold uppercase tracking-[1.2px] text-nw-500 mb-2 mt-4`) then workflow card Panels
- Stat numbers below workflow name: 3 columns (Active, Completed/Reviewed, Pending) in `flex gap-6`

### /branding
- Brand Guide tab: content in Panel cards with PanelHeader per section
- Post Studio tab: review cards in 2-col grid
- Template/aspect picker: grid of selectable cards inside a Panel

### /inbox — RESTORE FROM GIT
Run: `git log --oneline -- src/app/(dashboard)/inbox/`
Restore from last good commit, then apply design tokens.
Layout: stat row + flex-1 split panel (list + detail), full height

---

## FIND AND DELETE EVERYWHERE

```
❌ FlowFieldBackground, flow-field, swirl, gold-swirl, canvas animation
❌ bg-black, bg-[#0a0a0a], bg-[#0d1117], bg-[#111], bg-gray-9*, bg-zinc-9*
❌ bg-yellow-400, bg-yellow-500, text-black on yellow (old buttons)
❌ border-l-2 border-gold-* (old section header pattern)
❌ text-gray-*, text-zinc-*, border-gray-*, border-zinc-*
❌ Any sidebar/drawer shown on mobile

✅ bg-nw-900 (page), bg-nw-750 (card), bg-nw-950 (sidebar/topbar)
✅ Button variant="gold" for all primary actions
✅ Panel + PanelHeader for all content sections
✅ text-nw-200 (body), text-nw-400 (secondary), text-nw-500 (muted)
```

---

## ACCEPTANCE CRITERIA — RUN BEFORE MARKING ANY PAGE DONE

- [ ] Background is `bg-nw-900` — NOT black
- [ ] No decorative animated background visible
- [ ] PageHeader with eyebrow + title present
- [ ] All cards use `bg-nw-750 border-[rgba(255,255,255,0.11)] rounded-[10px]`
- [ ] StatCards have gold glow shadow
- [ ] No raw `<button>` — all use Button component
- [ ] No `bg-yellow-400` or flat yellow anywhere
- [ ] Text: white headings, `text-nw-200` body, `text-nw-400` secondary, `text-nw-500` muted
- [ ] No content floating on black — everything in Panel
- [ ] No gold left-border section headers — use PanelHeader
- [ ] NWHubIcon compass in sidebar (not "NW" text)
- [ ] Mobile: no sidebar, MobileAppBar shown, BottomTabBar shown
- [ ] Mobile: single-column layout, no 4-col grids
- [ ] Consistent 15-16px SVG icons throughout
- [ ] Badge component used for all status indicators
- [ ] Charts use gold Recharts theme

---

*Visual reference: `nwhub-redesign.html` — open and keep open during all work.
SKILL.md v4 — March 2026*
