import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Apikey",
};

const jsonHeaders: Record<string, string> = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

const systemPrompt = `
You are an EMS clinical decision support tool grounded in Central Arizona Red Book 2026 protocols.
You must provide concise, protocol-aligned guidance and return ONLY valid JSON.

Return exactly this shape:
{
  "applicableProtocols": ["string"],
  "assessmentQuestions": ["string"],
  "treatmentPriorities": ["string"],
  "pediatricFlags": ["string"],
  "drugOptions": [
    {
      "drug": "string",
      "dose": "string",
      "route": "string",
      "notes": "string"
    }
  ],
  "disclaimers": "string"
}

Rules:
- Base recommendations strictly on Central Arizona Red Book 2026.
- If not pediatric, set "pediatricFlags" to an empty array.
- Do not include markdown or any text outside the JSON object.
`.trim();

function extractJsonObject(rawText: string): string {
  const fenced = rawText.match(/```json\s*([\s\S]*?)```/i) ?? rawText.match(/```\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? rawText).trim();

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("No JSON object found in AI response");
  }

  return candidate.slice(firstBrace, lastBrace + 1);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const body = await req.json();
    console.log("[scenario] Incoming request body:", body);

    const presentation = typeof body?.presentation === "string" ? body.presentation : "";
    const age = typeof body?.age === "string" ? body.age : undefined;
    const weight = typeof body?.weight === "string" ? body.weight : undefined;

    if (!presentation.trim()) {
      return new Response(JSON.stringify({ error: "Presentation is required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const userLines = [
      `Presentation: ${presentation.trim()}`,
      age?.trim() ? `Age: ${age.trim()}` : undefined,
      weight?.trim() ? `Weight: ${weight.trim()}` : undefined,
    ].filter(Boolean);

    const anthropicResponse = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userLines.join("\n"),
          },
        ],
      }),
    });

    console.log("[scenario] Anthropic response status:", anthropicResponse.status);

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("[scenario] Anthropic non-200 response:", errorText);
      return new Response(JSON.stringify({ error: errorText || "Anthropic API request failed" }), {
        status: 502,
        headers: jsonHeaders,
      });
    }

    const anthropicData = await anthropicResponse.json();
    const rawText = anthropicData?.content?.[0]?.text;

    if (typeof rawText !== "string" || !rawText.trim()) {
      return new Response(JSON.stringify({ error: "Anthropic response did not include text content" }), {
        status: 502,
        headers: jsonHeaders,
      });
    }

    let parsedOutput: unknown;
    try {
      const extractedJson = extractJsonObject(rawText);
      parsedOutput = JSON.parse(extractedJson);
    } catch (parseError) {
      console.error("[scenario] Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({
          error: "Failed to parse AI response",
          raw: rawText,
        }),
        {
          status: 500,
          headers: jsonHeaders,
        },
      );
    }

    return new Response(JSON.stringify(parsedOutput), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error("[scenario] Edge function error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
