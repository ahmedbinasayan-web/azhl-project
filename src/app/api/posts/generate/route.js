import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { generatePosts } from "../../../lib/ai";

/**
 * POST /api/posts/generate
 * Generate weekly social media posts for a business
 * Body: { businessId: string, count: number }
 */
export async function POST(request) {
  try {
    const { businessId, count = 7 } = await request.json();

    // Fetch business profile
    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Generate posts via AI
    const posts = await generatePosts(business, count);

    // Save to database
    const postsToInsert = posts.map((post) => ({
      business_id: businessId,
      platform: post.platform,
      caption: post.caption,
      type: post.type,
      day: post.day,
      status: "ready",
    }));

    const { data: savedPosts, error: insertError } = await supabase
      .from("posts")
      .insert(postsToInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save posts" }, { status: 500 });
    }

    return NextResponse.json({ posts: savedPosts });
  } catch (error) {
    console.error("Post generation error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
