import { useState, useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════
   ANIMATED HERO — morphing highlighted word
   ═══════════════════════════════════════════════════ */
function AnimatedHeroText({ words, interval = 3000 }) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(i => (i + 1) % words.length);
        setFade(true);
      }, 400);
    }, interval);
    return () => clearInterval(timer);
  }, [words, interval]);

  return (
    <span style={{
      display: "inline-block",
      fontStyle: "italic",
      color: "#12C4AD",
      transition: "opacity 0.4s, transform 0.4s",
      opacity: fade ? 1 : 0,
      transform: fade ? "translateY(0)" : "translateY(8px)",
      minWidth: 180,
    }}>
      {words[index]}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   SHADER CANVAS — smooth animated gradient background
   ═══════════════════════════════════════════════════ */
function ShaderCanvas({ colors, distortion = 1.2, speed = 0.8 }) {
  const ref = useRef(null);
  const raf = useRef(null);
  const t = useRef(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cols = (colors || ["#0C1B33", "#0A8F7F", "#1A2D4A", "#12C4AD"]).map(h => [
      parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)
    ]);

    function resize() { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; ctx.scale(dpr, dpr); }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const w = c.offsetWidth, h = c.offsetHeight;
      t.current += 0.003 * speed;
      const T = t.current;
      const step = 8;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          const nx = x / w - 0.5, ny = y / h - 0.5;
          const d = Math.sqrt(nx * nx + ny * ny);
          const wave = Math.sin(nx * 6 * distortion + T * 2) * Math.cos(ny * 6 * distortion + T * 1.5) * 0.5 + 0.5;
          const idx = Math.floor(wave * (cols.length - 1));
          const fr = wave * (cols.length - 1) - idx;
          const c1 = cols[Math.min(idx, cols.length - 1)];
          const c2 = cols[Math.min(idx + 1, cols.length - 1)];
          ctx.fillStyle = `rgba(${Math.round(c1[0] + (c2[0] - c1[0]) * fr)},${Math.round(c1[1] + (c2[1] - c1[1]) * fr)},${Math.round(c1[2] + (c2[2] - c1[2]) * fr)},${0.85 - d * 0.3})`;
          ctx.fillRect(x, y, step, step);
        }
      }
      raf.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf.current); };
  }, [colors, distortion, speed]);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />;
}

/* ═══════════════════════════════════════════════════
   REVEAL ON SCROLL
   ═══════════════════════════════════════════════════ */
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(20px)", transition: `opacity 0.6s ${delay}s, transform 0.6s ${delay}s` }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */
const C = { navy: "#0C1B33", teal: "#0A8F7F", tealLight: "#12C4AD", cream: "#FAFAF7", warm: "#F5F3EE", mid: "#4A4A45", light: "#8A8A82", border: "#E0DDD5", white: "#FFF" };
const F = { serif: "'Instrument Serif', Georgia, serif", sans: "'Syne', -apple-system, sans-serif", ar: "'Noto Kufi Arabic', sans-serif" };

const heroWords = ["instant", "automatic", "24/7", "bilingual", "intelligent"];

const features = [
  { n: "01", i: "💬", t: "WhatsApp AI Agent", ar: "وكيل واتساب الذكي", d: "Responds to every customer message in Arabic and English, 24/7. Handles pricing, bookings, FAQs, and complaints — instantly." },
  { n: "02", i: "📱", t: "Social Content Engine", ar: "محرك المحتوى", d: "Generates 7 ready-to-post Instagram and TikTok captions per week — culturally tuned for UAE, timed for Eid, Ramadan, and local events." },
  { n: "03", i: "🔄", t: "Customer Re-Engagement", ar: "إعادة تفعيل العملاء", d: "Sends personalized follow-ups to inactive customers. Turns one-time visitors into loyal regulars, automatically." },
];

const testimonials = [
  { q: "I was replying to WhatsApp until midnight. Azhl handles everything — my customers can't tell it's AI.", n: "Sara Al Mazrouei", b: "Lina Beauty Salon · Dubai", i: "💇‍♀️" },
  { q: "40 new bookings in the first month. The Arabic is spot-on — better than what I'd write myself.", n: "Khaled Al Rashidi", b: "Layali Restaurant · Abu Dhabi", i: "🍽️" },
  { q: "It posts on Instagram for us every day. We went from 400 followers to 1,200 in two months.", n: "Dr. Fatima Al Hosani", b: "Al Shifa Dental · Sharjah", i: "🦷" },
];

const plans = [
  { name: "Starter", price: "199", items: ["AI WhatsApp replies (Arabic + English)", "Up to 500 messages/month", "3-minute instant setup", "Basic analytics"], f: false },
  { name: "Growth", price: "399", items: ["Everything in Starter", "Unlimited WhatsApp messages", "7 social posts/week", "Instagram + TikTok captions", "Seasonal content (Eid, Ramadan)"], f: true },
  { name: "Pro", price: "699", items: ["Everything in Growth", "Auto follow-up engine", "Re-engagement flows", "Advanced analytics", "Priority support"], f: false },
];

const stats = [
  { v: "99%", l: "WhatsApp reach in UAE" },
  { v: "12s", l: "Average AI reply time" },
  { v: "94%", l: "Handled autonomously" },
  { v: "3 min", l: "Setup time" },
];

const Chk = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A8F7F" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;

/* ═══════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════ */
export default function AzhlLanding() {
  const [chatStep, setChatStep] = useState(0);

  useEffect(() => {
    const ts = [
      setTimeout(() => setChatStep(1), 700),
      setTimeout(() => setChatStep(2), 1700),
      setTimeout(() => setChatStep(3), 2700),
      setTimeout(() => setChatStep(4), 3700),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const bubbleStyle = (type) => ({
    alignSelf: type === "in" ? "flex-start" : "flex-end",
    maxWidth: "80%",
    animation: "msgIn 0.35s ease",
  });

  const bubbleInner = (type) => ({
    padding: "10px 14px",
    borderRadius: type === "in" ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
    background: type === "in" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.15)",
    color: "#fff", fontSize: 13.5, lineHeight: 1.55,
    ...(type === "out" ? { fontFamily: F.ar, direction: "rtl" } : {}),
  });

  const aiTag = { display: "inline-flex", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.tealLight, background: "rgba(18,196,173,0.12)", border: "1px solid rgba(18,196,173,0.2)", padding: "2px 8px", borderRadius: 4, marginBottom: 4 };

  const timeStyle = (align) => ({ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: align || "left" });

  return (
    <div style={{ fontFamily: F.sans, color: C.mid, background: C.cream, overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 56px", height: 72, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(250,250,247,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid " + C.border }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: C.navy, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ar, fontWeight: 700, fontSize: 18, color: "#fff" }}>أ</div>
          <span style={{ fontFamily: F.serif, fontSize: 24, color: C.navy }}>Azhl</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Features", "Pricing", "Clients"].map(l => <a key={l} href={"#" + l.toLowerCase()} style={{ textDecoration: "none", fontSize: 13, fontWeight: 600, color: C.mid }}>{l}</a>)}
          <a href="#pricing" style={{ background: C.navy, color: "#fff", padding: "10px 24px", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>Start Free Trial →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <ShaderCanvas colors={["#0C1B33", "#0A8F7F", "#1A2D4A", "#12C4AD"]} distortion={1.2} speed={0.8} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(12,27,51,0.9) 0%, rgba(12,27,51,0.72) 40%, rgba(10,143,127,0.45) 100%)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1280, margin: "0 auto", padding: "160px 56px 100px", display: "grid", gridTemplateColumns: "1fr 440px", gap: 64, alignItems: "center", width: "100%" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.tealLight, marginBottom: 28, opacity: 0, animation: "fadeUp 0.5s 0.1s ease forwards" }}>
              <span style={{ width: 24, height: 2, background: C.tealLight, borderRadius: 1, display: "inline-block" }} />
              AI-Powered Customer Operations
            </div>
            <h1 style={{ fontFamily: F.serif, fontSize: 64, lineHeight: 1.06, letterSpacing: "-0.025em", color: "#fff", fontWeight: 400, opacity: 0, animation: "fadeUp 0.6s 0.2s ease forwards" }}>
              Your customers expect{" "}
              <AnimatedHeroText words={heroWords} interval={2500} />{" "}
              replies.
            </h1>
            <p style={{ fontFamily: F.ar, fontSize: 20, color: "rgba(255,255,255,0.4)", direction: "rtl", marginTop: 14, opacity: 0, animation: "fadeUp 0.6s 0.3s ease forwards" }}>
              عملاؤك يتوقعون رد فوري. الآن يحصلون عليه.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: "rgba(255,255,255,0.6)", maxWidth: 480, marginTop: 28, opacity: 0, animation: "fadeUp 0.6s 0.35s ease forwards" }}>
              Azhl handles WhatsApp customer service, generates social content, and re-engages past clients — in Arabic and English — so you can focus on what you do best.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 40, alignItems: "center", opacity: 0, animation: "fadeUp 0.6s 0.4s ease forwards" }}>
              <a href="#pricing" style={{ background: "#fff", color: C.navy, padding: "16px 36px", borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                Start 14-Day Free Trial →
              </a>
              <a href="#features" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                See how it works →
              </a>
            </div>
          </div>

          {/* Phone Mockup */}
          <div style={{ opacity: 0, animation: "fadeUp 0.7s 0.5s ease forwards" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 28, overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.35)" }}>
              <div style={{ background: "rgba(255,255,255,0.07)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💇‍♀️</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Lina Beauty Salon</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Powered by Azhl AI</div>
                </div>
              </div>
              <div style={{ padding: 20, minHeight: 360, display: "flex", flexDirection: "column", gap: 10 }}>
                {chatStep >= 1 && <div style={bubbleStyle("in")}><div style={bubbleInner("in")}>Hi, how much for keratin treatment?</div><div style={timeStyle()}>2:14 PM</div></div>}
                {chatStep >= 2 && <div style={bubbleStyle("out")}><div style={aiTag}>✦ Azhl AI</div><div style={bubbleInner("out")}>أهلاً! 🌸 كيراتين ابتداءً من 350 درهم حسب طول الشعر. عندنا أوقات متاحة — تحبين تحجزين؟</div><div style={timeStyle("right")}>2:14 PM ✓✓</div></div>}
                {chatStep >= 3 && <div style={bubbleStyle("in")}><div style={bubbleInner("in")}>Yes! Thursday evening?</div><div style={timeStyle()}>2:15 PM</div></div>}
                {chatStep >= 4 && <div style={bubbleStyle("out")}><div style={aiTag}>✦ Azhl AI</div><div style={bubbleInner("out")}>تم حجزك الخميس الساعة 6 مساءً ✅ سنرسل لك تذكير. نتطلع لزيارتك! 💇‍♀️</div><div style={timeStyle("right")}>2:15 PM ✓✓</div></div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <Reveal>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 56px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderTop: "1px solid " + C.border, borderBottom: "1px solid " + C.border }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: "36px 32px", borderRight: i < 3 ? "1px solid " + C.border : "none", textAlign: "center" }}>
                <div style={{ fontFamily: F.serif, fontSize: 42, color: C.navy, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: C.light, marginTop: 8, fontWeight: 600, letterSpacing: "0.04em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* FEATURES */}
      <Reveal>
        <section id="features" style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 56px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>Platform</div>
          <h2 style={{ fontFamily: F.serif, fontSize: 44, color: C.navy, lineHeight: 1.15 }}>Three capabilities. <em style={{ fontStyle: "italic", color: C.teal }}>One subscription.</em></h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.mid, maxWidth: 480, marginTop: 16 }}>Everything a UAE small business needs to communicate professionally — without hiring a team.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", marginTop: 56, border: "1px solid " + C.border, borderRadius: 20, overflow: "hidden", background: C.white }}>
            {features.map((f, i) => (
              <div key={i} style={{ padding: "44px 36px", borderRight: i < 2 ? "1px solid " + C.border : "none", position: "relative" }}>
                <span style={{ fontFamily: F.serif, fontSize: 56, color: "rgba(12,27,51,0.06)", position: "absolute", top: 20, right: 24, lineHeight: 1 }}>{f.n}</span>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.navy, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 24 }}>{f.i}</div>
                <div style={{ fontFamily: F.serif, fontSize: 24, color: C.navy, marginBottom: 6 }}>{f.t}</div>
                <div style={{ fontFamily: F.ar, fontSize: 13, color: C.teal, direction: "rtl", marginBottom: 16, fontWeight: 600 }}>{f.ar}</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: C.mid }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* TESTIMONIALS */}
      <Reveal>
        <section id="clients" style={{ background: C.navy, padding: "100px 56px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>Client Results</div>
            <h2 style={{ fontFamily: F.serif, fontSize: 44, color: "#fff", lineHeight: 1.15 }}>Trusted across <em style={{ fontStyle: "italic", color: C.tealLight }}>the UAE.</em></h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginTop: 56 }}>
              {testimonials.map((t, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 28px" }}>
                  <div style={{ color: C.tealLight, fontSize: 13, letterSpacing: 3, marginBottom: 16 }}>★★★★★</div>
                  <p style={{ fontFamily: F.serif, fontSize: 17, fontStyle: "italic", lineHeight: 1.65, color: "rgba(255,255,255,0.85)", marginBottom: 24 }}>"{t.q}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{t.i}</div>
                    <div><div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t.n}</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{t.b}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* PRICING */}
      <Reveal>
        <section id="pricing" style={{ maxWidth: 1280, margin: "0 auto", padding: "100px 56px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.teal, marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontFamily: F.serif, fontSize: 44, color: C.navy }}>Simple plans. <em style={{ fontStyle: "italic", color: C.teal }}>No surprises.</em></h2>
          <p style={{ fontSize: 16, color: C.mid, maxWidth: 400, marginTop: 16 }}>Start free for 14 days. Cancel anytime.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 56 }}>
            {plans.map((p, i) => (
              <div key={i} style={{ background: C.white, border: "1px solid " + (p.f ? C.navy : C.border), borderRadius: 20, padding: "40px 32px", position: "relative", transform: p.f ? "scale(1.03)" : "none", boxShadow: p.f ? "0 12px 40px rgba(12,27,51,0.1)" : "none" }}>
                {p.f && <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: C.navy, color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 16px", borderRadius: 100 }}>Recommended</div>}
                <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.light, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontFamily: F.serif, fontSize: 52, color: C.navy, margin: "16px 0 4px", lineHeight: 1 }}><span style={{ fontSize: 18, color: C.light }}>AED </span>{p.price}</div>
                <div style={{ fontSize: 13, color: C.light, marginBottom: 28 }}>per month</div>
                <ul style={{ listStyle: "none", padding: 0, marginBottom: 32 }}>
                  {p.items.map((it, j) => <li key={j} style={{ fontSize: 14, color: C.mid, padding: "9px 0", borderBottom: "1px solid " + C.warm, display: "flex", alignItems: "center", gap: 10 }}><Chk />{it}</li>)}
                </ul>
                <button style={{ width: "100%", padding: 13, borderRadius: 10, fontFamily: F.sans, fontSize: 14, fontWeight: 700, cursor: "pointer", background: p.f ? C.navy : "transparent", color: p.f ? "#fff" : C.navy, border: p.f ? "none" : "2px solid " + C.border }}>
                  {p.f ? "Start Free Trial →" : "Get Started"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* CTA */}
      <Reveal>
        <section style={{ maxWidth: 1280, margin: "0 auto 80px", padding: "0 56px" }}>
          <div style={{ background: C.navy, borderRadius: 28, padding: "80px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 80% 20%, rgba(10,143,127,0.12) 0%, transparent 60%)" }} />
            <h2 style={{ fontFamily: F.serif, fontSize: 48, color: "#fff", lineHeight: 1.15, marginBottom: 12, position: "relative" }}>
              Ready to put your business <em style={{ color: C.tealLight, fontStyle: "italic" }}>on autopilot?</em>
            </h2>
            <div style={{ fontFamily: F.ar, fontSize: 18, color: "rgba(255,255,255,0.35)", direction: "rtl", marginBottom: 36, position: "relative" }}>جاهز تخلي عملك يشتغل تلقائياً؟</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", maxWidth: 460, margin: "0 auto", position: "relative" }}>
              <input placeholder="Your WhatsApp number" style={{ flex: 1, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "14px 18px", color: "#fff", fontFamily: F.sans, fontSize: 14, outline: "none" }} />
              <button style={{ background: C.teal, color: "#fff", border: "none", padding: "14px 28px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }}>Start Free →</button>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 16, position: "relative" }}>14-day free trial · No credit card · تجربة مجانية</p>
          </div>
        </section>
      </Reveal>

      {/* FOOTER */}
      <footer style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 56px", borderTop: "1px solid " + C.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.navy, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.ar, fontWeight: 700, fontSize: 15, color: "#fff" }}>أ</div>
          <span style={{ fontFamily: F.serif, fontSize: 20, color: C.navy }}>Azhl</span>
        </div>
        <p style={{ fontSize: 13, color: C.light }}>Built for UAE businesses · صُنع لأعمال الإمارات · Abu Dhabi 🇦🇪</p>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:none } }
        @keyframes msgIn { from { opacity:0; transform:translateY(6px) scale(0.97) } to { opacity:1; transform:none } }
        input::placeholder { color: rgba(255,255,255,0.3) !important; }
        @media(max-width:960px){
          nav{padding:0 24px!important}
          nav>div:last-child{display:none!important}
          section{padding-left:24px!important;padding-right:24px!important}
        }
      `}</style>
    </div>
  );
}
