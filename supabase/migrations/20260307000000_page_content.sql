-- ── page_content table ───────────────────────────────────────────────────────
-- Stores CMS content for each page section, with a draft/publish workflow.
-- The admin writes to draft_content; publishing copies it to content.
-- The website reads content (the live column) only.

CREATE TABLE IF NOT EXISTS page_content (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug     text NOT NULL,
  section_key   text NOT NULL,
  content       jsonb NOT NULL DEFAULT '{}',
  draft_content jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_content_pkey UNIQUE (page_slug, section_key)
);

CREATE INDEX IF NOT EXISTS idx_page_content_page_slug ON page_content (page_slug);

ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- Website (anon key) can read all published content
CREATE POLICY "Public read published content"
  ON page_content FOR SELECT
  USING (true);
