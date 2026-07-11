import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2"

// Cost-control guard shared by every AI-calling edge function. Two jobs:
// 1. requireUser — reject calls with no valid Supabase session (401).
// 2. checkRateLimit — cap calls per key (user id or IP) per day, reusing
//    the existing demo_rate_limits table (service-role only, no RLS).
//
// Added after an unauthenticated, unrate-limited chat-agent function (and
// eight others) let anyone burn the Anthropic budget with a raw fetch —
// no login, no cap, no cost to the caller.

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )
}

export async function requireUser(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get("Authorization") ?? ""
  const token = authHeader.replace("Bearer ", "")
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  return user ?? null
}

export function unauthorized(cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: "unauthorized", message: "Please sign in to use this feature." }), {
    status: 401,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

/** Returns true if the call is allowed, false if the key is over its daily limit. */
export async function checkRateLimit(supabase: SupabaseClient, key: string, limit: number): Promise<boolean> {
  const dayKey = new Date().toISOString().slice(0, 10)
  const fullKey = `${key}:${dayKey}`

  const { data: existing } = await supabase
    .from("demo_rate_limits")
    .select("count")
    .eq("key", fullKey)
    .maybeSingle()

  const count = (existing?.count ?? 0) as number
  if (count >= limit) return false

  await supabase.from("demo_rate_limits").upsert(
    { key: fullKey, count: count + 1, last_used: new Date().toISOString() },
    { onConflict: "key" },
  )
  return true
}

export function rateLimited(cors: Record<string, string>, message = "You've reached today's usage limit. Please try again tomorrow.") {
  return new Response(JSON.stringify({ error: "rate_limited", message }), {
    status: 429,
    headers: { ...cors, "Content-Type": "application/json" },
  })
}

export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("cf-connecting-ip")
    ?? "unknown"
}
