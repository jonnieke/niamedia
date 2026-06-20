import { createClient } from "npm:@supabase/supabase-js@2"

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
  return data.token as string
}

Deno.serve(async (req) => {
  // PesaPal sends a GET with query params
  const url = new URL(req.url)
  const orderTrackingId = url.searchParams.get("OrderTrackingId")
  const orderMerchantReference = url.searchParams.get("OrderMerchantReference")

  if (!orderTrackingId || !orderMerchantReference) {
    return new Response("Missing params", { status: 400 })
  }

  try {
    const token = await getToken()
    const statusRes = await fetch(
      `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    )
    const statusData = await statusRes.json()

    // payment_status_description values: "Completed", "Failed", "Invalid", "Reversed"
    const description = (statusData.payment_status_description as string) ?? "Unknown"
    const paymentStatus = description === "Completed" ? "paid"
      : description === "Failed" ? "failed"
      : description === "Reversed" ? "reversed"
      : "pending"

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    await supabase.from("audio_orders")
      .update({
        payment_status: paymentStatus,
        order_tracking_id: orderTrackingId,
        ...(paymentStatus === "paid" ? { status: "queued" } : {}),
      })
      .eq("id", orderMerchantReference)

    // If paid, fire notify-admin
    if (paymentStatus === "paid") {
      const { data: order } = await supabase
        .from("audio_orders")
        .select("title, price_kes, user_id")
        .eq("id", orderMerchantReference)
        .single()

      void supabase.functions.invoke("notify-admin", {
        body: {
          type: "new_order",
          orderId: orderMerchantReference,
          title: order?.title,
          priceKes: order?.price_kes,
          userId: order?.user_id,
        },
      })
    }

    // PesaPal requires "OK" as the response body
    return new Response("OK", { headers: { "Content-Type": "text/plain" } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("IPN error:", message)
    // Still return OK so PesaPal stops retrying (we'll reconcile manually)
    return new Response("OK", { headers: { "Content-Type": "text/plain" } })
  }
})
