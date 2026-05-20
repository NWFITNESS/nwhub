-- Inbox Intelligence v2: rule tracking, processing log, new rule seeds

-- 1. Track which rule matched each email
ALTER TABLE email_classifications
  ADD COLUMN IF NOT EXISTS rule_matched_id uuid REFERENCES inbox_rules(id) ON DELETE SET NULL;

-- 2. Processing log — audit trail for every inbox processing run
CREATE TABLE IF NOT EXISTS processing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  emails_fetched int NOT NULL DEFAULT 0,
  emails_processed int NOT NULL DEFAULT 0,
  tasks_created int NOT NULL DEFAULT 0,
  archived int NOT NULL DEFAULT 0,
  rules_matched int NOT NULL DEFAULT 0,
  duration_ms int,
  lookback text
);

-- 3. New inbox rules (priority continues from existing 10/20/30)

-- Lavender NDT (apprenticeship provider)
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Lavender NDT (apprenticeship)', true, 35, 'all',
 '[{"field":"from_domain","op":"contains","value":"lavender-ndt.com"}]',
 '{"category":"needs_attention","flag":true,"create_task":true,"task_priority":"medium"}');

-- Wodify booking confirmations → auto-archive
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Wodify booking confirmations', true, 40, 'all',
 '[{"field":"from_domain","op":"contains","value":"wodify.com"},{"field":"subject","op":"contains","value":"booking"}]',
 '{"category":"receipt_notification","destination":"archive"}');

-- Wodify membership changes → needs attention
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Wodify membership changes', true, 45, 'all',
 '[{"field":"from_domain","op":"contains","value":"wodify.com"},{"field":"subject","op":"regex","value":"cancel|suspend|membership|change"}]',
 '{"category":"needs_attention","flag":true,"create_task":true,"task_priority":"high"}');

-- Squarespace form submissions → new lead
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Squarespace form submissions', true, 50, 'all',
 '[{"field":"from_domain","op":"contains","value":"squarespace.com"},{"field":"subject","op":"contains","value":"form submission"}]',
 '{"category":"new_lead","flag":true,"create_task":true,"task_priority":"high"}');

-- GoCardless successful payments → receipt, archive
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('GoCardless successful payments', true, 55, 'all',
 '[{"field":"from","op":"contains","value":"gocardless"},{"field":"subject","op":"regex","value":"payment|collected|confirmed"},{"field":"subject","op":"not_contains","value":"failed"}]',
 '{"category":"receipt_notification","destination":"archive"}');

-- Software billing (Canva, Vercel, Supabase, Resend)
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Software billing invoices', true, 60, 'all',
 '[{"field":"from_domain","op":"regex","value":"canva\\.com|vercel\\.com|supabase\\.com|resend\\.com"},{"field":"subject","op":"regex","value":"invoice|receipt|billing|payment"}]',
 '{"category":"needs_attention","extract_invoice":true,"create_task":true,"task_priority":"medium"}');

-- Insurance / legal correspondence
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Insurance & legal correspondence', true, 65, 'any',
 '[{"field":"from_domain","op":"regex","value":"insurance|legal|solicitor|aviva|axa"},{"field":"subject","op":"regex","value":"insurance|policy|claim|legal"}]',
 '{"category":"needs_attention","flag":true,"create_task":true,"task_priority":"high"}');

-- Local council communications
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Local council communications', true, 70, 'any',
 '[{"field":"from_domain","op":"regex","value":"copeland\\.gov\\.uk|cumberland\\.gov\\.uk|allerdale\\.gov\\.uk"}]',
 '{"category":"needs_attention","flag":true,"create_task":true,"task_priority":"high"}');

-- Companies House
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Companies House', true, 75, 'all',
 '[{"field":"from_domain","op":"contains","value":"companieshouse.gov.uk"}]',
 '{"category":"needs_attention","flag":true,"create_task":true,"task_priority":"high"}');

-- Equipment suppliers (known)
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Equipment suppliers', true, 80, 'all',
 '[{"field":"from_domain","op":"regex","value":"rogueeurope\\.eu|againfaster\\.co\\.uk|bulldog-gear\\.co\\.uk|primal-strength\\.com"}]',
 '{"category":"needs_attention","create_task":true,"task_priority":"medium"}');

-- Spam: SEO / web design cold outreach
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Spam: SEO & web design cold outreach', true, 90, 'all',
 '[{"field":"subject","op":"regex","value":"\\bSEO\\b|\\bSERP\\b|page.?rank|backlink|link.?build|web.?design.*offer|marketing.?agency"},{"field":"from_domain","op":"not_contains","value":"northernwarrior"}]',
 '{"category":"spam","destination":"junk"}');

-- Spam: generic cold outreach patterns
INSERT INTO inbox_rules (name, enabled, priority, match_type, conditions, action) VALUES
('Spam: generic cold outreach', true, 95, 'all',
 '[{"field":"body","op":"regex","value":"I\\s+noticed\\s+your\\s+website|I\\s+came\\s+across|quick\\s+question.*opportunity|we\\s+specialize\\s+in|limited.?time.?offer"},{"field":"from_domain","op":"not_contains","value":"northernwarrior"}]',
 '{"category":"spam","destination":"junk"}');
