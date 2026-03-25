-- email_classifications table
CREATE TABLE IF NOT EXISTS email_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id text NOT NULL UNIQUE,
  thread_id text,
  sender text,
  sender_name text,
  subject text,
  preview text,
  received_at timestamptz,
  category text NOT NULL CHECK (category IN ('needs_attention','new_lead','newsletter','receipt_notification','spam')),
  ai_summary text,
  task_created boolean NOT NULL DEFAULT false,
  task_id uuid,
  flagged boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- tasks table (new, separate from todos)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  notes text,
  due_date date,
  completed boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('email','manual')),
  email_id uuid REFERENCES email_classifications(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK back from email_classifications to tasks
ALTER TABLE email_classifications ADD CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- digest_log table
CREATE TABLE IF NOT EXISTS digest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamptz NOT NULL DEFAULT now(),
  emails_processed int NOT NULL DEFAULT 0,
  flagged_count int NOT NULL DEFAULT 0,
  archived_count int NOT NULL DEFAULT 0,
  categorised_count int NOT NULL DEFAULT 0
);

-- Enable realtime on email_classifications and tasks
ALTER PUBLICATION supabase_realtime ADD TABLE email_classifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
