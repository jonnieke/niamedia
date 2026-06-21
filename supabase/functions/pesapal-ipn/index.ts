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

    const description = (statusData.payment_status_description as string) ?? "Unknown"
    const paymentStatus = description === "Completed" ? "paid"
      : description === "Failed" ? "failed"
      : description === "Reversed" ? "reversed"
      : "pending"

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    // Route by order ID prefix: credit purchases start with "cred_"
    if (orderMerchantReference.startsWith("cred_")) {
      if (paymentStatus === "paid") {
        // Look up the pending transaction to get user_id and credit amount
        const { data: txn } = await supabase
          .from("credit_transactions")
          .select("user_id, amount")
          .eq("order_id", orderMerchantReference)
          .single()

        if (txn) {
          // Idempotency: only add credits if this order isn't already marked paid
          const { data: alreadyPaid } = await supabase
            .from("credit_transactions")
            .select("id")
            .eq("order_id", orderMerchantReference)
            .eq("payment_status", "paid")
            .maybeSingle()

          if (!alreadyPaid) {
            await supabase.rpc("add_credits", {
              p_user_id: txn.user_id,
              p_amount: txn.amount,
              p_description: `Credits purchased`,
              p_order_id: orderMerchantReference,
            })

            await supabase
              .from("credit_transactions")
              .update({ payment_status: "paid", order_tracking_id: orderTrackingId })
              .eq("order_id", orderMerchantReference)

            void supabase.from("notifications").insert({
              user_id: txn.user_id,
              title: "Credits added!",
              body: `${txn.amount} campaign credit${txn.amount !== 1 ? "s" : ""} have been added to your account.`,
              type: "success",
              action_url: "/new-campaign",
            })
          }
        }
      } else {
        await supabase.from("credit_transactions")
          .update({ payment_status: paymentStatus, order_tracking_id: orderTrackingId })
          .eq("order_id", orderMerchantReference)
      }
    } else {
      // Audio order — existing logic
      await supabase.from("audio_orders")
        .update({
          payment_status: paymentStatus,
          order_tracking_id: orderTrackingId,
          ...(paymentStatus === "paid" ? { status: "queued" } : {}),
        })
        .eq("id", orderMerchantReference)

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
    }

    return new Response("OK", { headers: { "Content-Type": "text/plain" } })
  } catch (err: unknown) {
    console.error("IPN error:", String(err))
    return new Response("OK", { headers: { "Content-Type": "text/plain" } })
  }
})
