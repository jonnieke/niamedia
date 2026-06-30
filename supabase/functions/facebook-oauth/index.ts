import { createClient } from "npm:@supabase/supabase-js@2"

// Facebook OAuth flow for Social Publisher.
// GET /facebook-oauth              → redirects user to FB OAuth dialog
// GET /facebook-oauth?code=...&state=... → exchanges code for token, stores, redirects to app

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state") // user_id
  const error = url.searchParams.get("error")

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const metaAppId = Deno.env.get("META_APP_ID") ?? ""
  const metaAppSecret = Deno.env.get("META_APP_SECRET") ?? ""
  const appUrl = Deno.env.get("APP_URL") ?? "https://niamedia.co.ke"

  const callbackUrl = `${supabaseUrl}/functions/v1/facebook-oauth`

  // ── OAuth error callback ──────────────────────────────────────
  if (error) {
    return Response.redirect(`${appUrl}/settings?tab=integrations&fb_error=${encodeURIComponent(error)}`, 302)
  }

  // ── OAuth callback — exchange code for token ──────────────────
  if (code && state) {
    try {
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaAppId}&client_secret=${metaAppSecret}&redirect_uri=${encodeURIComponent(callbackUrl)}&code=${code}`
      )
      const tokenData = await tokenRes.json()
      if (!tokenRes.ok || !tokenData.access_token) throw new Error(tokenData.error?.message ?? "Token exchange failed")

      const userToken: string = tokenData.access_token

      // Get long-lived user token
      const llRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${userToken}`
      )
      const llData = await llRes.json()
      const longToken: string = llData.access_token ?? userToken

      // Get user's pages
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}&fields=id,name,access_token,instagram_business_account`
      )
      const pagesData = await pagesRes.json()
      const pages: Array<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string } }> = pagesData.data ?? []

      if (!pages.length) {
        return Response.redirect(`${appUrl}/settings?tab=integrations&fb_error=no_pages`, 302)
      }

      const db = createClient(supabaseUrl, supabaseKey)

      // Get token expiry (60 days for long-lived)
      const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

      // Store each page + its linked Instagram account
      for (const page of pages) {
        await db.from("social_connections").upsert({
          user_id: state,
          platform: "facebook",
          page_id: page.id,
          page_name: page.name,
          access_token: page.access_token,
          instagram_account_id: page.instagram_business_account?.id ?? null,
          expires_at: expiresAt,
        }, { onConflict: "user_id,platform,page_id" })

        // Also store Instagram as a separate entry if linked
        if (page.instagram_business_account?.id) {
          await db.from("social_connections").upsert({
            user_id: state,
            platform: "instagram",
            page_id: page.instagram_business_account.id,
            page_name: `${page.name} (Instagram)`,
            instagram_account_id: page.instagram_business_account.id,
            access_token: page.access_token,
            expires_at: expiresAt,
          }, { onConflict: "user_id,platform,page_id" })
        }
      }

      return Response.redirect(`${appUrl}/settings?tab=integrations&fb_connected=1`, 302)
    } catch (e) {
      return Response.redirect(`${appUrl}/settings?tab=integrations&fb_error=${encodeURIComponent(String(e))}`, 302)
    }
  }

  // ── Initial redirect — start OAuth flow ───────────────────────
  const userId = url.searchParams.get("user_id") ?? ""
  if (!metaAppId) {
    return new Response("META_APP_ID not configured", { status: 500 })
  }

  const scope = "pages_manage_posts,pages_read_engagement,instagram_content_publish,instagram_basic"
  const fbAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scope}&state=${userId}&response_type=code`

  return Response.redirect(fbAuthUrl, 302)
})
