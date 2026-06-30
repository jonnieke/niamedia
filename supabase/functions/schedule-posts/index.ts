import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

// Called by pg_cron every 15 minutes — publishes any posts whose scheduled_at is now or past.
Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const authHeader = req.headers.get("Authorization") ?? ""
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "nia-cron-2026"
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const db = createClient(supabaseUrl, supabaseKey)

    const now = new Date().toISOString()

    // Find all due scheduled posts
    const { data: posts } = await db
      .from("scheduled_posts")
      .select("id")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)

    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ published: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    let published = 0
    const errors: string[] = []

    for (const post of posts) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/publish-post`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
          body: JSON.stringify({ postId: post.id }),
        })
        if (res.ok) published++
        else errors.push(`${post.id}: ${await res.text()}`)
      } catch (e) {
        errors.push(`${post.id}: ${String(e)}`)
      }
    }

    return new Response(
      JSON.stringify({ published, total: posts.length, errors: errors.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
