// ─────────────────────────────────────────────────────────────────────────────
// Kids & Teens — shared types
//
// Hand-rolled to avoid coupling to the Supabase generated types file (which
// gets regenerated from time to time and may not be up to date when the page
// renders). Mirrors the schema in 20260408000000_kids_teens_v2.sql.
// ─────────────────────────────────────────────────────────────────────────────

export type KidsCategory = 'minis' | 'littles' | 'teens'

export type PaymentStatus = 'pending' | 'link_sent' | 'paid' | 'refunded' | 'cancelled'

export interface KidsBlock {
  id: string
  name: string
  start_date: string
  session_count: number
  is_recurring: boolean
  is_active: boolean
  /** Limited-edition drop (e.g. summer teens session) — renders as its own card
   *  on the public site and can be active alongside the normal block. */
  is_special: boolean
  /** Optional booking deadline (ISO). Public card shows a countdown to this. */
  closes_at: string | null
  /** Optional short badge label for the limited-edition card, e.g. "Summer · Ltd". */
  tagline: string | null
  /** Optional custom session start time "HH:MM" (24h). Falls back to category time. */
  start_time: string | null
  /** Optional custom session end time "HH:MM" (24h). */
  end_time: string | null
  /** Optional free-text blurb ("what's involved") shown on the public drop card. */
  description: string | null
  created_at: string
}

export interface KidsSession {
  id: string
  block_id: string
  session_date: string
  session_number: number
  is_break: boolean
  break_label: string | null
}

export interface KidsBlockPricing {
  id: string
  block_id: string
  category: KidsCategory
  capacity: number
  price_pence: number
  stripe_price_id: string | null
}

export interface KidsParent {
  id: string
  email: string
  name: string
  phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  created_at: string
}

export interface KidsChild {
  id: string
  parent_id: string
  child_name: string
  date_of_birth: string
  medical_notes: string | null
  authorised_pickups: string | null
  photo_consent: boolean
  created_at: string
}

export interface KidsBlockBooking {
  id: string
  block_id: string
  child_id: string
  parent_id: string
  category: KidsCategory
  waiver_signed: boolean
  waiver_signed_at: string | null
  stripe_checkout_session_id: string | null
  payment_status: PaymentStatus
  paid_at: string | null
  created_at: string
}

export interface KidsDropInBooking {
  id: string
  session_id: string | null
  child_id: string | null
  parent_id: string | null
  child_name: string | null
  parent_email: string | null
  category: KidsCategory
  stripe_payment_link_id: string | null
  payment_status: PaymentStatus
  price_pence: number
  created_at: string
}

export type TrialStatus = 'confirmed' | 'attended' | 'no_show' | 'cancelled'

export interface KidsTrial {
  id: string
  parent_id: string
  child_id: string
  session_id: string | null
  category: KidsCategory
  status: TrialStatus
  notes: string | null
  source: 'web' | 'admin'
  created_at: string
  confirmed_at: string | null
  attended_at: string | null
}

export interface TrialRow {
  id: string
  child_name: string
  parent_name: string
  parent_email: string
  category: KidsCategory
  status: TrialStatus
  session_date: string | null
  source: 'web' | 'admin'
  created_at: string
  converted: boolean
}

// ── View types (joined / denormalised for the UI) ───────────────────────────

export interface BlockWithDetails extends KidsBlock {
  sessions: KidsSession[]
  pricing: KidsBlockPricing[]
}

export interface RosterRow {
  booking_id: string
  block_id: string
  child_id: string
  child_name: string
  date_of_birth: string
  parent_id: string
  parent_name: string
  parent_email: string
  category: KidsCategory
  payment_status: PaymentStatus
  photo_consent: boolean
  waiver_signed: boolean
}

export interface DropInRow {
  id: string
  child_name: string
  category: KidsCategory
  price_pence: number
  payment_status: PaymentStatus
  created_at: string
  session_date: string | null
}

export interface SearchResultRow {
  child_id: string
  child_name: string
  category: KidsCategory
  block_tags: { block_id: string; block_name: string }[]
  dropin_tags: { dropin_id: string; session_date: string | null }[]
}

export type DiscountType = 'percentage' | 'fixed'

export interface KidsDiscount {
  id: string
  code: string
  description: string
  discount_type: DiscountType
  value: number          // percentage (0–100) or pence for fixed
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  max_uses: number | null
  times_used: number
  min_children: number
  auto_apply: boolean
  created_at: string
}

// ── Attendance types ──────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'late'
export type BookingType = 'block' | 'dropin' | 'trial'

export interface SessionAttendance {
  id: string
  session_id: string
  child_id: string
  booking_type: BookingType
  booking_id: string
  status: AttendanceStatus
  marked_at: string | null
  marked_by: string | null
}

/** One row per child in the register view for a given session + category */
export interface RegisterRow {
  child_id: string
  child_name: string
  date_of_birth: string | null
  booking_type: BookingType
  booking_id: string
  category: KidsCategory
  attendance_id: string | null
  status: AttendanceStatus | null
}

// ── Booking editor types ─────────────────────────────────────────────────────

export interface BookingEditorData {
  booking_id: string
  block_id: string
  block_name: string
  child_id: string
  parent_id: string
  // Child
  child_name: string
  date_of_birth: string
  medical_notes: string | null
  authorised_pickups: string | null
  photo_consent: boolean
  // Parent
  parent_name: string
  parent_email: string
  parent_phone: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  // Booking
  category: KidsCategory
  payment_status: PaymentStatus
  waiver_signed: boolean
  paid_at: string | null
}

// ── Stats ────────────────────────────────────────────────────────────────────

export interface KidsStats {
  minis_enrolled: number
  littles_enrolled: number
  teens_enrolled: number
  block_total: number
  dropins_this_block: number
  trials_total: number         // all trials for sessions in this block
  trials_converted: number     // trials where the child later booked a block
  gross_pence: number          // total paid (blocks + drop-ins)
  stripe_fees_pence: number    // estimated Stripe fees (1.5% + 20p per txn)
  net_pence: number            // gross - fees
}
