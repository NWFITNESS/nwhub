export interface PageContent {
  id: string
  page_slug: string
  section_key: string
  content: Record<string, unknown>
  updated_at: string
}

export interface GlobalSetting {
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
}

export interface BlogPost {
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  content: string | null
  featured_image_url: string | null
  author: string
  category_id: string | null
  category?: BlogCategory
  tags: string[]
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Media {
  id: string
  filename: string
  storage_path: string
  public_url: string
  alt_text: string
  file_size: number | null
  mime_type: string | null
  width: number | null
  height: number | null
  uploaded_at: string
}

export interface ContactEnquiry {
  id: string
  name: string
  email: string
  phone: string
  enquiry_type: string
  message: string
  status: 'new' | 'read' | 'replied'
  created_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null         // UK E.164
  groups: string[]
  source: 'manual' | 'import' | 'squarespace' | 'wodboard'
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface KidsRegistration {
  id: string
  parent: {
    name: string
    email: string
    phone: string
    address?: string
  }
  emergency: {
    name: string
    phone: string
    relationship: string
  }
  children: Array<{
    name: string
    dob: string
    group: string
    medical?: string
    photo_consent: boolean
  }>
  first_aid_consent: boolean
  waiver_accepted: boolean
  source: string
  status: string
  created_at: string
}

export interface EmailSubscriber {
  id: string
  email: string
  first_name: string
  last_name: string
  tags: string[]
  status: 'subscribed' | 'unsubscribed' | 'bounced'
  source: string
  subscribed_at: string
  unsubscribed_at: string | null
}

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  preview_text: string
  html_content: string
  from_name: string
  from_email: string
  reply_to: string
  segment_tags: string[]
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_at: string | null
  sent_at: string | null
  stats: { sent: number; opened: number; clicked: number; bounced: number }
  created_at: string
}

export interface WhatsAppSubscriber {
  id: string
  phone: string
  first_name: string
  tags: string[]
  status: 'subscribed' | 'unsubscribed'
  subscribed_at: string
}

export interface ReviewSettings {
  enabled: boolean
  google_place_id: string
  review_link: string
  first_content_sid: string
  reminder_content_sid: string
  days_after_joining: number
  reminder_interval_days: number
  max_messages: number
  last_known_review_count: number
}

export interface ReviewRequest {
  id: string
  contact_id: string
  contact?: { first_name: string; last_name: string; phone: string | null }
  phone_number: string
  messages_sent: number
  last_sent_at: string | null
  review_detected: boolean
  opted_out: boolean
  created_at: string
}

export interface WhatsAppCampaign {
  id: string
  name: string
  message: string
  segment_tags: string[]
  status: 'draft' | 'sent'
  sent_at: string | null
  stats: { sent: number; delivered: number; failed: number }
  created_at: string
}
