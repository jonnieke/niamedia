import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const { userId, title, body, url, tag } = await req.json().catch(() => ({}))
  if (!userId || !title || !body) {
    return new Response(JSON.stringify({ error: "userId, title, body required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY")
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")
  const vapidEmail = Deno.env.get("VAPID_EMAIL") ?? "mailto:support@niamedia.co.ke"

  if (!vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ skipped: true, reason: "VAPID keys not configured" }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (!subs?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const payload = JSON.stringify({ title, body, url: url ?? "/leads", tag: tag ?? "lead-notification" })
  let sent = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 86400 },
      )
      sent++
    } catch (err: unknown) {
      // Remove expired/invalid subscriptions
      if (err instanceof Error && (err.message.includes("410") || err.message.includes("404"))) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint)
      }
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { ...cors, "Content-Type": "application/json" },
  })
})
