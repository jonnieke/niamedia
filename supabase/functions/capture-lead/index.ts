import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

async function sendWhatsAppAlert(ownerWhatsApp: string, leadName: string, leadPhone: string, campaignTitle: string) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM") // e.g. "whatsapp:+14155238886"
  if (!accountSid || !authToken || !from) return

  // Normalise owner number to E.164
  const digits = ownerWhatsApp.replace(/\D/g, "")
  const e164 = digits.startsWith("0") ? `+254${digits.slice(1)}` : digits.startsWith("254") ? `+${digits}` : `+${digits}`
  const to = `whatsapp:${e164}`

  const displayName = leadName ? ` *${leadName}*` : ""
  const body = `🔔 *New lead!*\n\n${displayName}${leadName ? "\n" : ""}📱 ${leadPhone}\n\n_Enquired via your *${campaignTitle}* campaign page on Nia Media_\n\nReply on WhatsApp to follow up now. 🚀`

  const params = new URLSearchParams({ From: from, To: to, Body: body })
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(8000),
  }).catch(() => { /* notification is best-effort */ })
}

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
    .select("id, user_id, title")
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

  // Fire-and-forget: WhatsApp alert + follow-up drip (run in parallel)
  const { data: brandKit } = await supabase
    .from("brand_kits")
    .select("whatsapp, preferred_tone")
    .eq("user_id", campaign.user_id)
    .maybeSingle()

  const { data: campaignRow } = await supabase
    .from("campaigns")
    .select("content, metadata")
    .eq("id", campaign.id)
    .maybeSingle()

  const campaignContent = campaignRow?.content ? (() => { try { return JSON.parse(campaignRow.content) } catch { return null } })() : null
  const meta = campaignRow?.metadata as Record<string, unknown> | null

  if (brandKit?.whatsapp) {
    sendWhatsAppAlert(brandKit.whatsapp, name?.trim() ?? "", phone.trim(), campaign.title ?? "campaign")
  }

  supabase.functions.invoke("schedule-follow-ups", {
    body: {
      leadId: (await supabase.from("leads").select("id").eq("campaign_id", campaign.id).eq("phone", phone.trim()).maybeSingle()).data?.id,
      campaignId: campaign.id,
      userId: campaign.user_id,
      leadName: name?.trim() ?? "",
      leadPhone: phone.trim(),
      campaignTitle: campaign.title ?? "campaign",
      campaignContent,
      businessName: (meta?.business_name as string) ?? "",
      tone: (meta?.tone as string) ?? brandKit?.preferred_tone ?? "Friendly",
    },
  }).catch(() => { /* best-effort */ })

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
