-- ── Todos ────────────────────────────────────────────────────────────────────
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  notes text,
  completed boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date date,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'email')),
  email_gmail_id text,
  email_subject text,
  email_from text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Email Triage ─────────────────────────────────────────────────────────────
CREATE TABLE email_triage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_id text NOT NULL UNIQUE,
  thread_id text,
  from_email text,
  from_name text,
  subject text NOT NULL,
  snippet text,
  category text NOT NULL
    CHECK (category IN ('PRIORITY','INFO','JUNK','NEEDS_REPLY','MEMBER','SUPPLIER','FINANCIAL')),
  requires_reply boolean NOT NULL DEFAULT false,
  replied_at timestamptz,
  is_flagged boolean NOT NULL DEFAULT false,
  ai_summary text,
  ai_suggested_action text,
  urgency text NOT NULL DEFAULT 'medium'
    CHECK (urgency IN ('low','medium','high')),
  todo_id uuid REFERENCES todos(id) ON DELETE SET NULL,
  received_at timestamptz,
  triaged_at timestamptz NOT NULL DEFAULT now()
);

-- ── Updated-at trigger for todos ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
