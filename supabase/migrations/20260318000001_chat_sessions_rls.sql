-- chat_sessions is only accessed via server-side API routes (service role key).
-- Enabling RLS with no public policies locks it down from direct API access.
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
