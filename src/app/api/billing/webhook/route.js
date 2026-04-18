import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || stripeKey === "sk_test_placeholder") {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { businessId, plan } = session.metadata || {};
      if (businessId) {
        await supabase.from("businesses").update({
          plan: plan || "starter",
          plan_status: "active",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        }).eq("id", businessId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await supabase.from("businesses").update({ plan_status: "cancelled" })
        .eq("stripe_subscription_id", sub.id);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      await supabase.from("businesses").update({ plan_status: "past_due" })
        .eq("stripe_customer_id", invoice.customer);
    }
  } catch (err) {
    console.error("Webhook DB error:", err.message);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
