import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

export async function notifyAdmins(
  type: "info" | "success" | "action" | "warning",
  title: string,
  body: string,
  actionUrl?: string,
) {
  try {
    const sb = createClient(supabaseUrl, serviceKey)
    await sb.rpc("notify_admins", {
      p_type: type,
      p_title: title,
      p_body: body,
      p_action_url: actionUrl ?? null,
    })
  } catch (e) {
    console.error("notifyAdmins failed:", e)
  }
}
