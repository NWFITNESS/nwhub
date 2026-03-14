-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Hardening Migration
-- Enables Row Level Security on all tables and sets appropriate policies.
--
-- Policy model:
--   - anon (public website, public API)  → read-only on public data only
--   - authenticated (admin session)      → full access to all tables
--
-- Tables already covered by earlier migrations:
--   page_content  → RLS enabled in 20260307000000_page_content.sql (public SELECT)
--   page_views    → RLS enabled in 20260311000000_page_views.sql
--
-- This migration adds write policies to page_content and hardens all others.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── page_content ─────────────────────────────────────────────────────────────
-- Already has RLS + public SELECT policy. Add admin write.

CREATE POLICY IF NOT EXISTS "Authenticated users can modify page content"
  ON page_content
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── chat_sessions ─────────────────────────────────────────────────────────────
-- Public can insert (chat widget is unauthenticated).
-- Only admins can read/update session data.

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can create chat sessions"
  ON chat_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can read chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── contacts ──────────────────────────────────────────────────────────────────
-- Admin only — contains PII.
-- Chat widget inserts contacts via service-role key (bypasses RLS).

ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── blog_posts ────────────────────────────────────────────────────────────────
-- Public can read published posts. Admin can do anything.

ALTER TABLE IF EXISTS blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

CREATE POLICY IF NOT EXISTS "Authenticated users can manage blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── review_requests ───────────────────────────────────────────────────────────
-- Admin only — contains phone numbers and review automation data.

ALTER TABLE IF EXISTS review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage review requests"
  ON review_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── global_settings ───────────────────────────────────────────────────────────
-- Admin only — contains API keys (Mailchimp, Anthropic, etc.).

ALTER TABLE IF EXISTS global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage global settings"
  ON global_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── email_subscribers ─────────────────────────────────────────────────────────
-- Public can insert (subscribe from website). Admin can read/manage all.

ALTER TABLE IF EXISTS email_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can subscribe"
  ON email_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can manage email subscribers"
  ON email_subscribers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── email_campaigns ───────────────────────────────────────────────────────────
-- Admin only.

ALTER TABLE IF EXISTS email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage email campaigns"
  ON email_campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── sms_subscribers ───────────────────────────────────────────────────────────
-- Admin only — contains phone numbers.

ALTER TABLE IF EXISTS sms_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage SMS subscribers"
  ON sms_subscribers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── sms_campaigns ─────────────────────────────────────────────────────────────
-- Admin only.

ALTER TABLE IF EXISTS sms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage SMS campaigns"
  ON sms_campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── media ─────────────────────────────────────────────────────────────────────
-- Admin only — file upload/management.

ALTER TABLE IF EXISTS media ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Authenticated users can manage media"
  ON media
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── contact_enquiries (northernwarrior-v2 public form) ───────────────────────
-- Public can insert (contact form). Admin can read.

ALTER TABLE IF EXISTS contact_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can submit contact enquiries"
  ON contact_enquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can read contact enquiries"
  ON contact_enquiries
  FOR SELECT
  TO authenticated
  USING (true);
