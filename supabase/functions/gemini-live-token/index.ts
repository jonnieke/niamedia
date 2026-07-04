import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

type UserContext = {
  businessName?: string
  industry?: string
}

interface RequestBody {
  userContext?: UserContext
}

const LIVE_SYSTEM_PROMPT = `You are Nia, a sharp and warm AI marketing advisor built into Nia Media, based in Nairobi, Kenya.

Your job is to have a natural one-on-one conversation, ask one question at a time, and help the user clarify their business needs before recommending a creative service.

VOICE RULES:
- Keep each turn short and spoken-friendly.
- Use at most 1-2 short sentences unless the user asks for more.
- Ask only one question per response.
- Do not dump long lists or samples early.
- Be warm, specific, and Kenyan-market aware.
- If the user gives a vague answer, ask a clarifying follow-up.

PRODUCT AREAS:
- Campaign Copy: captions, WhatsApp copy, poster copy, ad hooks
- Video Production: commercials, brand films, short-form concepts
- Audio Studio: jingles, voice overs, radio spots

BEHAVIOR:
- Listen for brand context and use it naturally.
- Keep the conversation creative, curious, and purposeful.
- When enough context is available, guide the user toward the right Nia service.`

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const googleKey = Deno.env.get("GOOGLE_API_KEY") ?? Deno.env.get("GEMINI_API_KEY")
    if (!googleKey) {
      return new Response(JSON.stringify({ error: "Gemini Live is not configured. Set GOOGLE_API_KEY in Supabase secrets." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { userContext } = await req.json() as RequestBody

    const systemInstruction = [
      LIVE_SYSTEM_PROMPT,
      userContext?.businessName || userContext?.industry
        ? `\nUSER CONTEXT:\nBusiness: ${userContext.businessName ?? "unknown"}\nIndustry: ${userContext.industry ?? "unknown"}`
        : "",
    ].join("\n")

    const expireTime = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const model = "gemini-live-2.5-flash-preview"

    // Use REST API directly to avoid SDK version issues
    const tokenRes = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/tokens?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            uses: 1,
            expireTime,
            liveConnectConstraints: {
              model,
              config: {
                responseModalities: ["TEXT"],
                systemInstruction: {
                  parts: [{ text: systemInstruction }],
                },
              },
            },
          },
        }),
      }
    )

    const rawText = await tokenRes.text()
    console.log("Token API status:", tokenRes.status, "body:", rawText.slice(0, 500))

    let tokenData: Record<string, unknown>
    try {
      tokenData = JSON.parse(rawText)
    } catch {
      return new Response(JSON.stringify({ error: `Google API returned non-JSON (${tokenRes.status}): ${rawText.slice(0, 200)}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!tokenRes.ok) {
      const msg = (tokenData?.error as Record<string, string>)?.message ?? rawText.slice(0, 200)
      console.error("Token API error:", msg)
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ token: tokenData.name, model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("gemini-live-token error:", message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
