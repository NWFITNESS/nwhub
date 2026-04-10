-- ─────────────────────────────────────────────────────────────────────────────
-- Outlook provider support for Inbox Intelligence
--
-- Adds a `provider` column to email_classifications so we can distinguish
-- Gmail vs Outlook emails, plus an `outlook_message_id` column for the
-- Microsoft Graph message ID (analogous to gmail_message_id).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE email_classifications
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'gmail',
  ADD COLUMN IF NOT EXISTS outlook_message_id text;

-- Unique index on Outlook message ID (only where non-null, so Gmail rows
-- with null outlook_message_id don't conflict)
CREATE UNIQUE INDEX IF NOT EXISTS email_classifications_outlook_unique
  ON email_classifications(outlook_message_id)
  WHERE outlook_message_id IS NOT NULL;
