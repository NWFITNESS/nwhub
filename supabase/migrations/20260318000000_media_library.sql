-- ── Media library table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      text NOT NULL,
  storage_path  text NOT NULL UNIQUE,
  public_url    text NOT NULL,
  mime_type     text,
  alt_text      text,
  file_size     bigint,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS: authenticated users can manage media; anyone can read it
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert media"
  ON public.media FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON public.media FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete media"
  ON public.media FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Public can read media"
  ON public.media FOR SELECT
  USING (true);

-- ── Storage bucket ─────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,   -- 50 MB limit
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/avif','image/svg+xml',
    'video/mp4','video/webm','video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (on storage.objects)
CREATE POLICY "Authenticated users can upload to media bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Authenticated users can update media bucket objects"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can delete from media bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY "Public can read media bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');
