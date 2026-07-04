import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    const { phone, amount, invoiceId, reference } = await req.json()

    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")!
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")!
    const shortCode = Deno.env.get("MPESA_BUSINESS_SHORT_CODE") ?? "174379"
    const passkey = Deno.env.get("MPESA_PASSKEY")!
    const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL") ?? `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`

    // 1. Get OAuth token
    const authRes = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          "Authorization": "Basic " + btoa(`${consumerKey}:${consumerSecret}`),
        },
      }
    )
    const { access_token } = await authRes.json()

    // 2. Generate password
    const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
    const password = btoa(`${shortCode}${passkey}${timestamp}`)

    // 3. Normalize phone (must start with 254)
    const normalizedPhone = String(phone).replace(/^0/, "254").replace(/^\+/, "")

    // 4. STK Push
    const stkRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(amount),
          PartyA: normalizedPhone,
          PartyB: shortCode,
          PhoneNumber: normalizedPhone,
          CallBackURL: callbackUrl,
          AccountReference: reference ?? invoiceId ?? "Nia Media",
          TransactionDesc: `Invoice ${reference ?? invoiceId}`,
        }),
      }
    )

    const data = await stkRes.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("mpesa-payment error:", err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
