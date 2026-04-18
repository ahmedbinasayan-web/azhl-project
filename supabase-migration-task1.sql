-- ═══════════════════════════════════════════════════════════════
-- AZHL — Task 1 Migration: businesses table with onboarding columns
-- Run this in: https://supabase.com/dashboard/project/ovhptwybtrbtyyxqkcsx/sql
-- ═══════════════════════════════════════════════════════════════

-- Create businesses table with ALL required columns
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT,
  location TEXT,
  phone TEXT,
  plan TEXT DEFAULT 'starter',
  plan_status TEXT DEFAULT 'trial',
  description TEXT,
  hours TEXT,
  instagram TEXT,
  services TEXT,
  language TEXT DEFAULT 'both',
  tone TEXT DEFAULT 'friendly',
  onboarding_complete BOOLEAN DEFAULT false,
  whatsapp_api_key TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

-- If the table already exists, add missing columns (safe to run multiple times)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS hours TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'both';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'friendly';

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Policy: users can only access their own business
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'businesses' AND policyname = 'Users manage own business'
  ) THEN
    CREATE POLICY "Users manage own business" ON businesses
      FOR ALL USING (auth.uid() = owner_id);
  END IF;
END$$;
