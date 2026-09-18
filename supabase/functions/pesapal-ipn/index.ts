import { createClient } from "npm:@supabase/supabase-js@2"
import { notifyAdmins } from "../_shared/notify.ts"

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
    } else if (orderMerchantReference.startsWith("inv_")) {
      // Invoice payment
      const invoiceId = orderMerchantReference.replace("inv_", "")
      await supabase.from("invoices").update({
        status: paymentStatus === "paid" ? "paid" : "sent",
        ...(paymentStatus === "paid" ? { paid_at: new Date().toISOString(), mpesa_ref: orderTrackingId } : {}),
      }).eq("id", invoiceId)

      if (paymentStatus === "paid") {
        const { data: inv } = await supabase.from("invoices")
          .select("user_id, invoice_number, total, client_name").eq("id", invoiceId).single()
        if (inv) {
          void supabase.from("notifications").insert({
            user_id: inv.user_id,
            title: "Invoice paid!",
            body: `${inv.client_name} paid invoice #${inv.invoice_number} — KES ${inv.total.toLocaleString()}`,
            type: "success",
            action_url: "/invoices",
          })
        }
      }
    } else if (orderMerchantReference.startsWith("prop_")) {
      // Proposal deposit
      const proposalId = orderMerchantReference.replace("prop_", "")
      if (paymentStatus === "paid") {
        await supabase.from("proposals").update({
          status: "paid",
          paid_at: new Date().toISOString(),
          pesapal_order_id: orderTrackingId,
        }).eq("id", proposalId)

        const { data: prop } = await supabase.from("proposals")
          .select("email, contact_name, business_name, deposit_amount, timeline_days, video_length")
          .eq("id", proposalId).single()

        void notifyAdmins(
          "success",
          `Deposit received — ${prop?.business_name ?? "Client"}`,
          `KES ${prop?.deposit_amount?.toLocaleString("en-KE") ?? "—"} deposit paid. Production can start.`,
          "/proposals",
        )

        if (prop?.email) {
          void supabase.functions.invoke("send-client-email", {
            body: {
              type: "deposit_confirmed",
              to: prop.email,
              name: prop.contact_name,
              businessName: prop.business_name,
              depositAmount: prop.deposit_amount,
              timelineDays: prop.timeline_days,
              videoLength: prop.video_length,
            },
          })
        }
      }
    } else if (orderMerchantReference.startsWith("proj_")) {
      // Project final balance payment
      const projectId = orderMerchantReference.replace("proj_", "")
      if (paymentStatus === "paid") {
        await supabase.from("projects").update({
          balance_paid_at: new Date().toISOString(),
          pesapal_order_id: orderTrackingId,
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", projectId)

        const { data: proj } = await supabase.from("projects")
          .select("email, contact_name, business_name, balance_due")
          .eq("id", projectId).single()

        void notifyAdmins(
          "success",
          `Final payment received — ${proj?.business_name ?? "Client"}`,
          `KES ${proj?.balance_due?.toLocaleString("en-KE") ?? "—"} balance paid. Project is fully settled.`,
          "/production",
        )

        if (proj?.email) {
          void supabase.functions.invoke("send-client-email", {
            body: {
              type: "balance_paid_admin",
              to: "hello@niamedia.co.ke",
              businessName: proj.business_name,
              balanceDue: proj.balance_due,
            },
          })
        }
      }
    } else if (orderMerchantReference.startsWith("quote_")) {
      // Instant 70% deposit on online quote
      const quoteId = orderMerchantReference.replace("quote_", "")
      if (paymentStatus === "paid") {
        await supabase.from("quote_requests").update({
          status: "converted",
        }).eq("id", quoteId)

        const { data: q } = await supabase.from("quote_requests")
          .select("id, contact_name, business_name, email, phone, video_length, price_max")
          .eq("id", quoteId).maybeSingle()

        const depAmount = Math.round((q?.price_max || 8000) * 0.7)

        void notifyAdmins(
          "success",
          `🎉 70% Deposit Received — ${q?.business_name ?? "Client"}`,
          `KES ${depAmount.toLocaleString("en-KE")} 70% deposit paid via PesaPal for ${q?.video_length ?? "video"} commercial. Ready to start production!`,
          "/admin",
        )

        if (q?.email) {
          void supabase.functions.invoke("send-client-email", {
            body: {
              type: "deposit_confirmed",
              to: q.email,
              name: q.contact_name,
              businessName: q.business_name,
              depositAmount: depAmount,
              timelineDays: 5,
              videoLength: q.video_length,
            },
          })
        }
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
