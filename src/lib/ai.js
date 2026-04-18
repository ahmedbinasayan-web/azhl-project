/**
 * Azhl AI Engine — wraps Claude API for WhatsApp replies and social content
 */

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Generate a WhatsApp reply for a customer message
 * @param {string} customerMessage - The incoming customer message
 * @param {object} business - Business profile from Supabase
 * @param {array} history - Previous conversation messages
 * @returns {string} AI-generated reply
 */
export async function generateReply(customerMessage, business, history = []) {
  const systemPrompt = buildSystemPrompt(business);

  const messages = [
    ...history.map((m) => ({
      role: m.role === "customer" ? "user" : "assistant",
      content: m.text,
    })),
    { role: "user", content: customerMessage },
  ];

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text || "Sorry, I could not process that. Please try again.";
  } catch (error) {
    console.error("AI reply error:", error);
    return "Sorry, there was an issue. Please try again or call us directly.";
  }
}

/**
 * Generate weekly social media posts for a business
 * @param {object} business - Business profile from Supabase
 * @param {number} count - Number of posts to generate (default 7)
 * @returns {array} Array of post objects
 */
export async function generatePosts(business, count = 7) {
  const prompt = `Generate ${count} social media posts for a UAE business.

Business: ${business.name}
Type: ${business.type}
Location: ${business.location}
Services: ${business.services}
Language: ${business.language || "Arabic + English"}

Rules:
- Mix Arabic and English posts (roughly 50/50)
- Include relevant hashtags in both languages
- Mix post types: promotional, lifestyle, seasonal, tips, behind-the-scenes
- Reference UAE culture, events (Eid, Ramadan, National Day), and local expressions
- Keep captions concise — 3-5 lines max
- Alternate between Instagram and TikTok formats
- Use emojis naturally

Return as JSON array with format:
[{"platform": "Instagram", "caption": "...", "type": "Promotional", "day": "Monday"}]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Post generation error:", error);
    return [];
  }
}

/**
 * Build the system prompt for a specific business
 */
function buildSystemPrompt(business) {
  return `You are the AI WhatsApp assistant for "${business.name}" in ${business.location}, UAE.

Business details:
- Name: ${business.name}
- Type: ${business.type}
- Location: ${business.location}
- Hours: ${business.hours || "Not specified"}
- Services & Prices:
${business.services || "Not specified"}

Rules:
- Reply in the SAME language the customer uses (Arabic for Arabic, English for English, mix if they mix)
- Be warm, friendly, and use local UAE expressions
- Use emojis naturally but not excessively
- Keep replies SHORT — 2-4 sentences maximum
- Always end with an offer to book or help further
- For bookings: ask for preferred date/time
- Never make up prices outside the listed services
- If you don't know something, say you'll check and get back to them
- Tone: ${business.tone || "Friendly"}`;
}
