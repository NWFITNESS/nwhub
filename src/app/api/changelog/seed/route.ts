import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth-guard'

const SESSION_ENTRIES = [
  {
    project: 'nwhub',
    title: 'Full design system colour audit and standardisation',
    description: 'Replaced off-palette gold (#f2ca50, #d4a017) with design system #c9a70a across 23 files. Standardised status colours: #4ade80→#22c55e (green), #f87171→#ef4444 (red), #60a5fa→#3b82f6 (blue) across 45+ files. Updated globals.css --r-green variable.',
    reason: 'Inconsistent colours made the UI feel unpolished and brand-disconnected. Standardising to the design system tokens ensures visual consistency and makes future changes easier — change one variable, update everywhere.',
    category: 'design',
    level: 'improvement',
    files_changed: 68,
    commit_hash: 'a751583',
  },
  {
    project: 'nwhub',
    title: 'Added error boundaries for dashboard',
    description: 'Created error.tsx and not-found.tsx in the dashboard route group. Error page shows styled retry button, 404 shows back-to-dashboard link. Both match NWHub dark theme with gold accents.',
    reason: 'Unhandled errors crashed the entire app with no recovery option. Error boundaries catch errors gracefully and let users retry without refreshing the whole page.',
    category: 'fix',
    level: 'improvement',
    files_changed: 2,
    commit_hash: 'a751583',
  },
  {
    project: 'nwhub',
    title: 'Fixed sidebar navigation — added Contacts, Enquiries, To-Do',
    description: 'Added Contacts and Enquiries as sub-items under Members section. Added To-Do as standalone item (later removed as redundant). These pages existed but were unreachable from the sidebar.',
    reason: 'Users could only reach these pages via direct URL or mobile widgets. Adding them to the sidebar makes the CRM features discoverable and accessible.',
    category: 'fix',
    level: 'fix',
    files_changed: 1,
    commit_hash: 'a751583',
  },
  {
    project: 'nwhub',
    title: 'Removed debug console.log statements',
    description: 'Cleaned console.log from 9 server files (webhook, gmail, outlook, SEO, kids actions) and console.error from 3 client components (MediaGrid, RegisterPageClient, invoices).',
    reason: 'Debug statements in production leak internal information and clutter browser consoles. Removing them keeps logs clean and reduces noise for real errors.',
    category: 'cleanup',
    level: 'info',
    files_changed: 12,
    commit_hash: 'a751583',
  },
  {
    project: 'nwhub',
    title: 'Reorganised lib/ into logical subdirectories',
    description: '15 files moved into 5 new subdirectories: email/ (classifier, invoice-extractor, resend, rules-engine), gmail/ (client, attachments, processor), xero/ (client, auth, matcher), invoices/ (pipeline, extractor, storage), social/ (connections, publisher). All import paths updated across codebase.',
    reason: '29 flat files in lib/ made it hard to find related code. Grouping by domain (email, gmail, xero, invoices, social) improves developer navigation and reduces cognitive load.',
    category: 'architecture',
    level: 'improvement',
    files_changed: 61,
    commit_hash: '1502ddc',
  },
  {
    project: 'nwhub',
    title: 'Split content-defaults.ts (48KB) into per-page files',
    description: 'Monolith content-defaults.ts split into 16 individual page files under content-defaults/ directory with shared index.ts re-export. Each page (home, training, membership, etc.) has its own file.',
    reason: '48KB monolith was unwieldy to edit and caused merge conflicts. Per-page files allow parallel editing and make it easy to locate defaults for any specific page.',
    category: 'architecture',
    level: 'improvement',
    files_changed: 17,
    commit_hash: '1502ddc',
  },
  {
    project: 'nwhub',
    title: 'Consolidated email campaigns to Mailchimp system',
    description: 'Removed legacy /email/campaigns pages and API routes (Resend-based). Updated sidebar and mobile menu to route through Mailchimp system. Removed CampaignBuilder, CampaignsList, MobileEmailCampaigns components.',
    reason: 'Two parallel email systems caused confusion — the Mailchimp system had scheduling, templates, AI, and analytics while the legacy system was incomplete. Consolidating removes confusion and dead code (-788 lines).',
    category: 'cleanup',
    level: 'improvement',
    files_changed: 11,
    commit_hash: '6e669f0',
  },
  {
    project: 'nwhub',
    title: 'Accessibility improvements — 25+ fixes across 7 files',
    description: 'Added aria-label to all icon-only buttons (TopBar, Sidebar, Modal, MediaGrid, Calendar). Added role="dialog" + aria-modal to Modal and popup overlays. Added aria-hidden to decorative SVGs. Added keyboard support (Enter/Space) to Sidebar nav items.',
    reason: 'Icon-only buttons and modals were invisible to screen readers. Keyboard users couldn\'t navigate the sidebar. These fixes bring the app closer to WCAG compliance and improve usability for all users.',
    category: 'accessibility',
    level: 'improvement',
    files_changed: 7,
    commit_hash: '46aa804',
  },
  {
    project: 'nwhub',
    title: 'Added focus trapping to Modal component',
    description: 'Tab/Shift+Tab now cycles within modal. Focus saved on open, restored on close. First focusable element auto-focused when modal opens.',
    reason: 'Without focus trapping, pressing Tab escapes the modal to background elements — confusing for keyboard and screen reader users. Focus trapping is a WCAG requirement for modal dialogs.',
    category: 'accessibility',
    level: 'improvement',
    files_changed: 1,
    commit_hash: '6e669f0',
  },
  {
    project: 'nwhub',
    title: 'System Status widget now shows live integration connections',
    description: 'New /api/system-status route checks global_settings for Gmail, Xero, Mailchimp tokens and social connections. Widget shows live connected/not-connected status for 7 integrations. Replaced hardcoded fake data.',
    reason: 'The old widget showed fake static values (Supabase: Operational, Vercel: Live). Live status lets admins quickly see which integrations need attention without navigating to each one.',
    category: 'feature',
    level: 'improvement',
    files_changed: 2,
    commit_hash: '278fc3e',
  },
  {
    project: 'nwhub',
    title: 'Website Visitors chart now pulls from Google Analytics',
    description: 'New /api/analytics/visitors route fetches GA4 session data via Data API v1beta. Chart shows live GA4 data with contextual labels (Today, date+time). Falls back to page_views data while loading.',
    reason: 'The page_views table only tracked visits from our own tracking pixel — missing most traffic. GA4 provides comprehensive visitor data including all traffic sources, making the chart actually useful.',
    category: 'feature',
    level: 'improvement',
    files_changed: 3,
    commit_hash: '6c44faf',
  },
  {
    project: 'nwhub',
    title: 'Built full enquiry management system with reply and notifications',
    description: 'New enquiry detail view with conversation thread, inline reply composer (sends via Resend), auto-mark-as-read. Real-time Supabase toast notifications for new enquiries. Dashboard click-through to individual enquiries. New enquiry_replies table.',
    reason: 'Previously could only view enquiries in a table and reply via mailto: link. The new system lets staff manage the full customer journey from receipt → read → reply → resolved, all within NWHub.',
    category: 'feature',
    level: 'improvement',
    files_changed: 9,
    commit_hash: 'c80899b',
  },
  {
    project: 'nwhub',
    title: 'Redesigned enquiries page with premium inbox-style UI',
    description: 'Status filter cards with counts, full-text search, inbox-style list with avatar initials, colour-coded type/status pills, time-ago, message preview. Detail view with timeline thread, contact sidebar, segmented status toggle.',
    reason: 'The original enquiries page was a basic table with a modal — it felt like a database viewer, not an admin tool. The redesign makes it feel like a professional inbox (Linear/Superhuman quality) and speeds up the enquiry workflow.',
    category: 'design',
    level: 'improvement',
    files_changed: 2,
    commit_hash: 'b5f6a11',
  },
  {
    project: 'nwhub',
    title: 'Animated sun/moon theme toggle',
    description: 'SVG sun↔moon morph with spring physics. Sun rays shrink and rotate, center circle swells into crescent. Soft click sound. Replaces static icon swap.',
    reason: 'The old toggle was a static icon swap with no animation — felt cheap. The animated morph adds delight and makes the interaction feel premium and intentional.',
    category: 'design',
    level: 'info',
    files_changed: 2,
    commit_hash: '86f6005',
  },
  {
    project: 'nwhub',
    title: 'Improved sidebar and topbar text visibility',
    description: 'Sidebar nav text brightened from #4a6080 to #8899b4, sub-items from #3a5070 to #6a80a8. Section labels enlarged 9→10px and brightened. TopBar height 56→60px, title 16→17px white, icon buttons 34→36px.',
    reason: 'Text was nearly invisible against the dark background in dark mode. Users had to squint to read navigation labels. The brightness increase makes every label clearly readable while maintaining the dark aesthetic.',
    category: 'design',
    level: 'improvement',
    files_changed: 2,
    commit_hash: 'de241dc',
  },
  {
    project: 'nwhub',
    title: 'Website Editor — all page icons + live published status',
    description: 'Added unique icons for all 17 pages (was missing 5). Fetches page_construction setting for live published/unpublished status. Shows draft counts. Unpublished pages show red badge and reduced opacity.',
    reason: 'Several pages used a fallback globe icon, making them hard to distinguish. Status was always "published" even for under-construction pages. Now reflects reality and helps editors prioritise work.',
    category: 'feature',
    level: 'improvement',
    files_changed: 2,
    commit_hash: '953787e',
  },
]

export async function POST() {
  const unauth = await requireAuth()
  if (unauth) return unauth

  const supabase = createAdminClient()

  // Check if already seeded
  const { count } = await supabase
    .from('changelog_entries')
    .select('*', { count: 'exact', head: true })

  if ((count ?? 0) > 0) {
    return NextResponse.json({ message: 'Already seeded', count })
  }

  const { error } = await supabase
    .from('changelog_entries')
    .insert(SESSION_ENTRIES)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: 'Seeded', count: SESSION_ENTRIES.length })
}
