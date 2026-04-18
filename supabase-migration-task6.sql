CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  user_agent TEXT
);
CREATE INDEX ON push_subscriptions(business_id);
