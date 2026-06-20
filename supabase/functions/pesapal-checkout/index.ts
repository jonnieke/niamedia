import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const BASE_URL = Deno.env.get("PESAPAL_ENV") === "production"
  ? "https://pay.pesapal.com/v3"
  : "https://cybqa.pesapal.com/pesapalv3"

async function getToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: Deno.env.get("PESAPAL_CONSUMER_KEY"),
      consumer_secret: Deno.env.get("PESAPAL_CONSUMER_SECRET"),
    }),
  })
  const data = await res.json()
  if (!data.token) throw new Error(`PesaPal auth failed: ${JSON.stringify(data)}`)
  return data.token as string
}

async function getOrRegisterIpn(token: string): Promise<string> {
  // Use cached IPN ID if set, otherwise register a new one
  const cached = Deno.env.get("PESAPAL_IPN_ID")
  if (cached) return cached

  const ipnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/pesapal-ipn`
  const res = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "GET" }),
  })
  const data = await res.json()
  return data.ipn_id as string
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const key = Deno.env.get("PESAPAL_CONSUMER_KEY")
  const secret = Deno.env.get("PESAPAL_CONSUMER_SECRET")
  if (!key || !secret) {
    return new Response(JSON.stringify({ error: "PesaPal not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const { orderId, amountKes, description, callbackUrl, email, phone, firstName, lastName } = await req.json()

    const token = await getToken()
    const ipnId = await getOrRegisterIpn(token)

    const orderRes = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: orderId,
        currency: "KES",
        amount: amountKes,
        description,
        callback_url: callbackUrl,
        notification_id: ipnId,
        billing_address: {
          email_address: email ?? "",
          phone_number: phone ?? "",
          first_name: firstName ?? "",
          last_name: lastName ?? "",
          country_code: "KE",
        },
      }),
    })

    const orderData = await orderRes.json()
    if (!orderData.redirect_url) throw new Error(`Order submit failed: ${JSON.stringify(orderData)}`)

    // Persist tracking ID so the callback page can query it
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )
    await supabase.from("audio_orders")
      .update({ order_tracking_id: orderData.order_tracking_id, payment_status: "awaiting_payment" })
      .eq("id", orderId)

    return new Response(
      JSON.stringify({ redirectUrl: orderData.redirect_url, orderTrackingId: orderData.order_tracking_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
