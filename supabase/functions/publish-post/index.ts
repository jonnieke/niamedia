import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

// Publish a scheduled_post to Facebook or Instagram via Graph API.
// Called by schedule-posts (cron) or directly by the frontend for immediate publish.

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const db = createClient(supabaseUrl, supabaseKey)

    const body = await req.json() as { postId?: string }
    if (!body.postId) return new Response(JSON.stringify({ error: "postId required" }), { status: 400, headers: corsHeaders })

    // Fetch the scheduled post
    const { data: post, error: postErr } = await db
      .from("scheduled_posts")
      .select("*, social_connections(*)")
      .eq("id", body.postId)
      .single()

    if (postErr || !post) return new Response(JSON.stringify({ error: "Post not found" }), { status: 404, headers: corsHeaders })
    if (post.status === "published") return new Response(JSON.stringify({ error: "Already published" }), { status: 400, headers: corsHeaders })

    // Mark as publishing
    await db.from("scheduled_posts").update({ status: "publishing" }).eq("id", post.id)

    const conn = post.social_connections
    if (!conn) {
      await db.from("scheduled_posts").update({ status: "failed", error_message: "Social connection not found" }).eq("id", post.id)
      return new Response(JSON.stringify({ error: "Social connection not found" }), { status: 400, headers: corsHeaders })
    }

    const token: string = conn.access_token
    let postId: string | null = null
    let errorMsg: string | null = null

    if (post.platform === "facebook") {
      // Post to Facebook Page feed
      const fbBody: Record<string, string> = { message: post.content, access_token: token }
      if (post.media_url) fbBody.link = post.media_url

      const fbRes = await fetch(`https://graph.facebook.com/v19.0/${conn.page_id}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fbBody),
      })
      const fbData = await fbRes.json()
      if (fbRes.ok && fbData.id) postId = fbData.id
      else errorMsg = fbData.error?.message ?? "Facebook post failed"

    } else if (post.platform === "instagram") {
      // Instagram requires an image URL; text-only is not supported
      if (!post.media_url) {
        errorMsg = "Instagram requires an image URL. Add a media_url to publish."
      } else {
        const igId = conn.instagram_account_id ?? conn.page_id
        // Step 1: Create media container
        const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_url: post.media_url, caption: post.content, access_token: token }),
        })
        const containerData = await containerRes.json()
        if (!containerRes.ok || !containerData.id) {
          errorMsg = containerData.error?.message ?? "Failed to create Instagram media container"
        } else {
          // Step 2: Publish the container
          const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creation_id: containerData.id, access_token: token }),
          })
          const publishData = await publishRes.json()
          if (publishRes.ok && publishData.id) postId = publishData.id
          else errorMsg = publishData.error?.message ?? "Instagram publish failed"
        }
      }
    }

    if (postId) {
      await db.from("scheduled_posts").update({ status: "published", post_id: postId, error_message: null }).eq("id", post.id)
      // Update calendar item status to "posted"
      if (post.calendar_item_id) {
        await db.from("content_calendar").update({ status: "posted" }).eq("id", post.calendar_item_id)
      }
      return new Response(JSON.stringify({ success: true, postId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    } else {
      await db.from("scheduled_posts").update({ status: "failed", error_message: errorMsg }).eq("id", post.id)
      return new Response(JSON.stringify({ error: errorMsg }), { status: 422, headers: corsHeaders })
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
