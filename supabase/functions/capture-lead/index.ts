import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { token, name, phone, email } = await req.json().catch(() => ({}))

  if (!token || !phone) {
    return new Response(JSON.stringify({ error: "token and phone are required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  // Look up share → campaign → user_id
  const { data: share, error: shareErr } = await supabase
    .from("campaign_shares")
    .select("campaign_id")
    .eq("share_token", token)
    .maybeSingle()

  if (shareErr || !share) {
    return new Response(JSON.stringify({ error: "Invalid share token" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("id, user_id")
    .eq("id", share.campaign_id)
    .maybeSingle()

  if (campErr || !campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  // Deduplicate: skip if same phone already submitted for this campaign
  const { data: existing } = await supabase
    .from("leads")
    .select("id")
    .eq("campaign_id", campaign.id)
    .eq("phone", phone.trim())
    .maybeSingle()

  if (existing) {
    return new Response(JSON.stringify({ success: true, duplicate: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { error: insertErr } = await supabase.from("leads").insert({
    user_id: campaign.user_id,
    campaign_id: campaign.id,
    name: name?.trim() ?? "",
    phone: phone.trim(),
    email: email?.trim() ?? "",
    source: "Campaign Landing Page",
    status: "New",
    interest_level: "Warm",
  })

  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
