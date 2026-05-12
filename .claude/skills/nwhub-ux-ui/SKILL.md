---
name: nwhub-ux-ui
description: >
  Northern Warrior Hub (NWHub) design system and UX standards for Claude Code.
  Use this skill for EVERY UI task in the NWHub admin panel or Northern Warrior website —
  any time you are building, editing, restyling, or creating a new page, component, section,
  card, chart, form, modal, table, empty state, loading state, or layout in either project.
  This includes new features, bug fixes that touch visual elements, dashboard widgets,
  engagement pages, content editors, email/SMS/WhatsApp/Mailchimp/Reviews sections,
  blog components, and any responsive or mobile work. Never build UI for NWHub or
  northernwarrior-v2 without reading this skill first. It defines every colour, spacing rule,
  component pattern, chart style, and interaction standard used across the entire product.
---

# NWHub & Northern Warrior — Design System & UX Standards

This skill defines the complete design language for two connected projects:
- **NWHub** — the admin panel (`nwhub` repo, runs on localhost:3001)
- **Northern Warrior website** — the public site (`northernwarrior-v2` repo, runs on localhost:3000)

Always read this before touching any UI file. Follow every rule here unless the user explicitly overrides it.

---

## 1. Colour Tokens

These are the source of truth. Use CSS variables or hardcoded hex — both are fine. Never invent new colours.

### NWHub Admin (Dark Theme)
```css
/* Backgrounds — darkest to lightest */
--bg-base:      #080808   /* page background */
--bg-surface:   #0d0d0d   /* sidebar, topbar */
--bg-card:      #111111   /* primary cards */
--bg-card-alt:  #161616   /* secondary cards, table rows */
--bg-input:     #1a1a1a   /* form inputs, dropdowns */
--bg-hover:     #202020   /* hover states */

/* Gold — the brand accent */
--gold:         #C9A70A   /* primary gold, active states, CTAs */
--gold-dim:     #967705   /* headings, borders, muted gold */
--gold-glow:    rgba(201,167,10,0.15)  /* glow backgrounds */
--gold-border:  rgba(201,167,10,0.25) /* card borders on hover/active */

/* Text */
--text:         #F0F0F0   /* primary text */
--text-muted:   rgba(255,255,255,0.50) /* secondary text, labels */
--text-subtle:  rgba(255,255,255,0.30) /* placeholder, timestamps */
--text-dim:     rgba(255,255,255,0.15) /* disabled, very secondary */

/* Borders */
--border:       rgba(255,255,255,0.07) /* default card border */
--border-hover: rgba(255,255,255,0.14) /* hovered border */
--border-gold:  rgba(201,167,10,0.25)  /* active/selected border */

/* Status colours */
--success:      #22C55E   /* green — done, live, published */
--warning:      #F59E0B   /* amber — draft, pending */
--danger:       #EF4444   /* red — error, delete, urgent */
--info:         #3B82F6   /* blue — informational */

/* Chart colours */
--chart-gold:   #C9A70A
--chart-green:  #22C55E
--chart-blue:   #3B82F6
--chart-red:    #EF4444
--chart-purple: #A855F7
```

### Northern Warrior Website (Public)
The website uses the same gold tokens but on lighter section backgrounds where needed. Match the existing site aesthetic — dark hero sections, white/light content sections, gold accents throughout.

---

## 2. Typography

### Font Stack
```
Primary:  'League Spartan', system-ui, sans-serif  (body, UI, labels, headings, stats — everything)
Mono:     'JetBrains Mono', monospace              (code, API keys, env vars)
```

### NWHub Type Scale
```
Page title (h1):      League Spartan, 700, 2rem,   #F0F0F0, tracking-wide uppercase
Section heading (h2): League Spartan, 600, 1.25rem, --gold-dim, tracking-wide uppercase
Card heading (h3):    League Spartan, 600, 0.95rem, #F0F0F0
Label / caption:      League Spartan, 500, 0.75rem, --text-muted, uppercase, tracking-wider
Body:                 League Spartan, 400, 0.875rem, --text-muted
Stat number:          League Spartan, 700, 3rem,    #F0F0F0  (dashboard big numbers)
Stat sub:             League Spartan, 400, 0.8rem,  --text-subtle
```

### Rules
- Never use `text-white` alone — use `text-[#F0F0F0]` or the variable
- Muted text should feel intentionally secondary, not broken
- Uppercase labels always have `tracking-[0.1em]` or wider
- Stat numbers always use Rajdhani for visual weight

---

## 3. Spacing System

Base unit: **4px (0.25rem)**. All spacing is a multiple of this.

### Standard gaps
```
Within a card:            p-6  (24px)
Between cards in a grid:  gap-5 or gap-6
Between page sections:    gap-6 or gap-8
Page padding:             p-6 or p-8
Top bar height:           h-16 (64px)
Sidebar width:            18rem (288px) — var(--sidebar-w)
```

### Card minimum heights
```
Stat card:          min-h-[130px]
Quick action card:  min-h-[120px]
Data table row:     h-14 (56px)
Empty state:        min-h-[300px]
Full page section:  min-h-[calc(100vh-5rem)]
```

### Rule
If anything feels cramped — add space. Generous padding makes the UI feel premium. Never let content touch card edges.

---

## 4. Component Patterns

### 4.1 Stat Card
Used on Overview dashboard and section headers.
```tsx
<div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px] 
                flex flex-col justify-between hover:border-[#967705]/30 transition-colors">
  <div className="flex items-center justify-between">
    <p className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">
      {label}
    </p>
    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
         style={{ background: iconBg }}>
      <Icon size={18} className="text-white/70" />
    </div>
  </div>
  <div>
    <p className="text-5xl font-bold text-white" style={{ fontFamily: 'League Spartan' }}>
      {value}
    </p>
    {trend && (
      <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
        <TrendIcon size={12} className={trend > 0 ? 'text-green-500' : 'text-red-500'} />
        {Math.abs(trend)}% vs last month
      </p>
    )}
  </div>
</div>
```

### 4.2 Standard Card
```tsx
<div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
  {/* content */}
</div>
```
On hover (interactive cards):
```tsx
className="... hover:border-[#967705]/40 hover:bg-[#1a1a1a] transition-all duration-200 cursor-pointer"
```

### 4.3 Section Header (inside a card)
```tsx
<div className="flex items-center justify-between mb-5 pb-4 
                border-b border-white/[0.06]">
  <div>
    <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">
      {eyebrow}
    </p>
    <h3 className="text-white font-semibold">{title}</h3>
  </div>
  {actions}
</div>
```

### 4.4 Primary Button (gold CTA)
```tsx
<button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                   text-black bg-gradient-to-r from-[#967705] to-[#C9A70A]
                   hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(201,167,10,0.25)]">
  <Icon size={15} />
  {label}
</button>
```

### 4.5 Secondary Button (ghost)
```tsx
<button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                   text-white/60 border border-white/[0.1] bg-white/[0.03]
                   hover:text-white hover:border-white/20 hover:bg-white/[0.06] 
                   transition-all duration-200">
  {label}
</button>
```

### 4.6 Danger Button
```tsx
<button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                   text-red-400 border border-red-500/20 bg-red-500/5
                   hover:bg-red-500/10 hover:border-red-500/40 transition-all">
  <Trash2 size={14} />
  Delete
</button>
```

### 4.7 Form Input
```tsx
<div className="flex flex-col gap-1.5">
  <label className="text-xs font-semibold text-white/40 uppercase tracking-[0.1em]">
    {label}
  </label>
  <input
    className="bg-[#1a1a1a] border border-white/[0.08] rounded-lg px-3.5 py-2.5
               text-sm text-white placeholder:text-white/20
               focus:outline-none focus:border-[#967705]/60 focus:ring-1 
               focus:ring-[#967705]/30 transition-colors"
  />
</div>
```

### 4.8 Badge / Status Pill
```tsx
// Published / Success
<span className="px-2 py-0.5 rounded-full text-xs font-semibold 
                 bg-green-500/10 text-green-400 border border-green-500/20">
  Published
</span>

// Draft / Warning  
<span className="px-2 py-0.5 rounded-full text-xs font-semibold
                 bg-amber-500/10 text-amber-400 border border-amber-500/20">
  Draft
</span>

// Error / Danger
<span className="px-2 py-0.5 rounded-full text-xs font-semibold
                 bg-red-500/10 text-red-400 border border-red-500/20">
  Error
</span>

// Gold / Active
<span className="px-2 py-0.5 rounded-full text-xs font-semibold
                 bg-[#967705]/15 text-[#C9A70A] border border-[#967705]/25">
  Active
</span>
```

### 4.9 Table
```tsx
<div className="bg-[#161616] border border-white/[0.06] rounded-xl overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-white/[0.06]">
        <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/30 
                       uppercase tracking-[0.1em]">
          {heading}
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] 
                               transition-colors">
          <td className="px-5 py-4 text-sm text-white/70">{row.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## 5. Charts & Data Visualisation

Always use **recharts** (`import { ... } from 'recharts'`). It is already installed.

### 5.1 Line Chart (member growth, email stats)
```tsx
<ResponsiveContainer width="100%" height={240}>
  <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
    <XAxis 
      dataKey="month" 
      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />
    <YAxis 
      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />
    <Tooltip
      contentStyle={{ 
        background: '#1a1a1a', 
        border: '1px solid rgba(201,167,10,0.3)',
        borderRadius: '8px',
        color: '#F0F0F0'
      }}
    />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="#C9A70A" 
      strokeWidth={2}
      dot={{ fill: '#C9A70A', strokeWidth: 0, r: 4 }}
      activeDot={{ r: 6, fill: '#C9A70A' }}
    />
  </LineChart>
</ResponsiveContainer>
```

### 5.2 Bar Chart (campaign performance, enquiries by week)
```tsx
<BarChart data={data}>
  <Bar dataKey="value" fill="#C9A70A" radius={[4,4,0,0]} opacity={0.85} />
  {/* Same CartesianGrid, XAxis, YAxis, Tooltip as above */}
</BarChart>
```

### 5.3 Area Chart (subscriber growth)
```tsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#C9A70A" stopOpacity={0.15}/>
      <stop offset="95%" stopColor="#C9A70A" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <Area type="monotone" dataKey="value" 
        stroke="#C9A70A" strokeWidth={2}
        fill="url(#goldGrad)" />
</AreaChart>
```

### 5.4 Donut / Pie Chart (breakdown stats)
```tsx
<PieChart>
  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80}
       dataKey="value" paddingAngle={3}>
    {data.map((entry, i) => (
      <Cell key={i} fill={CHART_COLORS[i]} />
    ))}
  </Pie>
  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(201,167,10,0.3)' }} />
</PieChart>
```

### Chart rules
- Always wrap in a `bg-[#161616] rounded-xl p-6` card
- Always show a title and optional period toggle (6M / 1Y / All)
- Tooltips always use dark background `#1a1a1a` with gold border
- Grid lines always `rgba(255,255,255,0.04)` — barely visible
- Axes always `rgba(255,255,255,0.30)` — subtle, no axis lines
- Use placeholder/mock data until real data flows — never show empty charts

---

## 6. Empty States

Every list, table, or data section must have a proper empty state. Never let a section collapse to zero height.

```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3">
  <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08]
                  flex items-center justify-center">
    <Icon size={20} className="text-white/20" />
  </div>
  <p className="text-sm font-medium text-white/40">{title}</p>
  <p className="text-xs text-white/20 text-center max-w-[240px]">{description}</p>
  {cta && (
    <button className="mt-2 px-4 py-2 text-xs font-semibold text-[#C9A70A] 
                       border border-[#967705]/30 rounded-lg hover:bg-[#967705]/10 
                       transition-colors">
      {cta}
    </button>
  )}
</div>
```

---

## 7. Loading States

Use skeleton screens, never spinners alone.

```tsx
// Skeleton card
<div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6 min-h-[130px]">
  <div className="skeleton h-3 w-24 rounded mb-4" />
  <div className="skeleton h-10 w-20 rounded mb-2" />
  <div className="skeleton h-2 w-32 rounded" />
</div>

// globals.css already has .skeleton animation — use it
```

---

## 8. Page Layout Structure

Every NWHub page follows this exact structure:
```tsx
export default function PageName() {
  return (
    <div className="flex flex-col gap-6 p-8 min-h-[calc(100vh-5rem)]">
      
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold text-[#967705] uppercase tracking-[0.15em] mb-1">
          NORTHERN WARRIOR HUB
        </p>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'League Spartan' }}>
          Page Title
        </h1>
        <p className="text-sm text-white/40 mt-1">Page description</p>
      </div>

      {/* Stats row — 4 across */}
      <div className="grid grid-cols-4 gap-5">
        {/* StatCard × 4 */}
      </div>

      {/* Main chart */}
      <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-6">
        {/* Chart */}
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          {/* Main content / table / feed */}
        </div>
        <div className="col-span-1">
          {/* Side panel / quick actions / checklist */}
        </div>
      </div>

    </div>
  )
}
```

---

## 9. Overview Dashboard Specifics

The Overview page must include exactly:

**Greeting section:**
```tsx
<div>
  <p className="text-xs text-white/30 uppercase tracking-[0.15em]">ADMIN PANEL</p>
  <h1 style={{ fontFamily: 'League Spartan' }}>
    <span className="text-white font-bold text-4xl">Northern Warrior </span>
    <span className="text-[#C9A70A] font-bold text-4xl">Hub</span>
  </h1>
  <p className="text-white/30 text-sm mt-1">{formattedDate}</p>
</div>
```

**4 stat cards:**
1. Total Members — icon: `Users`, iconBg: `rgba(201,167,10,0.15)`
2. Email Subscribers — icon: `Mail`, iconBg: `rgba(59,130,246,0.15)`
3. Unread Enquiries — icon: `MessageSquare`, iconBg: danger colour if > 0
4. Draft Posts — icon: `FileEdit`, iconBg: `rgba(168,85,247,0.15)`

**Member growth line chart** — 6 months of data, gold line

**Two columns below:**
- Left (2/3): Recent Enquiries feed with avatar, name, message preview, timestamp
- Right (1/3): Setup Checklist with gold progress bar

**Quick Actions grid (2×2):**
- Contacts & Enquiries
- Edit Website Content  
- Blog & Posts
- Email Campaigns

---

## 10. Interaction & Animation Rules

- **Hover transitions:** always `transition-all duration-200` or `transition-colors duration-200`
- **Card hover:** subtle border brighten + very slight background lighten — never dramatic
- **Button hover:** opacity shift or border brighten — never colour change
- **Active/selected states:** gold border `border-[#967705]/40` + gold text
- **Focus states:** `focus:outline-none focus:ring-1 focus:ring-[#967705]/30 focus:border-[#967705]/60`
- **Page load animations:** stagger children with `animation-delay` if adding entrance animations
- **No jarring transitions** — this is an admin tool, subtlety over showiness

---

## 11. Scrollbar Styling

Always include this for any scrollable container:
```css
.your-container::-webkit-scrollbar { width: 8px; }
.your-container::-webkit-scrollbar-track { background: #0d0d0d; }
.your-container::-webkit-scrollbar-thumb { background: rgba(150,119,5,0.4); border-radius: 4px; }
.your-container::-webkit-scrollbar-thumb:hover { background: rgba(201,167,10,0.6); }
```

The globals.css already has a global version — scope it to specific containers when you need a bigger thumb (e.g., the visual editor canvas uses 12px width).

---

## 12. Responsive Rules

NWHub is primarily a desktop tool but must not break on tablet:
- Sidebar collapses below 1024px (already implemented)
- 4-column stat grids become 2-column at `md:` breakpoint
- 3-column layouts become 1-column at `md:` breakpoint
- Tables get horizontal scroll wrapper: `<div className="overflow-x-auto">`
- Never hide critical actions on smaller screens — stack them instead

---

## 13. Northern Warrior Website Standards

For the public website (`northernwarrior-v2`), follow these additional rules:

**Sections:**
- Every section has a `data-section-key` attribute for the visual editor
- Dark sections: background `#080808` or `#0a0a0a`
- Light sections: background `#F5F5F0` or `white`
- Hero sections: full viewport height `h-[100dvh]`, background image with `object-cover`

**CTA Buttons on website:**
- Primary: gold gradient background, black text, `rounded-full` for main CTAs
- Secondary: transparent with gold border

**Typography on website:**
- Display headings: bold, large, often split across lines for impact
- Body: readable, generous line-height `leading-relaxed`
- Location tag: uppercase, small caps style, gold or muted

**Gold decorative elements:**
- Animated gold swirl/vine background (already exists) — reuse, don't recreate
- Gold line dividers between sections
- Gold accent text for kickers/eyebrow labels

---

## 14. Do Not

- ❌ Never use `height: 0` or `min-h-0` on content containers
- ❌ Never use `overflow-hidden` on a container that needs to scroll
- ❌ Never use `text-white` for muted/secondary text — use opacity variants
- ❌ Never create new colours outside the token system
- ❌ Never use spinners as the only loading state — use skeletons
- ❌ Never let empty states collapse to zero height
- ❌ Never use Tailwind `%` widths on tables — use fixed DXA or explicit px
- ❌ Never put `pointer-events-none` on interactive elements
- ❌ Never use `z-index` values above 50 without a comment explaining why
- ❌ Never render a chart with zero data and no empty/placeholder state

---

## 15. Quick Reference Cheatsheet

```
Card bg:         bg-[#161616]
Page bg:         bg-[#080808]  
Sidebar bg:      bg-gradient from #131313 to #0d0d0d
Border default:  border border-white/[0.06]
Border gold:     border border-[#967705]/25
Gold text:       text-[#C9A70A]
Gold dim text:   text-[#967705]
Muted text:      text-white/40 or text-white/50
Subtle text:     text-white/20 or text-white/30
Rounded cards:   rounded-xl
Card padding:    p-6
Page padding:    p-8
Section gap:     gap-6
Gold CTA:        from-[#967705] to-[#C9A70A] text-black
Success:         text-green-400 bg-green-500/10 border-green-500/20
Warning:         text-amber-400 bg-amber-500/10 border-amber-500/20
Danger:          text-red-400 bg-red-500/10 border-red-500/20
Info:            text-blue-400 bg-blue-500/10 border-blue-500/20
Font (all):      fontFamily: 'League Spartan'
Transition:      transition-all duration-200
```
---

## Mobile Design System — NWHub

> This section governs ALL mobile rendering across NWHub (viewport < 768px).
> Mobile is a first-class context, not a scaled-down desktop. Every page must be
> rebuilt using the patterns below — not shrunk, not scrolled horizontally.

---

### Core Mobile Rules (Non-Negotiable)

1. **No tables on mobile.** Tables are desktop components. On mobile, every table
   becomes a card list. No exceptions — not even "simple" two-column tables.

2. **No decorative backgrounds behind data.** The gold swirl / particle background
   is for hero sections, page headers, and marketing surfaces only. Any view that
   contains a list, form, or data table uses a clean `bg-[#0f0f0f]` surface with
   `bg-[#111111]` card rows. Mixing decorative backgrounds with readable data
   actively harms legibility.

3. **Minimum touch target: 44px height.** Every tappable element — buttons, row
   items, filter chips, nav items — must be at least 44px tall. Never rely on a
   checkbox or small icon as the only tap target for a row action.

4. **No horizontal scrolling on data views.** If content doesn't fit at 360px wide,
   the layout is wrong. Restructure — don't scroll.

5. **Thumb zone first.** Primary actions (Add, Save, primary CTA) live at the
   bottom of the screen as FABs or full-width buttons. Navigation lives in the
   bottom tab bar. Top-bar actions are limited to back navigation and secondary
   icons only.

---

### Breakpoint Strategy

```
Mobile:  < 768px  → Full mobile layout (this section)
Tablet:  768–1024px → Sidebar collapses to icon rail, content full width
Desktop: > 1024px → Current desktop layout unchanged
```

Use Tailwind responsive prefixes: `sm:` for tablet+, `lg:` for desktop+.
Default (no prefix) = mobile. Write mobile-first.

---

### Navigation — Bottom Tab Bar

Replace the hamburger sidebar entirely on mobile with a bottom tab bar.

**Structure:**
```
[Overview] [Members] [Classes] [Reports] [More ▸]
```

- "More" opens a bottom sheet with: Marketing, Email Campaigns, Settings, Billing
- Active tab: gold icon + gold label (`text-[#e0c97f]`)
- Inactive: muted icon + muted label (`text-[#444]`)
- Bar background: `bg-[#0d0d0d]` with `border-t border-[#1e1e1e]`
- Height: 56px + safe area inset (`pb-safe` or `padding-bottom: env(safe-area-inset-bottom)`)
- Icons: 20px, stroke-based, never filled

**Tailwind implementation pattern:**
```tsx
// Bottom nav wrapper
<nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d] border-t border-[#1e1e1e]
                pb-[env(safe-area-inset-bottom)] flex lg:hidden z-50">
  {tabs.map(tab => (
    <button key={tab.id}
      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[44px]">
      <tab.Icon className={cn('w-5 h-5', isActive ? 'text-[#e0c97f]' : 'text-[#444]')} />
      <span className={cn('text-[10px]', isActive ? 'text-[#e0c97f]' : 'text-[#444]')}>
        {tab.label}
      </span>
    </button>
  ))}
</nav>
```

---

### Page Header (Mobile)

Every page has a slim top app bar. No decorative background on data pages.

```tsx
// Mobile page header
<header className="sticky top-0 z-40 bg-[#111] border-b border-[#1e1e1e]
                   flex items-center gap-3 px-4 h-14 lg:hidden">
  <BackButton />                                    // left: back chevron
  <h1 className="flex-1 text-[15px] font-medium text-white font-rajdhani">
    {pageTitle}
  </h1>
  <CountBadge count={total} />                      // right: gold pill count
  <IconButton icon={Search} />                      // right: optional search
</header>
```

**Count badge:**
```tsx
<span className="text-[10px] bg-[#2a2000] text-[#e0c97f] px-2 py-0.5 rounded-full">
  {count}
</span>
```

**Rule:** Hero section with gold swirl is only shown on the Overview dashboard
top card. All other pages go straight to the app bar + content. No hero on
Members, Leads, Classes, Marketing, Reports, or Settings pages on mobile.

---

### List Pages — Card Row Pattern

Used on: Members, Leads, Enquiries, Classes schedule, Email campaigns

#### Anatomy of a card row

```
┌─────────────────────────────────────────────────────┐
│  [Avatar]  Primary name (large, white, 600)          │
│            Secondary info (email / class / type)     │
│            Tertiary meta (phone / date / tag)        │
│                                              [dot][date] │
└─────────────────────────────────────────────────────┘
```

```tsx
<div className="bg-[#111] mx-2 my-1 rounded-xl px-3 py-3
                flex items-center gap-3 border border-[#1e1e1e]
                active:bg-[#1a1a1a] min-h-[64px]">

  {/* Avatar */}
  <div className="w-9 h-9 rounded-full bg-[#1e1e1e] border border-[#2a2a2a]
                  flex items-center justify-center flex-shrink-0
                  text-[11px] font-medium text-[#e0c97f]">
    {initials}
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <p className="text-[13px] font-medium text-[#eeeeee] truncate">{name}</p>
    <p className="text-[11px] text-[#555] truncate mt-0.5">{email}</p>
    <p className="text-[10px] text-[#444] mt-0.5">{meta}</p>
  </div>

  {/* Status */}
  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
    <StatusDot status={status} />
    <span className="text-[9px] text-[#444]">{date}</span>
  </div>

</div>
```

**Status dot colours:**
```
New / Hot:    bg-[#e0c97f]   (gold)
Active:       bg-[#4ade80]   (green)
Inactive:     bg-[#333]      (dark grey)
Overdue:      bg-[#f87171]   (red)
```

**Highlighted row** (new this week, unread enquiry):
```tsx
className="... border-[#3a2e00] bg-[#0f0c00]"
```

---

### List Pages — Sections & Grouping

Never render a flat alphabetical list on mobile as the default view. Always
group by recency or status so the most actionable items surface first.

**Standard grouping order:**
1. "New this week" / "Needs attention" — highlighted rows
2. "This month"
3. "Older"

**Section header:**
```tsx
<div className="px-3 pt-3 pb-1">
  <span className="text-[10px] text-[#555] uppercase tracking-wider">
    {sectionLabel}
  </span>
</div>
```

---

### List Pages — Search & Filter Chips

Always place search + filter chips between the page header and the list.
Never inside a dropdown or modal on mobile.

```tsx
{/* Search */}
<div className="px-3 py-2 bg-[#111]">
  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg
                  flex items-center gap-2 px-3 h-10">
    <SearchIcon className="w-4 h-4 text-[#444] flex-shrink-0" />
    <input placeholder="Search name or email…"
           className="flex-1 bg-transparent text-[13px] text-white
                      placeholder:text-[#444] outline-none" />
  </div>
</div>

{/* Filter chips — horizontal scroll */}
<div className="flex gap-2 px-3 pb-2 overflow-x-auto no-scrollbar">
  {filters.map(f => (
    <button key={f.id}
      className={cn(
        'flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full border whitespace-nowrap',
        active === f.id
          ? 'bg-[#2a2000] border-[#4a3800] text-[#e0c97f]'
          : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888]'
      )}>
      {f.label}
    </button>
  ))}
</div>
```

**Standard filter sets per page:**

| Page       | Filters                                          |
|------------|--------------------------------------------------|
| Members    | All · Active · Inactive · Overdue                |
| Leads      | All · Hot · This week · No contact               |
| Enquiries  | All · New · Contacted · Converted · Closed       |
| Classes    | All · Today · This week · [class type chips]     |
| Campaigns  | All · Draft · Sent · Scheduled                   |

---

### FAB — Floating Action Button

Every list page has exactly one primary action as a FAB, pinned above the
bottom nav bar.

```tsx
<button className="fixed bottom-[calc(56px+env(safe-area-inset-bottom)+12px)]
                   left-4 right-4 bg-[#e0c97f] text-[#0d0d0d]
                   font-medium text-[13px] font-rajdhani tracking-wide
                   h-12 rounded-xl flex items-center justify-center gap-2
                   active:scale-[0.98] transition-transform z-40 lg:hidden">
  <PlusIcon className="w-4 h-4" />
  {actionLabel}  {/* "Add Member", "Add Lead", "New Campaign" etc. */}
</button>
```

**Rule:** FAB is only shown on list pages. It is hidden on detail pages,
forms, and the Overview dashboard (which uses quick-action cards instead).

---

### Detail / Profile Pages

When a card row is tapped, navigate to a full-screen detail page.
Never use a slide-over panel or modal on mobile — always a full page.

**Page structure:**
```
[App bar: back + name + action icon (⋯)]
[Profile header card — avatar large, name, status badge, key stat]
[Section cards stacked vertically]
  → Contact details card
  → Membership card
  → Notes card
  → Activity timeline card
[Bottom: primary action button full-width]
```

**Profile header card:**
```tsx
<div className="bg-[#111] mx-3 mt-3 rounded-2xl p-4 border border-[#1e1e1e]">
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 rounded-full bg-[#2a2000] border border-[#4a3800]
                    flex items-center justify-center text-[18px] font-medium
                    text-[#e0c97f] font-rajdhani">
      {initials}
    </div>
    <div className="flex-1 min-w-0">
      <h2 className="text-[17px] font-semibold text-white font-rajdhani truncate">
        {name}
      </h2>
      <p className="text-[12px] text-[#555] mt-0.5">{memberSince}</p>
      <StatusBadge status={status} />
    </div>
  </div>
</div>
```

**Section card (reusable):**
```tsx
<div className="bg-[#111] mx-3 mt-2 rounded-2xl border border-[#1e1e1e] overflow-hidden">
  <div className="px-4 pt-4 pb-2 border-b border-[#1e1e1e]">
    <h3 className="text-[11px] text-[#555] uppercase tracking-wider">{sectionTitle}</h3>
  </div>
  <div className="px-4 py-3 space-y-3">
    {/* field rows */}
  </div>
</div>
```

**Field row inside a section card:**
```tsx
<div className="flex items-start justify-between gap-4 min-h-[36px]">
  <span className="text-[12px] text-[#555] flex-shrink-0 pt-0.5">{label}</span>
  <span className="text-[13px] text-[#ddd] text-right">{value}</span>
</div>
```

---

### Forms (Add / Edit pages)

Used on: Add Member, Add Lead, Add Class, Edit Profile, Notes

**Rules:**
- Full page, not a modal or drawer on mobile
- One column only — never two-column grid on mobile
- Label above input, not beside it
- Input height: 48px minimum
- Keyboard-aware: wrap in a scroll view, ensure inputs aren't hidden by keyboard
- Save button: fixed to bottom, full width, above the keyboard safe area

```tsx
{/* Form page wrapper */}
<div className="flex flex-col h-[100dvh] bg-[#0f0f0f]">
  <MobileAppBar title="Add Member" />

  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5
                  pb-[calc(80px+env(safe-area-inset-bottom))]">

    <FormField label="Full name">
      <input className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl
                        px-4 h-12 text-[14px] text-white outline-none
                        focus:border-[#e0c97f] transition-colors" />
    </FormField>

    <FormField label="Email address">
      <input type="email"
             className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl
                        px-4 h-12 text-[14px] text-white outline-none
                        focus:border-[#e0c97f] transition-colors" />
    </FormField>

    {/* Repeat for each field */}
  </div>

  {/* Fixed save button */}
  <div className="fixed bottom-0 left-0 right-0 px-4
                  pb-[calc(12px+env(safe-area-inset-bottom))] pt-3
                  bg-[#0f0f0f] border-t border-[#1e1e1e] lg:hidden">
    <button className="w-full h-12 bg-[#e0c97f] text-[#0d0d0d] font-medium
                       text-[14px] font-rajdhani tracking-wide rounded-xl
                       active:scale-[0.98] transition-transform">
      Save Member
    </button>
  </div>
</div>
```

**FormField wrapper:**
```tsx
const FormField = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[12px] text-[#888] block">{label}</label>
    {children}
  </div>
)
```

**Select / dropdown:**
Replace `<select>` with a bottom sheet picker on mobile. Never use a native
dropdown — it's unreadable in dark mode on Android.

```tsx
// Trigger
<button onClick={() => setPickerOpen(true)}
  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl
             px-4 h-12 text-[14px] text-left flex items-center justify-between">
  <span className={value ? 'text-white' : 'text-[#444]'}>
    {value || placeholder}
  </span>
  <ChevronDownIcon className="w-4 h-4 text-[#444]" />
</button>

// Bottom sheet (rendered in portal)
<BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)}>
  {options.map(opt => (
    <button key={opt.value}
      className="w-full text-left px-5 py-4 text-[14px] text-white
                 border-b border-[#1e1e1e] active:bg-[#1a1a1a]
                 flex items-center justify-between"
      onClick={() => { setValue(opt.value); setPickerOpen(false); }}>
      {opt.label}
      {value === opt.value && <CheckIcon className="w-4 h-4 text-[#e0c97f]" />}
    </button>
  ))}
</BottomSheet>
```

---

### Overview Dashboard (Mobile)

The overview is the one page that retains a hero section. Structure:

```
[Status bar]
[Hero card — NW logo, date, greeting — with subtle gold gradient, NO swirl bg]
[Stat cards — 2×2 grid]
[Quick actions — 2×2 grid]
[Recent activity feed — card list]
[Bottom nav]
```

**Hero card (mobile — simplified, no swirl):**
```tsx
<div className="mx-3 mt-3 rounded-2xl p-4 bg-[#1a1500] border border-[#3a2e00]">
  <p className="text-[10px] text-[#e0c97f] uppercase tracking-widest font-rajdhani">
    Northern Warrior Hub
  </p>
  <p className="text-[22px] font-semibold text-white font-rajdhani mt-1">
    Good morning, Mat
  </p>
  <p className="text-[12px] text-[#888] mt-0.5">{formattedDate}</p>
</div>
```

**Stat card grid (2×2):**
```tsx
<div className="grid grid-cols-2 gap-2 mx-3 mt-2">
  {stats.map(stat => (
    <div key={stat.id}
      className="bg-[#111] rounded-xl p-3 border border-[#1e1e1e]">
      <p className="text-[10px] text-[#555] uppercase tracking-wider">
        {stat.label}
      </p>
      <p className="text-[22px] font-semibold text-white font-rajdhani mt-1">
        {stat.value}
      </p>
      {stat.delta && (
        <p className={cn('text-[10px] mt-0.5',
          stat.delta > 0 ? 'text-[#4ade80]' : 'text-[#f87171]')}>
          {stat.delta > 0 ? '↑' : '↓'} {Math.abs(stat.delta)} this week
        </p>
      )}
    </div>
  ))}
</div>
```

**Quick action cards (2×2):**
```tsx
<div className="grid grid-cols-2 gap-2 mx-3 mt-2">
  {[
    { label: 'Add Member', icon: UserPlusIcon },
    { label: 'Add Lead',   icon: PlusCircleIcon },
    { label: 'New Class',  icon: CalendarIcon },
    { label: 'Send Email', icon: MailIcon },
  ].map(action => (
    <button key={action.label}
      className="bg-[#111] rounded-xl p-4 border border-[#1e1e1e]
                 flex flex-col items-start gap-3 active:bg-[#1a1a1a]
                 transition-colors min-h-[80px]">
      <action.icon className="w-5 h-5 text-[#e0c97f]" />
      <span className="text-[12px] font-medium text-[#ddd] font-rajdhani">
        {action.label}
      </span>
    </button>
  ))}
</div>
```

---

### Bottom Sheet Component

A reusable bottom sheet for pickers, "More" menu, swipe actions, and
any overlay that would be a modal on desktop.

```tsx
const BottomSheet = ({ open, onClose, title, children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0
                      bg-[#141414] rounded-t-2xl border-t border-[#2a2a2a]
                      pb-[env(safe-area-inset-bottom)]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-[#333]" />
        </div>
        {title && (
          <div className="px-5 pb-3 border-b border-[#1e1e1e]">
            <h3 className="text-[14px] font-medium text-white font-rajdhani">
              {title}
            </h3>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
```

---

### Typography Scale (Mobile)

| Role                | Size   | Weight | Color       | Font      |
|---------------------|--------|--------|-------------|-----------|
| Page title (appbar) | 15px   | 500    | #ffffff     | Rajdhani  |
| Hero heading        | 22px   | 600    | #ffffff     | Rajdhani  |
| Stat number         | 22px   | 600    | #ffffff     | Rajdhani  |
| Section label       | 10px   | 400    | #555555     | Inter     |
| Row primary (name)  | 13px   | 500    | #eeeeee     | Inter     |
| Row secondary       | 11px   | 400    | #555555     | Inter     |
| Row meta / date     | 10px   | 400    | #444444     | Inter     |
| Input label         | 12px   | 400    | #888888     | Inter     |
| Input value         | 14px   | 400    | #ffffff     | Inter     |
| Filter chip         | 11px   | 400    | #888/#e0c97f | Inter   |
| Button label        | 13–14px | 500   | #0d0d0d     | Rajdhani  |
| Badge / count       | 10px   | 400    | #e0c97f     | Inter     |

---

### Colour Roles (Mobile)

| Role                        | Value       |
|-----------------------------|-------------|
| Page background             | `#0f0f0f`   |
| Card / row background       | `#111111`   |
| Elevated surface            | `#141414`   |
| Input background            | `#1a1a1a`   |
| Border (default)            | `#1e1e1e`   |
| Border (emphasis)           | `#2a2a2a`   |
| Gold accent                 | `#e0c97f`   |
| Gold surface (new/hot)      | `#2a2000`   |
| Gold border (new/hot)       | `#3a2e00`   |
| Text primary                | `#eeeeee`   |
| Text secondary              | `#555555`   |
| Text muted                  | `#444444`   |
| Status: active              | `#4ade80`   |
| Status: overdue/alert       | `#f87171`   |
| Status: inactive            | `#333333`   |

---

### Page-by-Page Mobile Layout Reference

| Page              | List component | Grouping           | Filters                          | FAB label      |
|-------------------|----------------|--------------------|----------------------------------|----------------|
| Members           | Card row       | Active / Inactive  | All · Active · Inactive · Overdue | Add Member    |
| Leads             | Card row       | New / Older        | All · Hot · This week · No contact | Add Lead    |
| Enquiries         | Card row       | New / Contacted    | All · New · Contacted · Converted | —             |
| Classes schedule  | Card row       | Today / Upcoming   | All · Today · Week · [type]      | Add Class      |
| Email campaigns   | Card row       | Draft / Sent       | All · Draft · Sent · Scheduled   | New Campaign   |
| Marketing         | Card row       | —                  | —                                | —              |
| Reports           | Stat cards + chart | —             | Month picker (chip row)          | —              |
| Settings          | Section cards  | —                  | —                                | —              |

---

### What NOT to Do on Mobile

- ❌ Render a `<table>` or `<thead>/<tbody>` at any mobile breakpoint
- ❌ Use the gold particle / swirl background on list or form pages
- ❌ Place primary actions in the top-right of the app bar
- ❌ Use `<select>` elements — use bottom sheet pickers
- ❌ Use checkboxes as the primary row interaction target
- ❌ Open modals / slide-overs for detail views — always full page
- ❌ Use `overflow-x-auto` on list content to handle wide content
- ❌ Use font sizes below 11px anywhere
- ❌ Use the desktop sidebar at any width below 1024px
- ❌ Hardcode pixel widths — use `flex-1`, `min-w-0`, `truncate` to handle overflow