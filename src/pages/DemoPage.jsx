import { useState, useRef, useEffect } from "react";

const businesses = {
  salon: {
    name: "Lina Beauty Salon", icon: "💇‍♀️", location: "JBR, Dubai",
    quickReplies: ["What are your prices?", "هل عندكم مواعيد؟", "Do you do hair color?", "كم الكيراتين؟"],
    system: `You are the AI WhatsApp assistant for "Lina Beauty Salon" in JBR, Dubai. Hours: Sat-Thu 10am-9pm, Fri 2pm-9pm. Services: Haircut AED 80-150, Keratin AED 350-600, Hair color AED 250-450, Blowout AED 80, Manicure AED 60, Pedicure AED 80, Eyebrow threading AED 30, Facial AED 150-300. Reply in the SAME language the customer uses. Be warm, use UAE expressions and emojis naturally. Keep replies to 2-4 sentences. Always offer to book.`
  },
  restaurant: {
    name: "Layali Restaurant", icon: "🍽️", location: "Corniche, Abu Dhabi",
    quickReplies: ["What's on the menu?", "هل عندكم توصيل؟", "Book a table for 4", "ما هي الأسعار؟"],
    system: `You are the AI WhatsApp assistant for "Layali Restaurant" on Corniche, Abu Dhabi. Emirati & Arabic cuisine. Hours: Daily 12pm-12am. Menu: Harees AED 35, Machboos AED 55-65, Luqaimat AED 25, Mixed grill AED 120, Set menu for 2 AED 150. Delivery via Talabat (min AED 60). Reply in same language as customer. Emirati hospitality tone. Keep SHORT.`
  },
  clinic: {
    name: "Al Shifa Dental", icon: "🦷", location: "Al Qasimia, Sharjah",
    quickReplies: ["Do you accept insurance?", "كم تنظيف الأسنان؟", "Book appointment", "Is the doctor available?"],
    system: `You are the AI assistant for "Al Shifa Dental Clinic" in Sharjah. Hours: Sat-Thu 9am-9pm, Fri 4pm-9pm. Services: Cleaning AED 200-300, Filling AED 200-350, Root canal AED 800-1200, Whitening AED 600-900, Veneers AED 800-1500. Insurance: Daman, AXA, Oman Insurance. Female doctor available. Reply in same language. Professional but warm. Never diagnose. Keep SHORT.`
  },
  ac: {
    name: "CoolTech AC Services", icon: "❄️", location: "All Dubai",
    quickReplies: ["AC not cooling!", "كم صيانة المكيف؟", "Can you come today?", "عقد سنوي كم؟"],
    system: `You are the AI assistant for "CoolTech AC Services" in Dubai. Hours: Daily 8am-10pm, 24/7 emergency. Services: AC cleaning AED 100-150/unit, Gas refill R22 AED 200-300, Gas refill R410A AED 300-450, Repair from AED 150, Annual contract (4 units) AED 1200/year. Same-day service. Reply in same language. Direct and practical. Ask what area in Dubai. Keep SHORT.`
  }
};

const fallbacks = {
  salon: "أهلاً! 🌸 خدماتنا تبدأ من 80 درهم للقص. الكيراتين من 350 درهم. هل تودين حجز موعد؟",
  restaurant: "أهلاً وسهلاً! 🍽️ عندنا مجبوس ب 55 درهم وهريس ب 35 درهم. التوصيل متاح عبر طلبات!",
  clinic: "أهلاً! 🦷 تنظيف الأسنان من 200 درهم. الاستشارة مجانية مع العلاج. نحجز لك موعد؟",
  ac: "مرحباً! ❄️ صيانة المكيف من 100 درهم. نوصل نفس اليوم لكل دبي. في أي منطقة أنت؟"
};

export default function AzhlDemo() {
  const [biz, setBiz] = useState("salon");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const chatRef = useRef(null);
  const b = businesses[biz];

  useEffect(() => {
    setMessages([{ role: "ai", text: `Welcome to ${b.name}! ${b.icon}\nI'm the AI assistant — ask me anything about services, prices, or bookings in Arabic or English.`, time: now() }]);
    setHistory([]);
  }, [biz]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  function now() { return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }); }

  async function send(text) {
    if (!text?.trim() || loading) return;
    const t = text.trim();
    setInput("");
    setMessages(m => [...m, { role: "customer", text: t, time: now() }]);
    const newHistory = [...history, { role: "user", content: t }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: b.system, messages: newHistory })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || fallbacks[biz];
      await new Promise(r => setTimeout(r, 300));
      setMessages(m => [...m, { role: "ai", text: reply, time: now() }]);
      setHistory(h => [...h, { role: "assistant", content: reply }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: fallbacks[biz], time: now() }]);
    }
    setLoading(false);
  }

  const s = {
    root: { display: "flex", height: "100vh", fontFamily: "'Syne', -apple-system, sans-serif", background: "#FAFAF7", color: "#1A1A18" },
    sidebar: { width: 300, borderRight: "1px solid #E0DDD5", display: "flex", flexDirection: "column", background: "#FFF", flexShrink: 0 },
    sideTop: { padding: "20px 24px", borderBottom: "1px solid #E0DDD5", display: "flex", alignItems: "center", gap: 12 },
    logoBox: { width: 36, height: 36, background: "#0C1B33", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 17, color: "#FFF", fontFamily: "'Noto Kufi Arabic'" },
    logoText: { fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "#0C1B33" },
    badge: { marginLeft: "auto", background: "rgba(10,143,127,0.08)", border: "1px solid rgba(10,143,127,0.2)", color: "#0A8F7F", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.05em" },
    sideLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8A82", padding: "20px 24px 10px" },
    bizBtn: (active) => ({
      display: "flex", alignItems: "center", gap: 12, padding: "14px 24px", cursor: "pointer",
      background: active ? "rgba(10,143,127,0.04)" : "transparent", borderLeft: active ? "3px solid #0A8F7F" : "3px solid transparent",
      border: "none", borderBottom: "1px solid #F5F3EE", width: "100%", textAlign: "left", fontFamily: "'Syne'",
      transition: "all 0.15s",
    }),
    bizIcon: { width: 42, height: 42, borderRadius: 10, background: "#F5F3EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
    bizName: { fontSize: 14, fontWeight: 700, color: "#1A1A18" },
    bizLoc: { fontSize: 11, color: "#8A8A82", marginTop: 2 },
    main: { flex: 1, display: "flex", flexDirection: "column" },
    header: { padding: "16px 24px", borderBottom: "1px solid #E0DDD5", display: "flex", alignItems: "center", gap: 14, background: "#FFF" },
    hAva: { width: 44, height: 44, borderRadius: 12, background: "#F5F3EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
    hName: { fontSize: 16, fontWeight: 700, color: "#0C1B33" },
    hStatus: { fontSize: 12, color: "#0A8F7F", marginTop: 2, fontWeight: 600 },
    chat: { flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 12, background: "#FAFAF7" },
    msgCustomer: { alignSelf: "flex-start", maxWidth: "72%" },
    msgAi: { alignSelf: "flex-end", maxWidth: "72%" },
    bubbleC: { padding: "11px 16px", borderRadius: "18px 18px 18px 4px", background: "#FFF", border: "1px solid #E0DDD5", fontSize: 14, lineHeight: 1.6, color: "#1A1A18" },
    bubbleA: { padding: "11px 16px", borderRadius: "18px 18px 4px 18px", background: "#0C1B33", color: "#FFF", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" },
    time: { fontSize: 10, color: "#8A8A82", marginTop: 3, padding: "0 4px" },
    aiTag: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#0A8F7F", background: "rgba(10,143,127,0.08)", border: "1px solid rgba(10,143,127,0.15)", padding: "2px 8px", borderRadius: 4, marginBottom: 5 },
    quickRow: { padding: "12px 24px", display: "flex", gap: 8, flexWrap: "wrap", background: "#FFF", borderBottom: "1px solid #E0DDD5" },
    qBtn: { background: "rgba(10,143,127,0.06)", border: "1px solid rgba(10,143,127,0.18)", color: "#0A8F7F", fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 100, cursor: "pointer", fontFamily: "'Syne'", transition: "all 0.15s", whiteSpace: "nowrap" },
    inputRow: { padding: "12px 24px", display: "flex", gap: 10, alignItems: "center", background: "#FFF", borderTop: "1px solid #E0DDD5" },
    inputBox: { flex: 1, background: "#F5F3EE", border: "1px solid #E0DDD5", borderRadius: 12, padding: "12px 18px", fontSize: 14, color: "#1A1A18", fontFamily: "'Syne'", outline: "none", resize: "none" },
    sendBtn: (disabled) => ({
      width: 44, height: 44, borderRadius: 12, background: disabled ? "#E0DDD5" : "#0C1B33", color: "#FFF",
      border: "none", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, transition: "all 0.2s", flexShrink: 0,
    }),
    typing: { alignSelf: "flex-end", display: "flex", gap: 5, padding: "12px 16px", background: "#0C1B33", borderRadius: "18px 18px 4px 18px" },
    dot: (d) => ({
      width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.4)",
      animation: `typeBounce 1.2s ${d}s ease infinite`,
    }),
    sideInfo: { margin: "auto 24px 24px", padding: 18, background: "#F8F7F4", border: "1px solid #E0DDD5", borderRadius: 14, fontSize: 12, lineHeight: 1.7, color: "#8A8A82" },
  };

  return (
    <div style={s.root}>
      <style>{`
        @keyframes typeBounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-5px);opacity:1} }
        input::placeholder,textarea::placeholder{color:#8A8A82}
      `}</style>

      <div style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logoBox}>أ</div>
          <div style={s.logoText}>Azhl</div>
          <div style={s.badge}>LIVE DEMO</div>
        </div>

        <div style={s.sideLabel}>Select Business</div>
        {Object.entries(businesses).map(([k, v]) => (
          <button key={k} style={s.bizBtn(biz === k)} onClick={() => setBiz(k)}>
            <div style={s.bizIcon}>{v.icon}</div>
            <div>
              <div style={s.bizName}>{v.name}</div>
              <div style={s.bizLoc}>{v.location}</div>
            </div>
          </button>
        ))}

        <div style={s.sideInfo}>
          <strong style={{ color: "#0C1B33" }}>How it works</strong><br />
          Type any customer question in Arabic or English. The AI responds as the business — with the right services, prices, and local tone.
        </div>
      </div>

      <div style={s.main}>
        <div style={s.header}>
          <div style={s.hAva}>{b.icon}</div>
          <div>
            <div style={s.hName}>{b.name}</div>
            <div style={s.hStatus}>✦ AI Agent Online</div>
          </div>
        </div>

        <div style={s.quickRow}>
          {b.quickReplies.map((q, i) => (
            <button key={i} style={s.qBtn} onClick={() => send(q)} onMouseOver={e => e.target.style.background = "rgba(10,143,127,0.12)"} onMouseOut={e => e.target.style.background = "rgba(10,143,127,0.06)"}>{q}</button>
          ))}
        </div>

        <div ref={chatRef} style={s.chat}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === "customer" ? s.msgCustomer : s.msgAi}>
              {m.role === "ai" && <div style={s.aiTag}>✦ Azhl AI</div>}
              <div style={m.role === "customer" ? s.bubbleC : s.bubbleA}>{m.text}</div>
              <div style={{ ...s.time, textAlign: m.role === "ai" ? "right" : "left" }}>
                {m.time} {m.role === "ai" && "✓✓"}
              </div>
            </div>
          ))}
          {loading && (
            <div style={s.typing}>
              <div style={s.dot(0)} /><div style={s.dot(0.2)} /><div style={s.dot(0.4)} />
            </div>
          )}
        </div>

        <div style={s.inputRow}>
          <textarea
            style={s.inputBox}
            rows={1}
            placeholder="Type a message in Arabic or English..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          />
          <button style={s.sendBtn(loading || !input.trim())} onClick={() => send(input)} disabled={loading || !input.trim()}>➤</button>
        </div>
      </div>
    </div>
  );
}
