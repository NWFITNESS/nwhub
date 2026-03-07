CREATE TABLE IF NOT EXISTS chat_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text NOT NULL UNIQUE,
  messages      jsonb NOT NULL DEFAULT '[]',
  lead_captured boolean NOT NULL DEFAULT false,
  contact_id    uuid REFERENCES contacts(id) ON DELETE SET NULL,
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_created_at_idx ON chat_sessions (created_at DESC);
