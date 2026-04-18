/**
 * run-migration.js
 *
 * Executes the Task 2 migration via the Supabase HTTPS REST API.
 * Uses the service role key — bypasses all RLS.
 *
 * What it does:
 *   1. Checks which tables already exist
 *   2. Looks up ahmedbinasayan@gmail.com via the Admin Auth API
 *   3. Inserts a business record (if none exists)
 *   4. Inserts seed data into every table that exists
 *   5. Prints a DDL-only SQL snippet for any tables that are still missing
 *
 * Run: node run-migration.js
 */

const SUPABASE_URL     = "https://ovhptwybtrbtyyxqkcsx.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aHB0d3lidHJidHl5eHFrY3N4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUyMTg2NCwiZXhwIjoyMDkyMDk3ODY0fQ.St9PjfnKGsGzVV5W0t070ilAVXTuijwbTiubulDFMZQ";

const BASE    = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  "Content-Type":  "application/json",
  "apikey":         SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  "Prefer":        "return=representation",
};

// ─── helpers ────────────────────────────────────────────────────────────────

async function rest(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function tableExists(name) {
  const { status } = await rest("GET", `/${name}?limit=0`);
  return status === 200 || status === 206;
}

async function count(table) {
  const res = await fetch(`${BASE}/${table}?select=*&limit=0`, {
    headers: { ...HEADERS, "Prefer": "count=exact" },
  });
  return parseInt(res.headers.get("content-range")?.split("/")[1] ?? "0", 10);
}

async function insert(table, rows, onConflict) {
  const prefer = onConflict
    ? `resolution=ignore-duplicates,return=representation`
    : `return=representation`;
  const res = await fetch(`${BASE}/${table}`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: prefer },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  return { status: res.status, data: JSON.parse(text || "[]") };
}

// ─── main ───────────────────────────────────────────────────────────────────

async function run() {
  console.log("=== Azhl Task 2 Migration ===\n");

  // 1. Check which tables exist
  const tables = ["businesses", "customers", "conversations", "posts", "followup_log"];
  const exists = {};
  process.stdout.write("Checking tables: ");
  for (const t of tables) {
    exists[t] = await tableExists(t);
    process.stdout.write(`${t}=${exists[t] ? "✓" : "✗"}  `);
  }
  console.log("\n");

  // 2. Look up user via Admin Auth API
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=ahmedbinasayan%40gmail.com`, {
    headers: {
      "apikey":        SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const authBody = await authRes.json();

  // Supabase returns { users: [...] } from the admin list endpoint
  const users = authBody.users ?? [];
  const user  = users.find(u => u.email === "ahmedbinasayan@gmail.com");

  if (!user) {
    console.error("❌ User ahmedbinasayan@gmail.com not found in auth.users.");
    console.error("   Make sure the user has signed up before running this script.");
    process.exit(1);
  }
  console.log(`✓ Found user: ${user.email}  (id: ${user.id})\n`);

  // 3. Insert business record if none exists
  let bizId;
  if (exists["businesses"]) {
    const { data: bizRows } = await rest("GET", `/businesses?owner_id=eq.${user.id}&select=id,name`);
    if (Array.isArray(bizRows) && bizRows.length > 0) {
      bizId = bizRows[0].id;
      console.log(`✓ Business already exists: "${bizRows[0].name}"  (id: ${bizId})`);
    } else {
      const { status, data } = await insert("businesses", [{
        owner_id:            user.id,
        name:                "My Business",
        type:                "salon",
        location:            "Dubai, UAE",
        description:         "AI-powered customer operations for UAE businesses",
        services:            "Haircut: AED 80–150\nKeratin: AED 350–600\nHair Color: AED 250–450\nBlowout: AED 80\nManicure: AED 60",
        hours:               "Sat–Thu 10AM–9PM, Fri 2PM–9PM",
        language:            "both",
        tone:                "friendly",
        plan:                "starter",
        plan_status:         "trial",
        onboarding_complete: true,
      }]);
      if (status === 201 && data[0]?.id) {
        bizId = data[0].id;
        console.log(`✓ Business record created  (id: ${bizId})`);
      } else {
        console.error("❌ Failed to insert business:", JSON.stringify(data));
        process.exit(1);
      }
    }
  } else {
    console.error("❌ businesses table does not exist — run the schema SQL first.");
    process.exit(1);
  }
  console.log();

  const now = new Date();
  const ago = (minutes) => new Date(now - minutes * 60000).toISOString();

  // 4. Seed customers
  if (exists["customers"]) {
    const r = await insert("customers", [
      { business_id: bizId, phone: "+971501234001", name: "Maryam K.",  last_contact: ago(120),  total_messages: 8  },
      { business_id: bizId, phone: "+971501234002", name: "Ahmed R.",   last_contact: ago(240),  total_messages: 3  },
      { business_id: bizId, phone: "+971501234003", name: "Fatima A.",  last_contact: ago(1440), total_messages: 5  },
      { business_id: bizId, phone: "+971501234004", name: "Sara M.",    last_contact: ago(2880), total_messages: 12 },
      { business_id: bizId, phone: "+971501234005", name: "Khalid B.",  last_contact: ago(4320), total_messages: 2  },
    ], "phone,business_id");
    const n = await count("customers");
    console.log(`✓ customers: ${n} total rows`);
  } else {
    console.log("⚠  customers table missing — skipped seed");
  }

  // 5. Seed conversations
  if (exists["conversations"]) {
    await insert("conversations", [
      { business_id: bizId, customer_phone: "+971501234002", role: "customer", text: "How much for full color?",                                                    created_at: ago(245) },
      { business_id: bizId, customer_phone: "+971501234002", role: "ai",       text: "أهلاً! 🌸 Full hair color starts from AED 250–450 depending on length. We use L'Oréal Professional.\n\nWould you like to book? We have slots this week! ✨", created_at: ago(244) },
      { business_id: bizId, customer_phone: "+971501234002", role: "customer", text: "Thursday evening?",                                                           created_at: ago(242) },
      { business_id: bizId, customer_phone: "+971501234002", role: "ai",       text: "Thursday at 6 PM or 7:30 PM — which works? ✅\n\nThis week special: full color + blowout for AED 280! 💇‍♀️", created_at: ago(241) },
      { business_id: bizId, customer_phone: "+971501234001", role: "customer", text: "عندكم موعد يوم الأربعاء الساعة 4؟",                                          created_at: ago(130) },
      { business_id: bizId, customer_phone: "+971501234001", role: "ai",       text: "أهلاً مريم! 😊 نعم، عندنا موعد الأربعاء الساعة 4 مساءً. هل تودين تأكيد الحجز؟", created_at: ago(129) },
      { business_id: bizId, customer_phone: "+971501234001", role: "customer", text: "نعم من فضلك",                                                                 created_at: ago(123) },
      { business_id: bizId, customer_phone: "+971501234001", role: "ai",       text: "تم الحجز ✅ نراكِ الأربعاء الساعة 4 مساءً! إذا احتجتِ تغيير الموعد، تواصلي معنا.", created_at: ago(121) },
      { business_id: bizId, customer_phone: "+971501234004", role: "customer", text: "عندكم كيراتين برازيلي؟",                                                      created_at: ago(2940) },
      { business_id: bizId, customer_phone: "+971501234004", role: "ai",       text: "نعم عندنا كيراتين برازيلي أصلي 🌟 الأسعار تبدأ من 350 درهم حسب طول الشعر.\nمتاحون الأسبوع الحالي — هل تودين الحجز؟", created_at: ago(2939) },
    ]);
    const n = await count("conversations");
    console.log(`✓ conversations: ${n} total rows`);
  } else {
    console.log("⚠  conversations table missing — skipped seed");
  }

  // 6. Seed posts
  if (exists["posts"]) {
    const yesterday = new Date(now - 86400000).toISOString();
    await insert("posts", [
      { business_id: bizId, platform: "Instagram", caption: "✨ تألقي بشعر كيراتين ناعم كالحرير ✨\n\nجلسة كيراتين ابتداءً من 350 درهم\n\n#كيراتين_دبي #صالون",  type: "Promo",       day: "Mon", status: "ready",     posted_at: null,      created_at: ago(180) },
      { business_id: bizId, platform: "Instagram", caption: "Every woman deserves a glow-up 💫\n\nBlowout + styling AED 80 only 🔥\n\n#dubai #beauty",             type: "Lifestyle",   day: "Wed", status: "ready",     posted_at: null,      created_at: ago(120) },
      { business_id: bizId, platform: "TikTok",    caption: "قبل وبعد الكيراتين 😍🔥\n\nاحجزوا جلستكم الحين\n\n#كيراتين #صالون_دبي",                              type: "Before/After", day: "Tue", status: "posted",    posted_at: yesterday, created_at: ago(2880) },
      { business_id: bizId, platform: "Instagram", caption: "Weekend mood: pamper yourself 🧖‍♀️💅\n\nMani + Pedi combo AED 120\n\n#selfcare #dubaisalon",          type: "Offer",       day: "Fri", status: "scheduled", posted_at: null,      created_at: ago(60)  },
    ]);
    const n = await count("posts");
    console.log(`✓ posts: ${n} total rows`);
  } else {
    console.log("⚠  posts table missing — skipped seed");
  }

  // 7. Seed followup_log
  if (exists["followup_log"]) {
    await insert("followup_log", [
      { business_id: bizId, customer_phone: "+971501234003", sent_at: ago(60),  message: "مرحباً فاطمة! 👋 نفتقدك في الصالون. عندنا عروض خاصة هذا الأسبوع." },
      { business_id: bizId, customer_phone: "+971501234004", sent_at: ago(360), message: "Hi Sara! 🌸 It's been a while — we'd love to see you again. Special offers this week!" },
      { business_id: bizId, customer_phone: "+971501234005", sent_at: ago(1440),message: "مرحباً خالد! هل تودون حجز موعد جديد لزوجتكم هذا الأسبوع؟" },
    ]);
    const n = await count("followup_log");
    console.log(`✓ followup_log: ${n} total rows`);
  } else {
    console.log("⚠  followup_log table missing — skipped seed");
  }

  // 8. Report missing tables + minimal DDL to fix them
  const missing = tables.filter(t => t !== "businesses" && !exists[t]);
  if (missing.length > 0) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠  MISSING TABLES: ${missing.join(", ")}

Run this in the Supabase SQL editor to create them:
https://supabase.com/dashboard/project/ovhptwybtrbtyyxqkcsx/sql
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    if (missing.includes("customers")) console.log(`
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  phone TEXT NOT NULL,
  name TEXT, email TEXT,
  last_contact TIMESTAMPTZ DEFAULT now(),
  total_messages INTEGER DEFAULT 1,
  UNIQUE(phone, business_id)
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "owner_all_customers" ON customers FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "service_all_customers" ON customers FOR ALL USING (true);`);

    if (missing.includes("conversations")) console.log(`
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer','ai','owner')),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'active'
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "owner_all_conversations" ON conversations FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "service_all_conversations" ON conversations FOR ALL USING (true);`);

    if (missing.includes("posts")) console.log(`
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL, caption TEXT, content TEXT,
  type TEXT, day TEXT,
  status TEXT DEFAULT 'ready' CHECK (status IN ('ready','scheduled','posted','rejected')),
  scheduled_at TIMESTAMPTZ, posted_at TIMESTAMPTZ
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "owner_all_posts" ON posts FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "service_all_posts" ON posts FOR ALL USING (true);`);

    if (missing.includes("followup_log")) console.log(`
CREATE TABLE IF NOT EXISTS followup_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  customer_phone TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  message TEXT
);
ALTER TABLE followup_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "owner_all_followup_log" ON followup_log FOR ALL
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "service_all_followup_log" ON followup_log FOR ALL USING (true);`);

    console.log(`\nAfter creating tables, re-run: node run-migration.js`);
    console.log("(The business record is already inserted — re-running is safe.)\n");
  } else {
    console.log("\n✅ All tables present. Migration complete!");
    console.log("   Refresh http://localhost:3001/dashboard\n");
  }
}

run().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
