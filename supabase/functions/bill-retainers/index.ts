/**
 * bill-retainers — runs daily via pg_cron.
 * Finds every active retainer whose next_billing_date <= today,
 * creates a proposal for the current month, sends a payment email
 * to the client (if email exists), advances next_billing_date by 1 month,
 * and fires an admin notification for each one processed.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { notifyAdmins } from "../_shared/notify.ts"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const appUrl      = Deno.env.get("APP_URL") ?? "https://niamedia.co.ke"

interface Retainer {
  id: string
  business_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  industry: string | null
  monthly_videos: number
  monthly_posters: number
  campaign_credits: number
  monthly_price: number
  next_billing_date: string
  billing_day: number
  months_billed: number
  total_billed: number
}

Deno.serve(async (req) => {
  // Accept both cron invocations (POST with no body) and manual triggers
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } })
  }

  const sb = createClient(supabaseUrl, serviceKey)
  const today = new Date().toISOString().split("T")[0]

  // Fetch all active retainers due today or overdue
  const { data: due, error } = await sb
    .from("retainers")
    .select("*")
    .eq("status", "active")
    .lte("next_billing_date", today)

  if (error) {
    console.error("bill-retainers fetch error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const retainers = (due ?? []) as Retainer[]
  if (retainers.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: "No retainers due today." }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  const results: { id: string; business_name: string; status: string }[] = []

  for (const r of retainers) {
    try {
      const month = new Date().toLocaleString("en-KE", { month: "long", year: "numeric" })
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 7)

      const deliverables = [
        r.monthly_videos > 0 && `${r.monthly_videos} video commercial${r.monthly_videos > 1 ? "s" : ""}`,
        r.monthly_posters > 0 && `${r.monthly_posters} promo poster${r.monthly_posters > 1 ? "s" : ""}`,
        r.campaign_credits > 0 && `${r.campaign_credits} AI campaign credit${r.campaign_credits > 1 ? "s" : ""}`,
        "1 round of revisions per deliverable",
      ].filter(Boolean) as string[]

      // Create proposal
      const { data: proposal, error: pErr } = await sb.from("proposals").insert({
        business_name: r.business_name,
        contact_name: r.contact_name,
        phone: r.phone ?? "",
        email: r.email,
        industry: r.industry,
        video_length: `${r.monthly_videos}× monthly`,
        platforms: [],
        what_to_promote: `Monthly retainer — ${month}`,
        delivery_speed: "standard",
        include_poster: r.monthly_posters > 0,
        include_subtitles: false,
        final_price: r.monthly_price,
        deposit_percent: 100,
        deposit_amount: r.monthly_price,
        deliverables,
        timeline_days: 28,
        valid_until: validUntil.toISOString().split("T")[0],
        status: "sent",
        admin_notes: `Auto-billed retainer — ${month}`,
      }).select("token").single()

      if (pErr || !proposal) throw new Error(pErr?.message ?? "Proposal insert failed")

      // Send payment email to client
      if (r.email) {
        await sb.functions.invoke("send-client-email", {
          body: {
            type: "proposal_sent",
            to: r.email,
            name: r.contact_name,
            businessName: r.business_name,
            proposalToken: (proposal as { token: string }).token,
            finalPrice: r.monthly_price,
            depositAmount: r.monthly_price,
          },
        })
      }

      // Advance billing date by 1 month
      const nextDate = new Date(r.next_billing_date)
      nextDate.setMonth(nextDate.getMonth() + 1)
      // Clamp to billing_day in the new month (handles month-end edge cases)
      const maxDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()
      nextDate.setDate(Math.min(r.billing_day, maxDay))

      await sb.from("retainers").update({
        next_billing_date: nextDate.toISOString().split("T")[0],
        last_billed_at: new Date().toISOString(),
        months_billed: r.months_billed + 1,
        total_billed: r.total_billed + r.monthly_price,
      }).eq("id", r.id)

      // Admin notification
      void notifyAdmins(
        "success",
        `Retainer auto-billed — ${r.business_name}`,
        `KES ${r.monthly_price.toLocaleString("en-KE")} proposal created for ${month}. Next billing: ${nextDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}.`,
        "/retainers",
      )

      results.push({ id: r.id, business_name: r.business_name, status: "billed" })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`bill-retainers failed for ${r.id}:`, msg)
      results.push({ id: r.id, business_name: r.business_name, status: `error: ${msg}` })
    }
  }

  const succeeded = results.filter(r => r.status === "billed").length
  const failed    = results.length - succeeded

  if (succeeded > 0) {
    void notifyAdmins(
      "info",
      `Retainer billing run complete`,
      `${succeeded} retainer${succeeded !== 1 ? "s" : ""} billed${failed > 0 ? `, ${failed} failed — check logs` : "."}.`,
      "/retainers",
    )
  }

  return new Response(JSON.stringify({ processed: results.length, succeeded, failed, results }), {
    headers: { "Content-Type": "application/json" },
  })
})
