import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import Anthropic from "npm:@anthropic-ai/sdk"
import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization") ?? ""
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!

    // Auth check — accept either a user JWT or the cron secret (for scheduled runs)
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "nia-cron-2026"
    const isCron = authHeader === `Bearer ${cronSecret}`

    let targetUserId: string | null = null
    let userProfile: { weekly_report_phone?: string; name?: string; email?: string } = {}

    if (isCron) {
      // Called from send-weekly-reports — must pass user_id in body
      const body = await req.json().catch(() => ({})) as { user_id?: string }
      targetUserId = body.user_id ?? null
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "user_id required for cron calls" }), { status: 400, headers: corsHeaders })
      }
    } else {
      // Called by authenticated user — use their JWT
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user } } = await userClient.auth.getUser()
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
      targetUserId = user.id
    }

    const db = createClient(supabaseUrl, supabaseKey)

    // Fetch user profile
    const { data: profile } = await db
      .from("profiles")
      .select("name, email, weekly_report_phone")
      .eq("id", targetUserId)
      .single()
    if (profile) userProfile = profile

    // Date range: last 7 days
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setHours(23, 59, 59, 999)
    const periodStart = new Date(now)
    periodStart.setDate(periodStart.getDate() - 6)
    periodStart.setHours(0, 0, 0, 0)

    const periodStartStr = periodStart.toISOString()
    const periodEndStr = periodEnd.toISOString()

    // Fetch data in parallel
    const [campaignRes, leadRes, allLeadRes] = await Promise.all([
      db.from("campaigns")
        .select("id, title, created_at, metadata")
        .eq("user_id", targetUserId)
        .gte("created_at", periodStartStr),
      db.from("leads")
        .select("id, status, estimated_value, source, campaign_id, created_at")
        .eq("user_id", targetUserId)
        .gte("created_at", periodStartStr),
      db.from("leads")
        .select("id, status, estimated_value")
        .eq("user_id", targetUserId),
    ])

    const weekCampaigns = campaignRes.data ?? []
    const weekLeads = leadRes.data ?? []
    const allLeads = allLeadRes.data ?? []

    const totalLeads = allLeads.length
    const converted = allLeads.filter(l => l.status === "Converted")
    const pipeline = allLeads.filter(l => !["Lost", "Converted"].includes(l.status))
    const pipelineValue = pipeline.reduce((s, l) => s + (l.estimated_value ?? 0), 0)
    const wonValue = converted.reduce((s, l) => s + (l.estimated_value ?? 0), 0)
    const convRate = totalLeads > 0 ? Math.round((converted.length / totalLeads) * 100) : 0

    const weekConverted = weekLeads.filter(l => l.status === "Converted").length
    const weekLost = weekLeads.filter(l => l.status === "Lost").length

    // Source breakdown
    const sourceMap: Record<string, number> = {}
    weekLeads.forEach(l => { sourceMap[l.source ?? "Unknown"] = (sourceMap[l.source ?? "Unknown"] ?? 0) + 1 })
    const topSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A"

    const stats = {
      weekCampaigns: weekCampaigns.length,
      weekLeads: weekLeads.length,
      weekConverted,
      weekLost,
      totalLeads,
      totalConverted: converted.length,
      convRate,
      pipelineValue,
      wonValue,
      topSource,
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
    }

    // Generate narrative with Claude Haiku
    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") })
    const narrativePrompt = `You are a marketing performance analyst writing a weekly report for a Kenyan SME using Nia Media.

Business owner: ${userProfile.name ?? "there"}
Week: ${stats.periodStart} to ${stats.periodEnd}

This week's stats:
- New leads: ${stats.weekLeads} (from ${stats.weekCampaigns} campaign(s))
- Leads converted this week: ${stats.weekConverted}
- Leads lost this week: ${stats.weekLost}
- Top lead source: ${stats.topSource}

All-time pipeline:
- Total leads: ${stats.totalLeads}
- Overall conversion rate: ${stats.convRate}%
- Open pipeline value: KES ${stats.pipelineValue.toLocaleString()}
- Total revenue won: KES ${stats.wonValue.toLocaleString()}

Write a friendly, concise weekly performance summary in 3 short paragraphs:
1. How this week went (leads, conversions, highlights)
2. One specific insight or observation (e.g. best source, trend)
3. One actionable recommendation for next week

Keep it warm and encouraging. Max 150 words. No headers. No bullet points.`

    const aiRes = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: narrativePrompt }],
    })
    const narrative = (aiRes.content[0] as { text: string }).text ?? ""

    // Save report to DB
    const { data: report, error: saveError } = await db
      .from("weekly_reports")
      .insert({
        user_id: targetUserId,
        period_start: stats.periodStart,
        period_end: stats.periodEnd,
        stats,
        narrative,
      })
      .select("id, report_token")
      .single()

    if (saveError || !report) {
      return new Response(JSON.stringify({ error: "Failed to save report" }), { status: 500, headers: corsHeaders })
    }

    const reportUrl = `${Deno.env.get("SUPABASE_URL")?.replace("supabase.co", "supabase.co") ?? ""}`
    const shareUrl = `${req.headers.get("origin") ?? "https://niamedia.co.ke"}/report/${report.report_token}`

    // Optionally send WhatsApp if user has a phone number set
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID")
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN")
    const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "whatsapp:+14155238886"

    let whatsappSent = false
    const recipientPhone = userProfile.weekly_report_phone
    if (twilioSid && twilioToken && recipientPhone) {
      const phone = recipientPhone.replace(/^0/, "+254").replace(/^\+?(\d+)$/, "+$1").replace(/^\+\+/, "+")
      const message = `*📊 Your Nia Media Weekly Report*\n\n${narrative.slice(0, 500)}\n\n📈 This week: ${stats.weekLeads} new leads • ${stats.weekConverted} converted\n💰 Pipeline: KES ${stats.pipelineValue.toLocaleString()}\n\nFull report: ${shareUrl}`

      try {
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ From: twilioFrom, To: `whatsapp:${phone}`, Body: message }),
          }
        )
        whatsappSent = twilioRes.ok
      } catch { /* silent */ }
    }

    // Mark as sent
    if (whatsappSent) {
      await db.from("weekly_reports").update({ sent_at: new Date().toISOString() }).eq("id", report.id)
    }

    return new Response(
      JSON.stringify({ success: true, reportId: report.id, reportToken: report.report_token, shareUrl, stats, whatsappSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
