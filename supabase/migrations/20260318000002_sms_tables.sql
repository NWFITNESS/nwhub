-- WhatsApp / SMS subscribers
CREATE TABLE IF NOT EXISTS public.sms_subscribers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone          text NOT NULL UNIQUE,
  first_name     text,
  status         text NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  tags           text[] NOT NULL DEFAULT '{}',
  subscribed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage subscribers"
  ON public.sms_subscribers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- WhatsApp / SMS campaigns
CREATE TABLE IF NOT EXISTS public.sms_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  message       text NOT NULL,
  segment_tags  text[] NOT NULL DEFAULT '{}',
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at       timestamptz,
  stats         jsonb NOT NULL DEFAULT '{"sent":0,"delivered":0,"failed":0}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage campaigns"
  ON public.sms_campaigns
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
