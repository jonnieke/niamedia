import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

// Called by pg_cron every Monday at 4 AM UTC (7 AM EAT)
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

    // Find all users with weekly reports enabled
    const { data: users } = await db
      .from("profiles")
      .select("id")
      .eq("weekly_report_enabled", true)

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No users with weekly reports enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const origin = Deno.env.get("APP_URL") ?? "https://niamedia.co.ke"
    let sent = 0
    const errors: string[] = []

    for (const user of users) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/generate-report`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cronSecret}`,
            Origin: origin,
          },
          body: JSON.stringify({ user_id: user.id }),
        })
        if (res.ok) sent++
        else errors.push(`User ${user.id}: ${await res.text()}`)
      } catch (e) {
        errors.push(`User ${user.id}: ${String(e)}`)
      }
    }

    return new Response(
      JSON.stringify({ sent, total: users.length, errors: errors.slice(0, 5) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
