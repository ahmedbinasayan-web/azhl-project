import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client using service role key — bypasses RLS safely server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  // Verify the caller is an authenticated Supabase user
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, location, phone } = body;

  const { error } = await supabaseAdmin.from("businesses").insert({
    owner_id: user.id,
    name,
    type,
    location,
    phone,
    plan: "starter",
    plan_status: "trial",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
