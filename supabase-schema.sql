-- ═══════════════════════════════════════════════════════════════
-- AZHL أزهل — Database Schema
-- Run this in Supabase SQL Editor to set up the database
-- ═══════════════════════════════════════════════════════════════

-- 1. BUSINESSES — stores each business's profile and AI config
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Owner info
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Business details
  name TEXT NOT NULL,
  name_ar TEXT, -- Arabic name
  type TEXT NOT NULL, -- salon, restaurant, clinic, ac_repair, retail, etc.
  location TEXT,
  phone TEXT UNIQUE, -- WhatsApp number (used for webhook matching)
  hours TEXT,
  
  -- AI configuration
  services TEXT, -- free-text list of services and prices
  tone TEXT DEFAULT 'friendly', -- friendly, professional, casual
  language TEXT DEFAULT 'arabic_english', -- arabic_english, arabic_only, english_only
  
  -- Subscription
  plan TEXT DEFAULT 'starter', -- starter, growth, pro
  plan_status TEXT DEFAULT 'trial', -- trial, active, cancelled
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
);

-- 2. CONVERSATIONS — chat messages between customers and AI
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'ai', 'owner')),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'active' -- active, resolved, needs_review
);

-- 3. CUSTOMERS — CRM for re-engagement
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT,
  last_contact TIMESTAMPTZ DEFAULT now(),
  total_messages INTEGER DEFAULT 1,
  tags TEXT[], -- e.g. ['vip', 'new', 'inactive']
  
  UNIQUE(phone, business_id)
);

-- 4. POSTS — AI-generated social media content
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- Instagram, TikTok
  caption TEXT NOT NULL,
  type TEXT, -- Promotional, Lifestyle, Seasonal, Tips, Before/After
  day TEXT, -- Monday, Tuesday, etc.
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready', 'scheduled', 'posted', 'rejected')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ
);

-- 5. ANALYTICS — daily metrics per business
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  avg_response_time_seconds REAL DEFAULT 0,
  ai_handled_count INTEGER DEFAULT 0,
  human_takeover_count INTEGER DEFAULT 0,
  
  UNIQUE(business_id, date)
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_phone, business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id, last_contact DESC);
CREATE INDEX IF NOT EXISTS idx_posts_business ON posts(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_business ON analytics(business_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_phone ON businesses(phone);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Increment a specific analytics field for a business on a given date
CREATE OR REPLACE FUNCTION increment_analytics(
  p_business_id UUID,
  p_date DATE,
  p_field TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics (business_id, date, messages_count)
  VALUES (p_business_id, p_date, 1)
  ON CONFLICT (business_id, date)
  DO UPDATE SET messages_count = analytics.messages_count + 1;
END;
$$ LANGUAGE plpgsql;

-- Get inactive customers (no contact in 30+ days)
CREATE OR REPLACE FUNCTION get_inactive_customers(p_business_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (phone TEXT, name TEXT, last_contact TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT c.phone, c.name, c.last_contact
  FROM customers c
  WHERE c.business_id = p_business_id
    AND c.last_contact < (now() - (p_days || ' days')::INTERVAL)
  ORDER BY c.last_contact DESC;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Businesses: owners can only see their own
CREATE POLICY "Users see own businesses" ON businesses
  FOR ALL USING (auth.uid() = owner_id);

-- Conversations: business owners see their business conversations
CREATE POLICY "Users see own conversations" ON conversations
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Customers: business owners see their customers
CREATE POLICY "Users see own customers" ON customers
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Posts: business owners see their posts
CREATE POLICY "Users see own posts" ON posts
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Analytics: business owners see their analytics
CREATE POLICY "Users see own analytics" ON analytics
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- ═══════════════════════════════════════════════════════════════
-- SERVICE ROLE POLICIES (for API routes / webhooks)
-- ═══════════════════════════════════════════════════════════════

-- Allow service role (webhooks) to read businesses by phone
CREATE POLICY "Service reads businesses" ON businesses
  FOR SELECT USING (true);

-- Allow service role to insert conversations
CREATE POLICY "Service inserts conversations" ON conversations
  FOR INSERT WITH CHECK (true);

-- Allow service role to upsert customers
CREATE POLICY "Service upserts customers" ON customers
  FOR ALL USING (true);

-- Allow service role to update analytics
CREATE POLICY "Service updates analytics" ON analytics
  FOR ALL USING (true);
