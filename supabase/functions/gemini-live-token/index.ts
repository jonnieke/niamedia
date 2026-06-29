import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"
import { GoogleGenAI } from "npm:@google/genai"

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
      return new Response(JSON.stringify({ error: "Gemini Live is not configured" }), {
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

    const ai = new GoogleGenAI({ apiKey: googleKey, httpOptions: { apiVersion: "v1alpha" } })

    const expireTime = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const token = await ai.tokens.create({
      config: {
        uses: 1,
        expireTime,
        liveConnectConstraints: {
          model: "gemini-live-2.5-flash-preview",
          config: {
            responseModalities: ["TEXT"],
            systemInstruction,
          },
        },
        lockAdditionalFields: [],
      },
    })

    return new Response(JSON.stringify({ token: token.name, model: "gemini-live-2.5-flash-preview" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
