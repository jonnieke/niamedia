import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

const corsHeaders = corsHeadersFor(new Request("http://localhost"))

const STEPS = ["business_name", "product_name", "target_audience", "objective", "tone"]
const PROMPTS: Record<string, string> = {
  business_name: "Hi! 👋 I'm Nia, your AI marketing advisor. What's the name of your business?",
  product_name: "Great! What product or service are you promoting right now?",
  target_audience: "Who's your ideal customer? (e.g. young professionals in Nairobi, parents with school-age kids)",
  objective: "What's your goal? (e.g. get sales, drive calls, build awareness, launch a product)",
  tone: "What's your brand voice? (e.g. friendly, professional, bold, warm)",
}
const CONFIRMATIONS: Record<string, string> = {
  business_name: "Got it! Business: *{value}* ✅\n\n{next}",
  product_name: "Perfect! You're promoting: *{value}* ✅\n\n{next}",
  target_audience: "Audience locked in: *{value}* ✅\n\n{next}",
  objective: "Goal: *{value}* ✅\n\n{next}",
  tone: "Tone: *{value}* ✅\n\n✨ Generating your campaign now... this takes about 30 seconds.",
}

function xmlEscape(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function twimlResponse(message: string): Response {
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${xmlEscape(message)}</Message></Response>`
  return new Response(body, {
    headers: { "Content-Type": "text/xml" },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("OK", { headers: corsHeaders })

  let phone = ""
  let message = ""
  let isTwilio = false

  try {
    const contentType = req.headers.get("content-type") ?? ""

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Twilio WhatsApp webhook
      isTwilio = true
      const text = await req.text()
      const params = new URLSearchParams(text)
      const from = params.get("From") ?? ""
      phone = from.replace(/^whatsapp:/, "").replace(/\D/g, "").slice(-9)
      message = (params.get("Body") ?? "").trim()
    } else {
      // JSON format (direct calls)
      const body = await req.json()
      phone = (body.phone ?? "").replace(/\D/g, "").slice(-9)
      message = (body.message ?? "").trim()
    }

    if (!phone || !message) {
      if (isTwilio) return twimlResponse("Sorry, I couldn't process your message. Please try again.")
      return new Response(JSON.stringify({ error: "Missing phone or message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      .eq("phone", phone)
      .maybeSingle()

    if (!session) {
      const { data: newSession } = await supabase
        .from("whatsapp_sessions")
        .insert({ phone, step: "business_name", data: {} })
        .select()
        .single()
      session = newSession
      const reply = PROMPTS.business_name
      if (isTwilio) return twimlResponse(reply)
      return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const currentStep = session.step
    const currentData = session.data || {}

    if (["business_name", "product_name", "target_audience", "objective"].includes(currentStep)) {
      currentData[currentStep] = message
      const nextStep = STEPS[STEPS.indexOf(currentStep) + 1]
      const nextPrompt = nextStep ? PROMPTS[nextStep] : ""
      const confirmation = CONFIRMATIONS[currentStep]
        .replace("{value}", message)
        .replace("{next}", nextPrompt)

      await supabase
        .from("whatsapp_sessions")
        .update({ step: nextStep, data: currentData, updated_at: new Date().toISOString() })
        .eq("id", session.id)

      if (isTwilio) return twimlResponse(confirmation)
      return new Response(JSON.stringify({ reply: confirmation }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (currentStep === "tone") {
      currentData.tone = message
      const formData = {
        business_name: currentData.business_name || "My Business",
        product_name: currentData.product_name || "Product",
        target_audience: currentData.target_audience || "Everyone",
        objective: currentData.objective || "Boost sales",
        tone: currentData.tone || "Professional",
        platforms: ["whatsapp", "instagram"],
        language: "sw",
      }

      const confirmation = CONFIRMATIONS.tone.replace("{value}", message).replace("{next}", "")
      if (isTwilio) {
        // For Twilio: send confirmation immediately, then generate async
        supabase.functions.invoke("generate-campaign", {
          body: { ...formData, _whatsapp_phone: phone },
        }).then(async ({ data, error }) => {
          if (error || data?.error) return
          const content = data ?? {}
          const waMsg = (content.whatsapp?.broadcast ?? content.whatsapp?.status ?? "Your campaign is ready!")
          const reply =
            `✨ *Your Campaign is Ready!*\n\n` +
            `📱 *WhatsApp Message:*\n${waMsg}\n\n` +
            `🎨 *Poster Headline:*\n${content.posterCopy?.headline ?? ""}\n\n` +
            `⭐ Rate your experience & tell us what marketing tools you need next: https://niamedia.co.ke/survey\n\n` +
            `Reply *START* to create another campaign.`
          // Can't send proactively via TwiML — store for next interaction or use Twilio API
          await supabase.from("whatsapp_sessions")
            .upsert({ phone, step: "done", data: { ...currentData, result: reply }, updated_at: new Date().toISOString() }, { onConflict: "phone" })
        })
        await supabase.from("whatsapp_sessions").update({ step: "generating", data: currentData, updated_at: new Date().toISOString() }).eq("id", session.id)
        return twimlResponse(confirmation)
      }

      // JSON mode: generate synchronously
      const campRes = await supabase.functions.invoke("generate-campaign", {
        body: { ...formData, _whatsapp_phone: phone },
      })
      await supabase.from("whatsapp_sessions").delete().eq("id", session.id)

      if (campRes.error || campRes.data?.error) {
        const errReply = "Oops! Something went wrong generating your campaign. Please reply *START* to try again."
        return new Response(JSON.stringify({ reply: errReply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }

      const content = campRes.data ?? {}
      const waMsg = content.whatsapp?.broadcast ?? content.whatsapp?.status ?? "Check out our latest offer!"
      const reply =
        `✨ *Your Campaign is Ready!*\n\n` +
        `📱 *WhatsApp Message:*\n${waMsg}\n\n` +
        `🎨 *Poster Headline:*\n${content.posterCopy?.headline ?? ""}\n\n` +
        `⭐ Rate your experience & tell us what marketing tools you need next: https://niamedia.co.ke/survey\n\n` +
        `Reply *START* to create another campaign, or visit niamedia.co.ke to unlock the full kit.`

      return new Response(JSON.stringify({ reply, campaignData: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Session in "generating" or "done" state — check result
    if (currentStep === "done" || currentStep === "generating") {
      const result = currentData.result as string | undefined
      if (result) {
        await supabase.from("whatsapp_sessions").delete().eq("id", session.id)
        if (isTwilio) return twimlResponse(result)
        return new Response(JSON.stringify({ reply: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
      }
      const waiting = "⏳ Still generating your campaign... please check back in a moment."
      if (isTwilio) return twimlResponse(waiting)
      return new Response(JSON.stringify({ reply: waiting }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // Restart if they say START
    if (message.toLowerCase() === "start" || message.toLowerCase() === "/start") {
      await supabase.from("whatsapp_sessions").delete().eq("id", session.id)
      const reply = `🔄 Starting fresh!\n\n${PROMPTS.business_name}`
      if (isTwilio) return twimlResponse(reply)
      return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const reply = PROMPTS[currentStep] ?? "Please reply *START* to begin."
    if (isTwilio) return twimlResponse(reply)
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (e) {
    console.error("[whatsapp-brief-bot]", e)
    if (isTwilio) return twimlResponse("Sorry, something went wrong. Please try again.")
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
