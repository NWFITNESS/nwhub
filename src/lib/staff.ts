// Staff profile types and constants

export interface StaffProfile {
  id: string
  user_id: string
  display_name: string
  email: string
  role: 'owner' | 'admin' | 'staff'
  permissions: StaffPermissions
  status: 'active' | 'invited' | 'suspended'
  avatar_url: string | null
  last_login_at: string | null
  created_at: string
}

export interface StaffPermissions {
  overview: boolean
  inbox: boolean
  contacts: boolean
  financials: boolean
  invoices: boolean
  seo: boolean
  kids: boolean
  email_campaigns: boolean
  branding: boolean
  ai_chat: boolean
  blog: boolean
  content_editor: boolean
  media: boolean
  integrations: boolean
  settings: boolean
  staff_management: boolean
}

export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  overview: true,
  inbox: true,
  contacts: true,
  financials: false,
  invoices: false,
  seo: false,
  kids: true,
  email_campaigns: true,
  branding: true,
  ai_chat: true,
  blog: true,
  content_editor: true,
  media: true,
  integrations: false,
  settings: false,
  staff_management: false,
}

export const FULL_PERMISSIONS: StaffPermissions = {
  overview: true,
  inbox: true,
  contacts: true,
  financials: true,
  invoices: true,
  seo: true,
  kids: true,
  email_campaigns: true,
  branding: true,
  ai_chat: true,
  blog: true,
  content_editor: true,
  media: true,
  integrations: true,
  settings: true,
  staff_management: true,
}

export const PERMISSION_LABELS: Record<keyof StaffPermissions, string> = {
  overview: 'Overview Dashboard',
  inbox: 'Inbox Intelligence',
  contacts: 'Contacts & Members',
  financials: 'Financials',
  invoices: 'Invoice Vault',
  seo: 'SEO Engine',
  kids: 'Kids & Teens',
  email_campaigns: 'Email Campaigns',
  branding: 'Branding Studio',
  ai_chat: 'AI Chat',
  blog: 'Blog',
  content_editor: 'Website Editor',
  media: 'Media Library',
  integrations: 'Integrations',
  settings: 'Settings',
  staff_management: 'Staff Management',
}

export const PERMISSION_DESCRIPTIONS: Record<keyof StaffPermissions, string> = {
  overview: 'View the main dashboard with stats and recent activity',
  inbox: 'Access inbox intelligence, email triage, and task management',
  contacts: 'View and manage contacts, leads, and member data',
  financials: 'View financial reports, invoices, and Xero data',
  invoices: 'View and download invoices, track reconciliation',
  seo: 'Monitor programmatic SEO performance, GSC data, and page health',
  kids: 'Manage kids & teens blocks, registrations, and trials',
  email_campaigns: 'Create and send email campaigns, manage subscribers',
  branding: 'Use branding studio, manage reviews, and brand assets',
  ai_chat: 'Configure AI chat widget and view chat sessions',
  blog: 'Create, edit, and publish blog posts',
  content_editor: 'Edit website page content via the visual editor',
  media: 'Upload and manage media files',
  integrations: 'Configure third-party integrations and sync settings',
  settings: 'Access system settings, digest, and GDPR tools',
  staff_management: 'Invite, edit, and remove staff members',
}

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  staff: 'Staff',
}

export const ROLE_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  owner: { bg: 'rgba(212,160,23,0.12)', text: '#f2ca50', border: 'rgba(212,160,23,0.25)' },
  admin: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  staff: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.6)', border: 'rgba(255,255,255,0.1)' },
}

/** Map permission keys to route prefixes for nav filtering */
export const PERMISSION_ROUTE_MAP: Record<string, keyof StaffPermissions> = {
  '/': 'overview',
  '/inbox': 'inbox',
  '/leads': 'contacts',
  '/members': 'contacts',
  '/calendar': 'contacts',
  '/contacts': 'contacts',
  '/financials': 'financials',
  '/invoices': 'invoices',
  '/seo': 'seo',
  '/kids': 'kids',
  '/email': 'email_campaigns',
  '/mailchimp': 'email_campaigns',
  '/popup': 'email_campaigns',
  '/branding': 'branding',
  '/ai-chat': 'ai_chat',
  '/blog': 'blog',
  '/content': 'content_editor',
  '/media': 'media',
  '/sync': 'integrations',
  '/settings': 'settings',
  '/staff': 'staff_management',
}

/** Check if a user has access to a given route */
export function hasRouteAccess(profile: StaffProfile | null, pathname: string): boolean {
  if (!profile) return false
  // Owners and admins have full access
  if (profile.role === 'owner' || profile.role === 'admin') return true

  // Find matching permission
  const sortedRoutes = Object.keys(PERMISSION_ROUTE_MAP).sort((a, b) => b.length - a.length)
  for (const route of sortedRoutes) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      const permKey = PERMISSION_ROUTE_MAP[route]
      return profile.permissions[permKey] ?? false
    }
  }
  return true // Allow routes not in the map
}
