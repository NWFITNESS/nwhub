CREATE TABLE IF NOT EXISTS public.sync_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source     text NOT NULL,
  synced_at  timestamptz NOT NULL DEFAULT now(),
  created    integer NOT NULL DEFAULT 0,
  updated    integer NOT NULL DEFAULT 0,
  cancelled  integer NOT NULL DEFAULT 0,
  errors     integer NOT NULL DEFAULT 0,
  log        jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sync_log"
  ON public.sync_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
