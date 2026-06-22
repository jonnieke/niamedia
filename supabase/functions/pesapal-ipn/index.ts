import { createClient } from "npm:@supabase/supabase-js@2"

const BASE_URL = Deno.env.get("PESAPAL_ENV") === "production"
  ? "https://pay.pesapal.com/v3"
  : "https://cybqa.pesapal.com/pesapalv3"

const FROM_EMAIL = "Nia Media <hello@niamedia.co.ke>"
const APP_URL = Deno.env.get("APP_URL") ?? "https://niamedia.co.ke"

async function sendReferralRewardEmail(to: string, name: string): Promise<void> {
  const RESEND_KEY = Deno.env.get("RESEND_API_KEY")
  if (!RESEND_KEY) return
  const firstName = (name || "there").split(" ")[0]
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e">
  <div style="max-width:600px;margin:32px auto;padding:0 16px">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
      <div style="background:linear-gradient(135deg,#065f46,#047857);padding:36px 40px;text-align:center">
        <div style="font-size:18px;font-weight:800;color:#6ee7b7;margin-bottom:12px">Nia Media</div>
        <h1 style="font-size:24px;font-weight:800;color:#fff;line-height:1.3;margin:0">Your referral just paid off! 🎉</h1>
      </div>
      <div style="padding:36px 40px">
        <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 16px">
          Great news, ${firstName} — someone you referred just subscribed to Nia Media.
        </p>
        <p style="font-size:15px;color:#333;line-height:1.7;margin:0 0 24px">
          <strong>1 free campaign credit</strong> has been added to your account. Keep sharing your link to earn more.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/referral" style="display:inline-block;padding:14px 36px;border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#3b82f6);color:#fff;font-weight:700;font-size:15px;text-decoration:none">View My Referrals →</a>
        </div>
      </div>
      <div style="text-align:center;padding:20px 40px;border-top:1px solid #f0f0f5">
        <p style="font-size:12px;color:#999;line-height:1.7;margin:0">© ${new Date().getFullYear()} Nia Media · <a href="${APP_URL}/settings" style="color:#8b5cf6;text-decoration:none">Manage email preferences</a></p>
      </div>
    </div>
  </div>
</body></html>`
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject: "Your referral just paid off — 1 free credit added", html }),
    })
  } catch (_e) { /* non-fatal */ }
}

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

            // Referral reward: if this buyer was referred, activate and credit the referrer
            const { data: referral } = await supabase
              .from("referrals")
              .select("id, referrer_id")
              .eq("referred_user_id", txn.user_id)
              .eq("status", "pending")
              .maybeSingle()

            if (referral) {
              await supabase
                .from("referrals")
                .update({ status: "active", credit_kes: 500 })
                .eq("id", referral.id)

              await supabase.rpc("add_credits", {
                p_user_id: referral.referrer_id,
                p_amount: 1,
                p_description: "Referral reward",
                p_order_id: `ref_${referral.id}`,
              })

              void supabase.from("notifications").insert({
                user_id: referral.referrer_id,
                title: "Referral reward!",
                body: "Someone you referred just subscribed. 1 free credit added to your account.",
                type: "success",
                action_url: "/referral",
              })

              // Email the referrer (respect marketing opt-out)
              const { data: referrer } = await supabase
                .from("profiles")
                .select("email, name, email_marketing_opt_out")
                .eq("id", referral.referrer_id)
                .single()
              if (referrer?.email && !referrer.email_marketing_opt_out) {
                await sendReferralRewardEmail(referrer.email, referrer.name ?? "")
              }
            }
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
