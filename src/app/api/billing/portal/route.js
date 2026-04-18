import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { businessId } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey === "sk_test_placeholder") {
      return NextResponse.json(
        { error: "Stripe is not configured yet. Please add your Stripe keys." },
        { status: 503 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: biz, error } = await supabase
      .from("businesses")
      .select("stripe_customer_id")
      .eq("id", businessId)
      .single();

    if (error || !biz?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No active subscription found. Please subscribe first." },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: biz.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
