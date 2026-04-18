import Stripe from "stripe";
import { NextResponse } from "next/server";

const PRICE_IDS = {
  starter: "price_1TNhDnQZ0fiEx2jYU1Y7nS5n",
  growth:  "price_1TNhDnQZ0fiEx2jYsuEfpHD0",
  pro:     "price_1TNhDnQZ0fiEx2jYaYn8EZLK",
};

export async function POST(req) {
  try {
    const { plan, businessId } = await req.json();

    if (!plan || !businessId) {
      return NextResponse.json({ error: "Missing plan or businessId" }, { status: 400 });
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === "sk_test_placeholder") {
      return NextResponse.json(
        { error: "Stripe is not configured yet. Please add your Stripe keys to continue." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?subscribed=true`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { businessId, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
