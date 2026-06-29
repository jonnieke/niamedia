import Anthropic from "npm:@anthropic-ai/sdk"
import { createClient } from "npm:@supabase/supabase-js@2"
import { corsHeaders as corsHeadersFor } from "../_shared/cors.ts"

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req)
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  // Verify user from JWT
  const { data: { user }, error: authErr } = await createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  ).auth.getUser()

  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  const { storage_path } = await req.json().catch(() => ({}))
  if (!storage_path || typeof storage_path !== "string") {
    return new Response(JSON.stringify({ error: "Missing storage_path" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  // Security: ensure path belongs to this user
  const pathParts = storage_path.split("/")
  if (pathParts[0] !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...cors, "Content-Type": "application/json" },
    })
  }

  try {
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("campaign-docs")
      .download(storage_path)

    if (dlErr || !fileData) throw new Error(dlErr?.message ?? "Download failed")

    const fileName = pathParts[pathParts.length - 1].toLowerCase()
    const ext = fileName.split(".").pop() ?? ""

    let rawText = ""

    if (["txt", "md", "csv"].includes(ext)) {
      // Plain text — read directly
      rawText = await fileData.text()
    } else if (ext === "html" || ext === "htm") {
      // Strip HTML tags
      const html = await fileData.text()
      rawText = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    } else if (["pdf", "docx", "doc", "pptx", "xlsx"].includes(ext)) {
      // Binary formats — send to Claude vision as base64
      const buffer = await fileData.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ""
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
      const b64 = btoa(binary)

      const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })

      // Use Claude to extract text from the binary document
      const extraction = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            {
              type: "document" as const,
              source: {
                type: "base64" as const,
                media_type: ext === "pdf" ? "application/pdf" as const : "application/octet-stream" as const,
                data: b64,
              } as { type: "base64"; media_type: "application/pdf"; data: string },
            },
            {
              type: "text",
              text: "Extract all readable text from this document. Return only the raw text content, preserving structure where useful (headings, bullet points, tables). No commentary.",
            },
          ],
        }],
      })

      rawText = extraction.content[0].type === "text" ? extraction.content[0].text : ""
    } else {
      // Unknown format — try reading as text
      rawText = await fileData.text().catch(() => "")
    }

    if (!rawText || rawText.trim().length < 20) {
      return new Response(JSON.stringify({ success: false, error: "Could not extract text from document", profile: null }), {
        headers: { ...cors, "Content-Type": "application/json" },
      })
    }

    // Truncate and send to Claude Haiku for structured extraction
    const truncated = rawText.trim().slice(0, 8000)

    const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! })

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 900,
      messages: [{
        role: "user",
        content: `You are extracting business intelligence from a company document for use in marketing campaign generation.

DOCUMENT: ${fileName}

CONTENT:
${truncated}

Extract key business information and return a JSON object. Be specific — pull exact product names, actual prices, real testimonials, specific locations. Use null for any field you cannot find.

{
  "businessDescription": "2-3 specific sentences about exactly what this business does and who it serves",
  "productsServices": ["specific product/service names with details"],
  "uniqueSellingPoints": ["what genuinely differentiates this business"],
  "targetAudience": "specific description of who their customers are",
  "location": "city, area, or region where they operate",
  "pricePoints": "any specific prices, packages, or pricing info found",
  "socialProof": "client names, testimonials, awards, certifications, case study results",
  "contactInfo": "phone, email, WhatsApp numbers found",
  "brandTone": "the tone/voice used in this document",
  "keyOffers": "current promotions, deals, or signature offers mentioned"
}

Return ONLY valid JSON. No markdown, no explanation.`,
      }],
    })

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}"
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const profile = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return new Response(JSON.stringify({ success: true, profile, fileName }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err), profile: null }), {
      headers: { ...cors, "Content-Type": "application/json" },
    })
  }
})
