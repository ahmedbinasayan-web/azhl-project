import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { PWANotificationToggle } from "./PWA";

const C = {
  navy: "#0C1B33", navyMid: "#1A2D4A", teal: "#0A8F7F", tealLight: "#12C4AD",
  cream: "#FAFAF7", warm: "#F5F3EE", sand: "#E8E4DB", text: "#1A1A18",
  mid: "#4A4A45", light: "#8A8A82", border: "#E0DDD5", white: "#FFF", error: "#D35E5E",
};

const font = {
  serif: "'Instrument Serif', serif",
  sans: "'Syne', -apple-system, sans-serif",
  ar: "'Noto Kufi Arabic', sans-serif",
};

const PULSE_CSS = `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`;

function canAccess(plan, feature) {
  const p = plan || "starter";
  if (p === "pro") return true;
  if (p === "growth") return ["chats", "posts", "followups"].includes(feature);
  return feature === "chats";
}

function LockedFeaturePrompt({ feature, requiredPlan }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{
        textAlign: "center", maxWidth: 420, padding: "48px 40px",
        background: C.white, border: `1px solid ${C.border}`, borderRadius: 20,
      }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🔒</div>
        <div style={{ fontFamily: font.serif, fontSize: 26, color: C.navy, marginBottom: 10 }}>
          {feature}
        </div>
        <div style={{ fontSize: 14, color: C.light, lineHeight: 1.7, marginBottom: 28 }}>
          This feature is available on the{" "}
          <strong style={{ color: C.navy }}>{requiredPlan}</strong> plan and above.
          Upgrade to unlock it for your business.
        </div>
        <a
          href="/pricing"
          style={{
            display: "inline-block", background: C.navy, color: "#FFF",
            textDecoration: "none", borderRadius: 12, padding: "13px 32px",
            fontWeight: 700, fontSize: 14, fontFamily: font.sans,
          }}
        >
          View Plans →
        </a>
      </div>
    </div>
  );
}

function Skel({ h = 20, w = "100%", mb = 0 }) {
  return (
    <div
      style={{
        height: h, width: w, background: C.border, borderRadius: 8,
        animation: "pulse 1.5s infinite", marginBottom: mb, flexShrink: 0,
      }}
    />
  );
}

function ErrMsg({ msg = "Failed to load data. Please refresh." }) {
  return <div style={{ color: C.error, fontSize: 13, padding: 12 }}>{msg}</div>;
}

function timeAgo(isoStr) {
  if (!isoStr) return "";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ label, value, icon, loading }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: "22px 24px", flex: "1 1 0", minWidth: 160,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.light, letterSpacing: "0.04em" }}>{label}</span>
        <span style={{
          width: 34, height: 34, borderRadius: 10, background: C.warm,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        }}>{icon}</span>
      </div>
      {loading
        ? <Skel h={32} />
        : <div style={{ fontFamily: font.serif, fontSize: 32, color: C.navy, lineHeight: 1 }}>{value}</div>
      }
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 1 — DASHBOARD HOME
───────────────────────────────────────────── */
function DashboardHome({ business }) {
  const [stats, setStats] = useState({ messages: 0, customers: 0, posts: 0, followups: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    if (!business) return;
    fetchStats();
    fetchActivity();
  }, [business]);

  async function fetchStats() {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [msgs, custs, posts, fups] = await Promise.all([
        supabase
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id)
          .gte("created_at", today),
        supabase
          .from("customers")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id),
        supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id)
          .eq("status", "posted")
          .gte("posted_at", weekAgo),
        supabase
          .from("followup_log")
          .select("*", { count: "exact", head: true })
          .eq("business_id", business.id)
          .gte("sent_at", monthAgo),
      ]);

      if (msgs.error || custs.error || posts.error || fups.error) throw new Error("query error");

      setStats({
        messages: msgs.count ?? 0,
        customers: custs.count ?? 0,
        posts: posts.count ?? 0,
        followups: fups.count ?? 0,
      });
    } catch {
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }

  async function fetchActivity() {
    setActivityLoading(true);
    setActivityError(false);
    try {
      const [convos, posts, fups] = await Promise.all([
        supabase
          .from("conversations")
          .select("customer_phone, text, created_at, role")
          .eq("business_id", business.id)
          .eq("role", "ai")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("posts")
          .select("platform, status, posted_at")
          .eq("business_id", business.id)
          .eq("status", "posted")
          .order("posted_at", { ascending: false })
          .limit(3),
        supabase
          .from("followup_log")
          .select("customer_phone, sent_at")
          .eq("business_id", business.id)
          .order("sent_at", { ascending: false })
          .limit(3),
      ]);

      const events = [];
      (convos.data || []).forEach(c =>
        events.push({ t: `AI replied to ${c.customer_phone}`, d: c.created_at, i: "💬" })
      );
      (posts.data || []).forEach(p =>
        events.push({ t: `Post published on ${p.platform}`, d: p.posted_at, i: "📱" })
      );
      (fups.data || []).forEach(f =>
        events.push({ t: `Follow-up sent to ${f.customer_phone}`, d: f.sent_at, i: "🔄" })
      );

      events.sort((a, b) => new Date(b.d) - new Date(a.d));
      setActivity(events.slice(0, 8));
    } catch {
      setActivityError(true);
    } finally {
      setActivityLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: font.serif, fontSize: 28, color: C.navy, fontWeight: 400 }}>
          Good afternoon 👋
        </h2>
        <p style={{ fontSize: 14, color: C.light, marginTop: 4 }}>
          Here's what Azhl handled for your business today.
        </p>
      </div>

      {statsError && <ErrMsg />}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard label="Messages Today"      value={stats.messages}  icon="💬" loading={statsLoading} />
        <StatCard label="Total Customers"     value={stats.customers} icon="👥" loading={statsLoading} />
        <StatCard label="Posts This Week"     value={stats.posts}     icon="📱" loading={statsLoading} />
        <StatCard label="Follow-ups (Month)"  value={stats.followups} icon="🔄" loading={statsLoading} />
      </div>

      <div style={{
        background: C.white, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "24px 28px",
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, marginBottom: 16 }}>Recent Activity</div>

        {activityLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map(i => <Skel key={i} h={44} />)}
          </div>
        )}
        {activityError && <ErrMsg />}
        {!activityLoading && !activityError && activity.length === 0 && (
          <div style={{ fontSize: 13, color: C.light, padding: "12px 0" }}>No recent activity yet.</div>
        )}
        {!activityLoading && !activityError && activity.map((item, idx) => (
          <div key={idx} style={{
            display: "flex", gap: 14, alignItems: "center",
            padding: "12px 0",
            borderBottom: idx < activity.length - 1 ? `1px solid ${C.warm}` : "none",
          }}>
            <span style={{ fontSize: 18 }}>{item.i}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.text }}>{item.t}</div>
              <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{timeAgo(item.d)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 2 — WHATSAPP CHATS
───────────────────────────────────────────── */
function ChatsPage({ business }) {
  const [customers, setCustomers] = useState([]);
  const [custsLoading, setCustsLoading] = useState(true);
  const [custsError, setCustsError] = useState(false);
  const [selPhone, setSelPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [msgsError, setMsgsError] = useState(false);
  const msgEndRef = useRef(null);

  useEffect(() => {
    if (!business) return;
    fetchCustomers();
  }, [business]);

  useEffect(() => {
    if (!selPhone || !business) return;
    fetchMessages(selPhone);

    const channel = supabase
      .channel(`conv-${business.id}-${selPhone}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations", filter: `business_id=eq.${business.id}` },
        (payload) => {
          if (payload.new.customer_phone === selPhone) {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selPhone, business]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchCustomers() {
    setCustsLoading(true);
    setCustsError(false);
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", business.id)
        .order("last_contact", { ascending: false })
        .limit(20);
      if (error) throw error;
      setCustomers(data || []);
      if (data && data.length > 0) setSelPhone(data[0].phone);
    } catch {
      setCustsError(true);
    } finally {
      setCustsLoading(false);
    }
  }

  async function fetchMessages(phone) {
    setMsgsLoading(true);
    setMsgsError(false);
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("business_id", business.id)
        .eq("customer_phone", phone)
        .order("created_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      setMessages(data || []);
    } catch {
      setMsgsError(true);
    } finally {
      setMsgsLoading(false);
    }
  }

  const selCustomer = customers.find(c => c.phone === selPhone);

  return (
    <div style={{
      display: "flex", gap: 0, height: "calc(100vh - 100px)",
      background: C.white, borderRadius: 16, overflow: "hidden",
      border: `1px solid ${C.border}`,
    }}>
      {/* Sidebar */}
      <div style={{ width: 300, borderRight: `1px solid ${C.border}`, overflowY: "auto", flexShrink: 0 }}>
        <div style={{
          padding: "16px 20px", fontSize: 15, fontWeight: 700,
          color: C.navy, borderBottom: `1px solid ${C.warm}`,
        }}>
          Conversations
        </div>

        {custsLoading && (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map(i => <Skel key={i} h={56} />)}
          </div>
        )}
        {custsError && <ErrMsg />}
        {!custsLoading && !custsError && customers.length === 0 && (
          <div style={{ fontSize: 13, color: C.light, padding: "16px 20px" }}>No conversations yet.</div>
        )}
        {customers.map(c => (
          <div
            key={c.id}
            onClick={() => setSelPhone(c.phone)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 20px", cursor: "pointer",
              background: selPhone === c.phone ? "rgba(10,143,127,0.04)" : "transparent",
              borderLeft: selPhone === c.phone ? `3px solid ${C.teal}` : "3px solid transparent",
              borderBottom: `1px solid ${C.warm}`,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: C.warm,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
            }}>👤</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name || c.phone}
                </span>
                <span style={{ fontSize: 10, color: C.light, flexShrink: 0 }}>
                  {c.last_contact ? timeAgo(c.last_contact) : ""}
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.light, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.phone}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {!selCustomer ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.light, fontSize: 14 }}>
            Select a conversation
          </div>
        ) : (
          <>
            <div style={{
              padding: "14px 24px", borderBottom: `1px solid ${C.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 20 }}>👤</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>
                    {selCustomer.name || selCustomer.phone}
                  </div>
                  <div style={{ fontSize: 11, color: C.teal, fontWeight: 600 }}>✦ AI handling this conversation</div>
                </div>
              </div>
            </div>

            <div style={{
              flex: 1, overflowY: "auto", padding: 24,
              display: "flex", flexDirection: "column", gap: 14, background: C.cream,
            }}>
              {msgsLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map(i => <Skel key={i} h={60} w={i % 2 === 0 ? "55%" : "65%"} />)}
                </div>
              )}
              {msgsError && <ErrMsg />}
              {!msgsLoading && !msgsError && messages.length === 0 && (
                <div style={{ fontSize: 13, color: C.light, textAlign: "center", marginTop: 40 }}>
                  No messages yet.
                </div>
              )}
              {!msgsLoading && messages.map((m, i) => (
                <div
                  key={m.id || i}
                  style={{ alignSelf: m.role === "customer" ? "flex-start" : "flex-end", maxWidth: "70%" }}
                >
                  {m.role === "ai" && (
                    <div style={{
                      display: "inline-flex", fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: C.teal, background: "rgba(10,143,127,0.06)",
                      border: "1px solid rgba(10,143,127,0.15)",
                      padding: "2px 8px", borderRadius: 4, marginBottom: 5,
                    }}>✦ AI Reply</div>
                  )}
                  <div style={{
                    padding: "11px 16px", borderRadius: 18,
                    background: m.role === "customer" ? C.white : C.navy,
                    border: m.role === "customer" ? `1px solid ${C.border}` : "none",
                    color: m.role === "customer" ? C.text : "#FFF",
                    fontSize: 14, lineHeight: 1.6,
                    borderBottomLeftRadius: m.role === "customer" ? 4 : 18,
                    borderBottomRightRadius: m.role === "ai" ? 4 : 18,
                    whiteSpace: "pre-wrap",
                  }}>{m.text}</div>
                  <div style={{
                    fontSize: 10, color: C.light, marginTop: 3,
                    textAlign: m.role === "ai" ? "right" : "left",
                  }}>
                    {timeAgo(m.created_at)}{m.role === "ai" && " ✓✓"}
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 3 — SOCIAL POSTS
───────────────────────────────────────────── */
const STATUS_MAP = {
  ready:     { bg: "rgba(10,143,127,0.08)",  color: "#0A8F7F", label: "Ready" },
  posted:    { bg: "rgba(46,204,113,0.08)",   color: "#2ECC71", label: "Posted ✓" },
  scheduled: { bg: "rgba(232,168,56,0.10)",   color: "#E8A838", label: "Scheduled" },
};

function PostsPage({ business }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!business) return;
    fetchPosts();
  }, [business]);

  async function fetchPosts() {
    setLoading(true);
    setError(false);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setPosts(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: business.id }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchPosts();
    } catch {
      // user can retry
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish(postId) {
    setPublishingId(postId);
    const now = new Date().toISOString();
    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: "posted", posted_at: now } : p));
    try {
      const { error } = await supabase
        .from("posts")
        .update({ status: "posted", posted_at: now })
        .eq("id", postId);
      if (error) throw error;
    } catch {
      // Revert
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: "ready", posted_at: null } : p));
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDelete(postId) {
    setDeletingId(postId);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: font.serif, fontSize: 24, color: C.navy }}>Social Media Posts</h2>
          <p style={{ fontSize: 13, color: C.light, marginTop: 4 }}>AI-generated content for your business</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            background: generating ? C.mid : C.navy, color: "#FFF", border: "none",
            borderRadius: 10, padding: "10px 20px", fontFamily: font.sans,
            fontWeight: 700, fontSize: 13, cursor: generating ? "not-allowed" : "pointer",
            opacity: generating ? 0.7 : 1,
          }}
        >
          {generating ? "Generating…" : "+ Generate More"}
        </button>
      </div>

      {error && <ErrMsg />}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[1, 2, 3, 4].map(i => <Skel key={i} h={200} />)}
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: 40, textAlign: "center", color: C.light,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📱</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No posts yet</div>
          <div style={{ fontSize: 13 }}>Click "Generate More" to create AI-powered social posts.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {posts.map(p => {
            const st = STATUS_MAP[p.status] || STATUS_MAP.ready;
            return (
              <div key={p.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                      background: p.platform === "Instagram" ? "rgba(225,48,108,0.08)" : "rgba(0,0,0,0.04)",
                      color: p.platform === "Instagram" ? "#E1306C" : C.mid,
                    }}>{p.platform}</span>
                    {p.day && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: C.warm, color: C.light }}>
                        {p.day}
                      </span>
                    )}
                    {p.type && (
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: C.warm, color: C.light }}>
                        {p.type}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 12px",
                    borderRadius: 100, background: st.bg, color: st.color, whiteSpace: "nowrap", flexShrink: 0,
                  }}>{st.label}</span>
                </div>

                <div style={{
                  fontSize: 13, lineHeight: 1.7, color: C.mid, whiteSpace: "pre-wrap",
                  background: C.cream, borderRadius: 12, padding: 16, border: `1px solid ${C.warm}`,
                }}>
                  {p.caption || p.content}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button
                    onClick={() => navigator.clipboard?.writeText(p.caption || p.content || "")}
                    style={{
                      background: C.warm, border: `1px solid ${C.border}`, borderRadius: 8,
                      padding: "6px 14px", cursor: "pointer", color: C.mid,
                      fontSize: 12, fontWeight: 600, fontFamily: font.sans,
                    }}
                  >Copy</button>
                  {p.status === "ready" && (
                    <button
                      onClick={() => handlePublish(p.id)}
                      disabled={publishingId === p.id}
                      style={{
                        background: "rgba(10,143,127,0.08)", border: "1px solid rgba(10,143,127,0.2)",
                        borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                        color: C.teal, fontSize: 12, fontWeight: 700, fontFamily: font.sans,
                      }}
                    >
                      {publishingId === p.id ? "Posting…" : "Post Now →"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    style={{
                      background: "rgba(211,94,94,0.06)", border: "1px solid rgba(211,94,94,0.15)",
                      borderRadius: 8, padding: "6px 14px", cursor: "pointer",
                      color: C.error, fontSize: 12, fontWeight: 600, fontFamily: font.sans, marginLeft: "auto",
                    }}
                  >
                    {deletingId === p.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 4 — SETTINGS
───────────────────────────────────────────── */
function SettingsPage({ business, userId, onBusinessUpdate }) {
  const [form, setForm] = useState({
    name: "", description: "", services: "", hours: "",
    language: "both", tone: "friendly", instagram: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [waKey, setWaKey] = useState("");
  const [waKeyOriginal, setWaKeyOriginal] = useState("");
  const [waSaving, setWaSaving] = useState(false);
  const [waSaved, setWaSaved] = useState(false);
  const [waError, setWaError] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);

  const webhookUrl = (typeof window !== "undefined" ? window.location.origin : "") + "/api/whatsapp";

  useEffect(() => {
    if (!userId) return;
    fetchSettings();
  }, [userId]);

  async function fetchSettings() {
    setLoading(true);
    setError(false);
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userId)
        .single();
      if (error) throw error;
      setForm({
        name:        data.name        || "",
        description: data.description || "",
        services:    data.services    || "",
        hours:       data.hours       || "",
        language:    data.language    || "both",
        tone:        data.tone        || "friendly",
        instagram:   data.instagram   || "",
      });
      setWaKey(data.whatsapp_api_key || "");
      setWaKeyOriginal(data.whatsapp_api_key || "");
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(false);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name:        form.name,
          description: form.description,
          services:    form.services,
          hours:       form.hours,
          language:    form.language,
          tone:        form.tone,
          instagram:   form.instagram,
        })
        .eq("id", business.id);
      if (error) throw error;
      setSaved(true);
      if (onBusinessUpdate) onBusinessUpdate({ ...business, ...form });
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWaKey() {
    setWaSaving(true);
    setWaError(false);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({ whatsapp_api_key: waKey })
        .eq("id", business.id);
      if (error) throw error;
      setWaKeyOriginal(waKey);
      setWaSaved(true);
      setTimeout(() => setWaSaved(false), 2000);
    } catch {
      setWaError(true);
    } finally {
      setWaSaving(false);
    }
  }

  function copyWebhook() {
    navigator.clipboard?.writeText(webhookUrl).then(() => {
      setWebhookCopied(true);
      setTimeout(() => setWebhookCopied(false), 2000);
    });
  }

  const inp = {
    width: "100%", background: C.cream, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "12px 18px", color: C.text,
    fontSize: 14, fontFamily: font.sans, outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 620 }}>
      <h2 style={{ fontFamily: font.serif, fontSize: 24, color: C.navy }}>Business Settings</h2>

      {error && <ErrMsg />}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <Skel key={i} h={48} />)}
        </div>
      ) : (
        <>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              Business Name · اسم العمل
            </label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              Business Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              Services &amp; Prices
            </label>
            <textarea
              rows={5}
              value={form.services}
              onChange={e => setForm(f => ({ ...f, services: e.target.value }))}
              style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: C.light, marginTop: 6 }}>
              The AI uses this to answer price questions automatically.
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              Opening Hours
            </label>
            <input
              value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
              placeholder="e.g. Sat–Thu 10AM–9PM, Fri 2PM–9PM"
              style={inp}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              WhatsApp Number (read-only)
            </label>
            <input
              value={business?.phone || ""}
              readOnly
              style={{ ...inp, opacity: 0.6, cursor: "not-allowed" }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              Instagram Handle
            </label>
            <input
              value={form.instagram}
              onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))}
              placeholder="@yourbusiness"
              style={inp}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              Language Preference
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[["ar", "Arabic only"], ["en", "English only"], ["both", "Both"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForm(f => ({ ...f, language: val }))}
                  style={{
                    background: form.language === val ? "rgba(10,143,127,0.06)" : C.cream,
                    border: `1px solid ${form.language === val ? "rgba(10,143,127,0.25)" : C.border}`,
                    borderRadius: 10, padding: "10px 20px",
                    color: form.language === val ? C.teal : C.light,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font.sans,
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
              AI Tone
            </label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[["friendly", "Friendly 🌸"], ["professional", "Professional 💼"], ["casual", "Casual 😊"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForm(f => ({ ...f, tone: val }))}
                  style={{
                    background: form.tone === val ? "rgba(10,143,127,0.06)" : C.cream,
                    border: `1px solid ${form.tone === val ? "rgba(10,143,127,0.25)" : C.border}`,
                    borderRadius: 10, padding: "10px 20px",
                    color: form.tone === val ? C.teal : C.light,
                    fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font.sans,
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saved ? C.teal : C.navy, color: "#FFF", border: "none",
              borderRadius: 12, padding: "14px 32px", fontFamily: font.sans,
              fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
              width: "fit-content", transition: "background 0.3s",
            }}
          >
            {saved ? "Saved! ✓" : saving ? "Saving…" : "Save Settings ✓"}
          </button>

          {/* WhatsApp Connection */}
          <div style={{
            borderTop: `2px solid ${C.border}`, paddingTop: 28, marginTop: 4,
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div>
              <h3 style={{ fontFamily: font.serif, fontSize: 20, color: C.navy, marginBottom: 4, fontWeight: 400 }}>
                WhatsApp Connection
              </h3>
              <p style={{ fontSize: 13, color: C.light, lineHeight: 1.6 }}>
                Connect your 360dialog WhatsApp API to activate the AI reply bot
              </p>
            </div>

            {/* Connection status */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: waKeyOriginal ? "#2ECC71" : C.light,
                boxShadow: waKeyOriginal ? "0 0 0 3px rgba(46,204,113,0.2)" : "none",
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: waKeyOriginal ? "#2ECC71" : C.light }}>
                {waKeyOriginal ? "Connected and active" : "Not connected"}
              </span>
            </div>

            {/* Webhook URL */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
                Webhook URL (copy this into 360dialog)
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={webhookUrl}
                  readOnly
                  style={{ ...inp, flex: 1, opacity: 0.75, cursor: "text", fontFamily: "monospace", fontSize: 13 }}
                />
                <button
                  onClick={copyWebhook}
                  style={{
                    background: webhookCopied ? "rgba(10,143,127,0.08)" : C.warm,
                    border: `1px solid ${webhookCopied ? "rgba(10,143,127,0.25)" : C.border}`,
                    borderRadius: 12, padding: "0 18px", cursor: "pointer",
                    color: webhookCopied ? C.teal : C.mid, fontSize: 13,
                    fontWeight: 700, fontFamily: font.sans, whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {webhookCopied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: C.light, display: "block", marginBottom: 8 }}>
                360dialog API Key
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="password"
                  value={waKey}
                  onChange={e => setWaKey(e.target.value)}
                  placeholder="Paste your 360dialog API key here"
                  style={{ ...inp, flex: 1 }}
                />
                <button
                  onClick={handleSaveWaKey}
                  disabled={waSaving || waKey === waKeyOriginal}
                  style={{
                    background: waSaved ? C.teal : C.navy, color: "#FFF", border: "none",
                    borderRadius: 12, padding: "0 18px", cursor: (waSaving || waKey === waKeyOriginal) ? "not-allowed" : "pointer",
                    fontWeight: 700, fontSize: 13, fontFamily: font.sans, whiteSpace: "nowrap",
                    opacity: (waSaving || waKey === waKeyOriginal) ? 0.6 : 1, transition: "background 0.3s",
                  }}
                >
                  {waSaved ? "Saved ✓" : waSaving ? "Saving…" : "Save"}
                </button>
              </div>
              {waError && <ErrMsg msg="Failed to save API key. Please try again." />}
              <div style={{ fontSize: 11, color: C.light, marginTop: 6 }}>
                Also set Verify Token to: <code style={{ background: C.warm, padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>azhl-verify-2026</code>
              </div>
            </div>
          </div>

          <PWANotificationToggle businessId={business?.id} />
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
const NAV = [
  { id: "dashboard", label: "Dashboard",     icon: "📊" },
  { id: "chats",     label: "Conversations", icon: "💬" },
  { id: "posts",     label: "Social Posts",  icon: "📱" },
  { id: "settings",  label: "Settings",      icon: "⚙️" },
  { id: "billing",   label: "Billing",       icon: "💳", href: "/dashboard/billing" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [business, setBusiness] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUserId(session.user.id);
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, location, phone, plan, plan_status")
        .eq("owner_id", session.user.id)
        .single();
      if (biz) setBusiness(biz);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("subscribed") === "true") {
        setShowBanner(true);
        const t = setTimeout(() => setShowBanner(false), 5000);
        return () => clearTimeout(t);
      }
    }
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: font.sans, background: C.cream, color: C.text }}>
      <style>{PULSE_CSS}</style>

      {/* Sidebar */}
      <div style={{
        width: 240, background: C.white, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 24px", marginBottom: 36 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: C.navy,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 18, color: "#FFF", fontFamily: font.ar,
          }}>أ</div>
          <div>
            <div style={{ fontFamily: font.serif, fontSize: 22, color: C.navy }}>Azhl</div>
            <div style={{ fontSize: 10, color: C.teal, fontWeight: 600 }}>أزهل</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 12px" }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => n.href ? router.push(n.href) : setPage(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
                borderRadius: 10, cursor: "pointer", border: "none", fontFamily: font.sans,
                background: !n.href && page === n.id ? "rgba(10,143,127,0.06)" : "transparent",
                color: !n.href && page === n.id ? C.teal : C.light,
                fontSize: 14, fontWeight: !n.href && page === n.id ? 700 : 500,
                textAlign: "left", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "auto", padding: "0 24px" }}>
          <div style={{ background: C.cream, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.teal, textTransform: "capitalize" }}>
              {business ? `${business.plan} Plan` : "Loading…"}
            </div>
            <div style={{ fontSize: 11, color: C.light, marginTop: 4, textTransform: "capitalize" }}>
              {business ? business.plan_status : ""}
            </div>
            <div style={{ height: 4, background: C.warm, borderRadius: 4, marginTop: 8 }}>
              <div style={{ height: "100%", width: "20%", background: C.teal, borderRadius: 4 }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: C.warm,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🏢</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {business ? business.name : "—"}
              </div>
              <div style={{ fontSize: 10, color: C.light }}>
                {business ? business.location : "Loading…"}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              marginTop: 12, padding: "9px 12px", borderRadius: 10,
              border: "none", background: "transparent", cursor: "pointer",
              color: C.light, fontSize: 13, fontWeight: 600, fontFamily: font.sans,
              textAlign: "left", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(211,94,94,0.06)"; e.currentTarget.style.color = "#D35E5E"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.light; }}
          >
            <span style={{ fontSize: 15 }}>↩</span> Log out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px", position: "relative" }}>
        {/* Success banner */}
        {showBanner && (
          <div style={{
            position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
            background: C.teal, color: "#FFF", borderRadius: 14,
            padding: "14px 28px", fontWeight: 700, fontSize: 15,
            boxShadow: "0 8px 32px rgba(10,143,127,0.25)",
            zIndex: 1000, display: "flex", alignItems: "center", gap: 10,
            animation: "pulse 0.5s ease-in",
          }}>
            🎉 Welcome to Azhl! Your subscription is active.
          </div>
        )}

        {page === "dashboard" && <DashboardHome business={business} />}
        {page === "chats"     && <ChatsPage     business={business} />}
        {page === "posts"     && (
          canAccess(business?.plan, "posts")
            ? <PostsPage business={business} />
            : <LockedFeaturePrompt feature="Social Media Posts" requiredPlan="Growth" />
        )}
        {page === "settings"  && (
          <SettingsPage
            business={business}
            userId={userId}
            onBusinessUpdate={updated => setBusiness(prev => ({ ...prev, ...updated }))}
          />
        )}
      </div>
    </div>
  );
}
