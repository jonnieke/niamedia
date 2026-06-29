import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { token } = await req.json().catch(() => ({}))
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing token" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: review, error: reviewErr } = await supabase
    .from("campaign_reviews")
    .select("id, campaign_id, status, reviewer_name, overall_comment, section_feedback")
    .eq("review_token", token)
    .maybeSingle()

  if (reviewErr || !review) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("title, content, metadata")
    .eq("id", review.campaign_id)
    .maybeSingle()

  if (!campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  let content = null
  try { content = JSON.parse(campaign.content ?? "{}") } catch { /**/ }
  const meta = campaign.metadata as Record<string, unknown> | null

  return new Response(JSON.stringify({
    reviewId: review.id,
    reviewToken: token,
    currentStatus: review.status,
    existingFeedback: {
      reviewerName: review.reviewer_name,
      overallComment: review.overall_comment,
      sectionFeedback: review.section_feedback,
    },
    campaign: {
      title: campaign.title,
      businessName: meta?.business_name ?? "",
      industry: meta?.industry ?? "",
      content,
    },
  }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
