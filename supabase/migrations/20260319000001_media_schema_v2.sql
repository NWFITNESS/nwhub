-- ── Media table schema v2 ────────────────────────────────────────────────────
-- Adds: url (alias public_url), alt (alias alt_text), category, size (alias file_size), created_at
-- Keeps: storage_path (internal, used for deletion)

-- Add new columns
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS url        text,
  ADD COLUMN IF NOT EXISTS alt        text,
  ADD COLUMN IF NOT EXISTS category   text,
  ADD COLUMN IF NOT EXISTS size       integer,
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Migrate data from old columns
UPDATE public.media SET url        = public_url  WHERE url IS NULL;
UPDATE public.media SET alt        = alt_text    WHERE alt IS NULL;
UPDATE public.media SET size       = file_size   WHERE size IS NULL;
UPDATE public.media SET created_at = uploaded_at WHERE created_at IS NULL;

-- Set defaults on new columns
ALTER TABLE public.media
  ALTER COLUMN created_at SET DEFAULT now();

-- Drop old columns (no longer needed)
ALTER TABLE public.media
  DROP COLUMN IF EXISTS public_url,
  DROP COLUMN IF EXISTS alt_text,
  DROP COLUMN IF EXISTS file_size,
  DROP COLUMN IF EXISTS mime_type,
  DROP COLUMN IF EXISTS uploaded_at;

-- width and height were already on the table from the original migration (or add them)
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS width  integer,
  ADD COLUMN IF NOT EXISTS height integer;
