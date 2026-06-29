import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

async function sendWhatsApp(to: string, body: string, accountSid: string, authToken: string, from: string) {
  const digits = to.replace(/\D/g, "")
  const e164 = digits.startsWith("0") ? `+254${digits.slice(1)}` : digits.startsWith("254") ? `+${digits}` : `+${digits}`
  const params = new URLSearchParams({ From: from, To: `whatsapp:${e164}`, Body: body })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(10000),
  })
  return res.ok
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  // Verify cron secret (set CRON_SECRET=nia-cron-2026 in Supabase secrets)
  const cronSecret = req.headers.get("x-cron-secret")
  const expectedSecret = Deno.env.get("CRON_SECRET") ?? "nia-cron-2026"
  if (cronSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
  const from = Deno.env.get("TWILIO_WHATSAPP_FROM")

  if (!accountSid || !authToken || !from) {
    return new Response(JSON.stringify({ skipped: true, reason: "Twilio not configured" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  // Fetch due follow-ups (scheduled_at <= now, status = pending)
  const { data: dueFollowUps, error } = await supabase
    .from("lead_follow_ups")
    .select("id, lead_id, message, sequence_number")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .limit(50) // process max 50 per run

  if (error || !dueFollowUps?.length) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  // Fetch lead phone numbers for the due follow-ups
  const leadIds = [...new Set(dueFollowUps.map(f => f.lead_id))]
  const { data: leads } = await supabase
    .from("leads")
    .select("id, phone, status")
    .in("id", leadIds)

  const leadMap = new Map((leads ?? []).map(l => [l.id, l]))

  let sent = 0
  let skipped = 0

  for (const followUp of dueFollowUps) {
    const lead = leadMap.get(followUp.lead_id)

    // Skip if lead was converted or lost — no more chasing
    if (!lead || ["Converted", "Lost"].includes(lead.status)) {
      await supabase.from("lead_follow_ups").update({ status: "skipped", sent_at: new Date().toISOString() }).eq("id", followUp.id)
      skipped++
      continue
    }

    const ok = await sendWhatsApp(lead.phone, followUp.message, accountSid, authToken, from).catch(() => false)

    await supabase.from("lead_follow_ups")
      .update({ status: ok ? "sent" : "failed", sent_at: new Date().toISOString() })
      .eq("id", followUp.id)

    if (ok) sent++
  }

  return new Response(JSON.stringify({ processed: dueFollowUps.length, sent, skipped }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
