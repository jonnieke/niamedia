import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const json = await req.json().catch(() => ({}))
  const token = json.token as string | undefined
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: share } = await supabase
    .from("campaign_shares")
    .select("campaign_id, platform")
    .eq("share_token", token)
    .single()

  if (!share) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, title, type, content, metadata, created_at")
    .eq("id", share.campaign_id)
    .single()

  if (!campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const content = campaign.content as Record<string, unknown>
  const metadata = (campaign.metadata ?? {}) as Record<string, string>

  return new Response(JSON.stringify({
    id: campaign.id,
    title: campaign.title,
    industry: campaign.type,
    businessName: metadata.business_name ?? campaign.title,
    whatsappNumber: metadata.whatsapp_number ?? "",
    landingPage: content?.landingPage ?? null,
    strategy: content?.strategy ?? null,
    createdAt: campaign.created_at,
  }), { headers: { ...cors, "Content-Type": "application/json" } })
})
