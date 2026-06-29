import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { token, reviewerName, reviewerEmail, status, overallComment, sectionFeedback } =
    await req.json().catch(() => ({}))

  if (!token || !status || !["approved", "changes_requested"].includes(status)) {
    return new Response(JSON.stringify({ error: "token and valid status required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: review, error: findErr } = await supabase
    .from("campaign_reviews")
    .select("id, campaign_id, user_id")
    .eq("review_token", token)
    .maybeSingle()

  if (findErr || !review) {
    return new Response(JSON.stringify({ error: "Review not found" }), {
      status: 404, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { error: updateErr } = await supabase
    .from("campaign_reviews")
    .update({
      reviewer_name: reviewerName?.trim() ?? "",
      reviewer_email: reviewerEmail?.trim() ?? "",
      status,
      overall_comment: overallComment?.trim() ?? "",
      section_feedback: sectionFeedback ?? {},
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", review.id)

  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  // Notify the campaign owner via in-app notification (insert into a notifications-style update on campaigns)
  const emoji = status === "approved" ? "✅" : "🔄"
  const label = status === "approved" ? "approved" : "requested changes on"
  const noteName = reviewerName?.trim() || "Your reviewer"
  await supabase.from("campaign_reviews").update({
    overall_comment: overallComment?.trim() ?? "",
  }).eq("id", review.id)

  // Update the campaign's review_status in metadata for quick dashboard display
  const { data: camp } = await supabase.from("campaigns").select("metadata").eq("id", review.campaign_id).maybeSingle()
  if (camp) {
    const meta = (camp.metadata as Record<string, unknown>) ?? {}
    await supabase.from("campaigns").update({
      metadata: { ...meta, review_status: status, review_note: `${emoji} ${noteName} ${label} this campaign` },
    }).eq("id", review.campaign_id)
  }

  return new Response(JSON.stringify({ success: true, status }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
