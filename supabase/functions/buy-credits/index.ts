import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://niamedia.co.ke",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const PACKAGES: Record<string, { credits: number; amountKes: number; label: string }> = {
  "1":  { credits: 1,  amountKes: 500,  label: "1 Campaign Credit" },
  "5":  { credits: 5,  amountKes: 2000, label: "5 Campaign Credits" },
  "12": { credits: 12, amountKes: 4000, label: "12 Campaign Credits" },
}

const BASE_URL = Deno.env.get("PESAPAL_ENV") === "production"
  ? "https://pay.pesapal.com/v3"
  : "https://cybqa.pesapal.com/pesapalv3"

async function getPesapalToken(): Promise<string> {
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
  const cached = Deno.env.get("PESAPAL_IPN_ID")
  if (cached) return cached
  const ipnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/pesapal-ipn`
  const res = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "GET" }),
  })
  const data = await res.json()
  return data.ipn_id as string
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const authHeader = req.headers.get("Authorization") ?? ""
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { pkg, callbackUrl, email, phone, firstName, lastName } = await req.json() as {
      pkg: string; callbackUrl: string; email?: string; phone?: string; firstName?: string; lastName?: string
    }

    const pack = PACKAGES[pkg]
    if (!pack) {
      return new Response(JSON.stringify({ error: "Invalid package" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Prefix order ID so pesapal-ipn can route it correctly
    const orderId = `cred_${crypto.randomUUID()}`

    // Create pending transaction record
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: pack.credits,
      description: `Purchased ${pack.label}`,
      order_id: orderId,
      payment_status: "pending",
    })

    // Initiate PesaPal checkout
    const token = await getPesapalToken()
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
        amount: pack.amountKes,
        description: pack.label,
        callback_url: callbackUrl,
        notification_id: ipnId,
        billing_address: {
          email_address: email ?? user.email ?? "",
          phone_number: phone ?? "",
          first_name: firstName ?? "",
          last_name: lastName ?? "",
          country_code: "KE",
        },
      }),
    })

    const orderData = await orderRes.json()
    if (!orderData.redirect_url) throw new Error(`PesaPal order failed: ${JSON.stringify(orderData)}`)

    // Store tracking ID
    await supabase.from("credit_transactions")
      .update({ order_tracking_id: orderData.order_tracking_id })
      .eq("order_id", orderId)

    return new Response(JSON.stringify({ redirectUrl: orderData.redirect_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
