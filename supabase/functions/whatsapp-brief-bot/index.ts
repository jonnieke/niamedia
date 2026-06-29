import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeadersFor } from "../_shared/cors.ts"

const corsHeaders = corsHeadersFor(new Request("http://localhost"))

const STEPS = ["business_name", "product_name", "target_audience", "objective", "tone"]
const PROMPTS: Record<string, string> = {
  business_name: "Hi! 👋 What's the name of your business?",
  product_name: "Great! What product or service are you promoting?",
  target_audience: "Who's your ideal customer?",
  objective: "What's your goal? (e.g. get sales, build awareness, drive calls)",
  tone: "What's your brand voice? (e.g. friendly, professional, bold)",
}
const CONFIRMATIONS: Record<string, string> = {
  business_name: "Got it! Business: {value}\n\n{next}",
  product_name: "Perfect! You're promoting {value}\n\n{next}",
  target_audience: "Your audience: {value}\n\n{next}",
  objective: "Goal: {value}\n\n{next}",
  tone: "Tone: {value}\n\n✨ Generating your campaign...",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("OK", { headers: corsHeaders })

  try {
    const body = await req.json()
    const incomingPhone = body.phone?.replace(/\D/g, "").slice(-9) // Extract last 9 digits (Kenya format)
    const message = (body.message || "").trim()

    if (!incomingPhone || !message) {
      return new Response(JSON.stringify({ error: "Missing phone or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // Load or create session
    let { data: session } = await supabase
      .from("whatsapp_sessions")
      .select("*")
      .eq("phone", incomingPhone)
      .maybeSingle()

    if (!session) {
      // New session — start with business_name
      const { data: newSession } = await supabase
        .from("whatsapp_sessions")
        .insert({ phone: incomingPhone, step: "business_name", data: {} })
        .select()
        .single()
      session = newSession
    }

    const currentStep = session.step
    const currentData = session.data || {}

    // Handle current step input
    if (["business_name", "product_name", "target_audience", "objective"].includes(currentStep)) {
      currentData[currentStep] = message
      const nextStep = STEPS[STEPS.indexOf(currentStep) + 1]
      const nextPrompt = nextStep ? PROMPTS[nextStep] : ""
      const confirmation = CONFIRMATIONS[currentStep]
        .replace("{value}", message)
        .replace("{next}", nextStep ? `\n${nextPrompt}` : "")

      await supabase
        .from("whatsapp_sessions")
        .update({ step: nextStep, data: currentData, updated_at: new Date().toISOString() })
        .eq("id", session.id)

      return new Response(JSON.stringify({ reply: confirmation }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } else if (currentStep === "tone") {
      currentData.tone = message
      // Brief complete — generate campaign
      const formData = {
        business_name: currentData.business_name || "My Business",
        product_name: currentData.product_name || "Product",
        target_audience: currentData.target_audience || "Everyone",
        objective: currentData.objective || "Boost sales",
        tone: currentData.tone || "Professional",
        platforms: ["whatsapp", "instagram"],
        language: "sw",
      }

      // Generate campaign (unauthenticated, free tier)
      const campRes = await supabase.functions.invoke("generate-campaign", {
        body: { ...formData, _whatsapp_phone: incomingPhone },
      })

      if (campRes.error || campRes.data?.error) {
        return new Response(
          JSON.stringify({
            reply: "Oops! Something went wrong. Try again: /start",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }

      const content = campRes.data?.content || {}
      const campaign = {
        whatsappMessage: content.whatsappMessage || "Check out our latest offer!",
        posterCopy: content.posterCopy || "Your campaign is ready.",
      }

      // Clear session
      await supabase.from("whatsapp_sessions").delete().eq("id", session.id)

      const reply =
        `✨ *Your Campaign is Ready!*\n\n` +
        `📱 *WhatsApp Message:*\n${campaign.whatsappMessage}\n\n` +
        `🎨 *Poster Copy:*\n${campaign.posterCopy}\n\n` +
        `Ready to use! Reply /more for variations or /start for another campaign.`

      return new Response(JSON.stringify({ reply, campaignData: content }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ reply: PROMPTS[currentStep] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
