import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { generateReply } from "../../../lib/ai";

/**
 * POST /api/whatsapp
 * Webhook endpoint for incoming WhatsApp messages via 360dialog/Twilio
 *
 * Flow:
 * 1. Receive incoming message from WhatsApp API
 * 2. Look up the business by WhatsApp number
 * 3. Fetch conversation history
 * 4. Generate AI reply using Claude
 * 5. Send reply back via WhatsApp API
 * 6. Log conversation in database
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Extract message data (360dialog format — adjust for Twilio if needed)
    const message = body.messages?.[0];
    if (!message) {
      return NextResponse.json({ status: "no message" }, { status: 200 });
    }

    const customerPhone = message.from;
    const customerText = message.text?.body || message.text || "";
    const businessPhone = body.metadata?.display_phone_number || body.to;

    if (!customerText.trim()) {
      return NextResponse.json({ status: "empty message" }, { status: 200 });
    }

    // 1. Find the business by WhatsApp number
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("*")
      .eq("phone", businessPhone)
      .single();

    if (bizError || !business) {
      console.error("Business not found for phone:", businessPhone);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 2. Fetch recent conversation history (last 10 messages)
    const { data: history } = await supabase
      .from("conversations")
      .select("role, text, created_at")
      .eq("business_id", business.id)
      .eq("customer_phone", customerPhone)
      .order("created_at", { ascending: true })
      .limit(10);

    // 3. Generate AI reply
    const aiReply = await generateReply(customerText, business, history || []);

    // 4. Log customer message
    await supabase.from("conversations").insert({
      business_id: business.id,
      customer_phone: customerPhone,
      role: "customer",
      text: customerText,
    });

    // 5. Log AI reply
    await supabase.from("conversations").insert({
      business_id: business.id,
      customer_phone: customerPhone,
      role: "ai",
      text: aiReply,
    });

    // 6. Update or create customer record
    await supabase.from("customers").upsert(
      {
        phone: customerPhone,
        business_id: business.id,
        last_contact: new Date().toISOString(),
        name: message.profile?.name || null,
      },
      { onConflict: "phone,business_id" }
    );

    // 7. Update daily analytics
    const today = new Date().toISOString().split("T")[0];
    await supabase.rpc("increment_analytics", {
      p_business_id: business.id,
      p_date: today,
      p_field: "messages_count",
    });

    // 8. Send reply via WhatsApp API (360dialog)
    // Replace with your 360dialog API key
    const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
    const WHATSAPP_API_URL = "https://waba.360dialog.io/v1/messages";

    await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "D360-API-KEY": WHATSAPP_API_KEY,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: customerPhone,
        type: "text",
        text: { body: aiReply },
      }),
    });

    return NextResponse.json({ status: "replied", reply: aiReply });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/whatsapp
 * Webhook verification endpoint (required by WhatsApp/360dialog setup)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "azhl-verify-2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}
