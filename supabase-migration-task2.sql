-- ═══════════════════════════════════════════════════════════════════════
-- AZHL — Task 2 Migration
-- Run in: https://supabase.com/dashboard/project/ovhptwybtrbtyyxqkcsx/sql
--
-- What this does:
--   1. Creates customers, conversations, posts, followup_log tables
--   2. Adds indexes and RLS policies (all idempotent — safe to re-run)
--   3. Inserts a business record for ahmedbinasayan@gmail.com
--   4. Seeds sample data so the dashboard shows real content
-- ═══════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────
-- 1. CUSTOMERS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),
  business_id   UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  phone         TEXT        NOT NULL,
  name          TEXT,
  email         TEXT,
  last_contact  TIMESTAMPTZ DEFAULT now(),
  total_messages INTEGER    DEFAULT 1,
  tags          TEXT[],
  UNIQUE(phone, business_id)
);

CREATE INDEX IF NOT EXISTS idx_customers_business_contact
  ON customers(business_id, last_contact DESC);


-- ───────────────────────────────────────────
-- 2. CONVERSATIONS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT now(),
  business_id    UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT        NOT NULL,
  role           TEXT        NOT NULL CHECK (role IN ('customer', 'ai', 'owner')),
  text           TEXT        NOT NULL,
  status         TEXT        DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_conversations_business_created
  ON conversations(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_phone
  ON conversations(business_id, customer_phone, created_at ASC);


-- ───────────────────────────────────────────
-- 3. POSTS
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT now(),
  business_id  UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  platform     TEXT        NOT NULL,
  caption      TEXT,
  content      TEXT,   -- alias used by some routes; caption is canonical
  type         TEXT,
  day          TEXT,
  status       TEXT        DEFAULT 'ready'
                           CHECK (status IN ('ready', 'scheduled', 'posted', 'rejected')),
  scheduled_at TIMESTAMPTZ,
  posted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_business_created
  ON posts(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_business_status
  ON posts(business_id, status, posted_at DESC);


-- ───────────────────────────────────────────
-- 4. FOLLOWUP_LOG  (new — not in original schema)
-- ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS followup_log (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ DEFAULT now(),
  business_id    UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT        NOT NULL,
  sent_at        TIMESTAMPTZ DEFAULT now(),
  message        TEXT
);

CREATE INDEX IF NOT EXISTS idx_followup_log_business_sent
  ON followup_log(business_id, sent_at DESC);


-- ───────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
--    All policies use IF NOT EXISTS (Postgres 15+, which Supabase runs).
--    Safe to re-run; won't duplicate policies.
-- ───────────────────────────────────────────

ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_log  ENABLE ROW LEVEL SECURITY;

-- CUSTOMERS
CREATE POLICY IF NOT EXISTS "owner_all_customers" ON customers
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "service_all_customers" ON customers
  FOR ALL USING (true);   -- service role bypasses RLS but this covers anon webhooks

-- CONVERSATIONS
CREATE POLICY IF NOT EXISTS "owner_all_conversations" ON conversations
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "service_all_conversations" ON conversations
  FOR ALL USING (true);

-- POSTS
CREATE POLICY IF NOT EXISTS "owner_all_posts" ON posts
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "service_all_posts" ON posts
  FOR ALL USING (true);

-- FOLLOWUP_LOG
CREATE POLICY IF NOT EXISTS "owner_all_followup_log" ON followup_log
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY IF NOT EXISTS "service_all_followup_log" ON followup_log
  FOR ALL USING (true);


-- ═══════════════════════════════════════════════════════════════════════
-- 6. BUSINESS RECORD for ahmedbinasayan@gmail.com
--    Inserts only if this user has no business yet.
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO businesses (
  owner_id,
  name,
  type,
  location,
  phone,
  description,
  services,
  hours,
  language,
  tone,
  plan,
  plan_status,
  onboarding_complete
)
SELECT
  u.id,
  'My Business',
  'salon',
  'Dubai, UAE',
  NULL,
  'AI-powered customer operations for UAE businesses',
  'Haircut: AED 80–150' || chr(10) ||
  'Keratin: AED 350–600'  || chr(10) ||
  'Hair Color: AED 250–450' || chr(10) ||
  'Blowout: AED 80'       || chr(10) ||
  'Manicure: AED 60',
  'Sat–Thu 10AM–9PM, Fri 2PM–9PM',
  'both',
  'friendly',
  'starter',
  'trial',
  true
FROM auth.users u
WHERE u.email = 'ahmedbinasayan@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM businesses b WHERE b.owner_id = u.id
  );


-- ═══════════════════════════════════════════════════════════════════════
-- 7. SEED DATA
--    Ties sample records to the business we just created (or the
--    existing one if it was already there).  All wrapped in a DO block
--    so it can reference the business id via a variable.
-- ═══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_biz_id UUID;
BEGIN
  -- Resolve the business id for ahmedbinasayan@gmail.com
  SELECT b.id INTO v_biz_id
  FROM businesses b
  JOIN auth.users u ON u.id = b.owner_id
  WHERE u.email = 'ahmedbinasayan@gmail.com'
  LIMIT 1;

  IF v_biz_id IS NULL THEN
    RAISE NOTICE 'No business found for ahmedbinasayan@gmail.com — skipping seed data.';
    RETURN;
  END IF;

  -- ── CUSTOMERS ─────────────────────────────────────────────────────
  INSERT INTO customers (business_id, phone, name, last_contact, total_messages)
  VALUES
    (v_biz_id, '+971501234001', 'Maryam K.',  now() - interval '2 hours',   8),
    (v_biz_id, '+971501234002', 'Ahmed R.',   now() - interval '4 hours',   3),
    (v_biz_id, '+971501234003', 'Fatima A.',  now() - interval '1 day',     5),
    (v_biz_id, '+971501234004', 'Sara M.',    now() - interval '2 days',   12),
    (v_biz_id, '+971501234005', 'Khalid B.',  now() - interval '3 days',    2)
  ON CONFLICT (phone, business_id) DO NOTHING;

  -- ── CONVERSATIONS ─────────────────────────────────────────────────
  INSERT INTO conversations (business_id, customer_phone, role, text, created_at)
  VALUES
    -- Ahmed R. thread
    (v_biz_id, '+971501234002', 'customer',
     'How much for full color?',
     now() - interval '4 hours 5 minutes'),
    (v_biz_id, '+971501234002', 'ai',
     'أهلاً! 🌸 Full hair color starts from AED 250–450 depending on length. We use L''Oréal Professional.' || chr(10) || chr(10) || 'Would you like to book? We have slots this week! ✨',
     now() - interval '4 hours 4 minutes'),
    (v_biz_id, '+971501234002', 'customer',
     'Thursday evening?',
     now() - interval '4 hours 2 minutes'),
    (v_biz_id, '+971501234002', 'ai',
     'Thursday at 6 PM or 7:30 PM — which works? ✅' || chr(10) || chr(10) || 'This week special: full color + blowout for AED 280! 💇‍♀️',
     now() - interval '4 hours 1 minute'),
    -- Maryam K. thread
    (v_biz_id, '+971501234001', 'customer',
     'عندكم موعد يوم الأربعاء الساعة 4؟',
     now() - interval '2 hours 10 minutes'),
    (v_biz_id, '+971501234001', 'ai',
     'أهلاً مريم! 😊 نعم، عندنا موعد الأربعاء الساعة 4 مساءً. هل تودين تأكيد الحجز؟',
     now() - interval '2 hours 9 minutes'),
    (v_biz_id, '+971501234001', 'customer',
     'نعم من فضلك',
     now() - interval '2 hours 3 minutes'),
    (v_biz_id, '+971501234001', 'ai',
     'تم الحجز ✅ نراكِ الأربعاء الساعة 4 مساءً! إذا احتجتِ تغيير الموعد، تواصلي معنا.',
     now() - interval '2 hours 1 minute'),
    -- Sara M. thread
    (v_biz_id, '+971501234004', 'customer',
     'عندكم كيراتين برازيلي؟',
     now() - interval '2 days 1 hour'),
    (v_biz_id, '+971501234004', 'ai',
     'نعم عندنا كيراتين برازيلي أصلي 🌟 الأسعار تبدأ من 350 درهم حسب طول الشعر.' || chr(10) || 'متاحون الأسبوع الحالي — هل تودين الحجز؟',
     now() - interval '2 days 59 minutes')
  ON CONFLICT DO NOTHING;

  -- ── POSTS ─────────────────────────────────────────────────────────
  INSERT INTO posts (business_id, platform, caption, type, day, status, posted_at, created_at)
  VALUES
    (v_biz_id, 'Instagram',
     '✨ تألقي بشعر كيراتين ناعم كالحرير ✨' || chr(10) || chr(10) ||
     'جلسة كيراتين ابتداءً من 350 درهم' || chr(10) || chr(10) ||
     '#كيراتين_دبي #صالون',
     'Promo', 'Mon', 'ready', NULL, now() - interval '3 hours'),

    (v_biz_id, 'Instagram',
     'Every woman deserves a glow-up 💫' || chr(10) || chr(10) ||
     'Blowout + styling AED 80 only 🔥' || chr(10) || chr(10) ||
     '#dubai #beauty',
     'Lifestyle', 'Wed', 'ready', NULL, now() - interval '2 hours'),

    (v_biz_id, 'TikTok',
     'قبل وبعد الكيراتين 😍🔥' || chr(10) || chr(10) ||
     'احجزوا جلستكم الحين' || chr(10) || chr(10) ||
     '#كيراتين #صالون_دبي',
     'Before/After', 'Tue', 'posted', now() - interval '1 day', now() - interval '2 days'),

    (v_biz_id, 'Instagram',
     'Weekend mood: pamper yourself 🧖‍♀️💅' || chr(10) || chr(10) ||
     'Mani + Pedi combo AED 120' || chr(10) || chr(10) ||
     '#selfcare #dubaisalon',
     'Offer', 'Fri', 'scheduled', now() + interval '2 days', now() - interval '1 hour')
  ON CONFLICT DO NOTHING;

  -- ── FOLLOWUP_LOG ──────────────────────────────────────────────────
  INSERT INTO followup_log (business_id, customer_phone, sent_at, message)
  VALUES
    (v_biz_id, '+971501234003', now() - interval '1 hour',
     'مرحباً فاطمة! 👋 نفتقدك في الصالون. عندنا عروض خاصة هذا الأسبوع.'),
    (v_biz_id, '+971501234004', now() - interval '6 hours',
     'Hi Sara! 🌸 It''s been a while — we''d love to see you again. Special offers this week!'),
    (v_biz_id, '+971501234005', now() - interval '1 day',
     'مرحباً خالد! هل تودون حجز موعد جديد لزوجتكم هذا الأسبوع؟')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data inserted for business id: %', v_biz_id;
END$$;


-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES  (run these after to confirm everything worked)
-- ═══════════════════════════════════════════════════════════════════════
-- SELECT count(*) FROM customers;        -- should be ≥ 5
-- SELECT count(*) FROM conversations;    -- should be ≥ 10
-- SELECT count(*) FROM posts;            -- should be ≥ 4
-- SELECT count(*) FROM followup_log;     -- should be ≥ 3
-- SELECT id, name, owner_id FROM businesses
--   JOIN auth.users ON auth.users.id = businesses.owner_id
--   WHERE auth.users.email = 'ahmedbinasayan@gmail.com';
