-- Add WodBoard-specific columns to contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS trial_start_date  timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date    timestamptz,
  ADD COLUMN IF NOT EXISTS member_since      timestamptz,
  ADD COLUMN IF NOT EXISTS last_attendance   timestamptz,
  ADD COLUMN IF NOT EXISTS programme         text;

-- Extend status to include wodboard lifecycle values.
-- Drop any existing check constraint then recreate with full set.
ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_status_check;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check
  CHECK (status IN ('active', 'inactive', 'trial', 'member', 'cancelled'));
