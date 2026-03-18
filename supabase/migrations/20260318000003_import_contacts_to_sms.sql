-- Import all contacts that have a phone number into sms_subscribers.
-- Skips duplicates (ON CONFLICT DO NOTHING on phone UNIQUE constraint).
INSERT INTO public.sms_subscribers (phone, first_name, status, subscribed_at)
SELECT
  phone,
  first_name,
  'subscribed',
  COALESCE(created_at, now())
FROM public.contacts
WHERE phone IS NOT NULL
  AND phone <> ''
ON CONFLICT (phone) DO NOTHING;
