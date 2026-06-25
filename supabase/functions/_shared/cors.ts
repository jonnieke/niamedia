// Shared CORS helper. Allows the production domains plus any origins listed in the
// ALLOWED_ORIGINS env var (comma-separated), and reflects localhost during development.
const DEFAULT_ALLOWED = [
  "https://niamedia.co.ke",
  "https://www.niamedia.co.ke",
]

export function corsHeaders(req: Request): Record<string, string> {
  const envOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
  const allowed = [...DEFAULT_ALLOWED, ...envOrigins]
  const origin = req.headers.get("Origin") ?? ""
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
  const allow = allowed.includes(origin) || isLocal ? origin : DEFAULT_ALLOWED[0]
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  }
}
