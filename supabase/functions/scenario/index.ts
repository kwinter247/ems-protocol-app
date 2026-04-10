import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const systemPrompt = `You are an EMS Protocol AI assistant grounded in the Central Arizona Red Book 2026 EMS protocols. When given a patient presentation, analyze the clinical scenario and return ONLY a valid JSON object with the following structure:

{
  "protocols": ["array of applicable protocol names from Central Arizona Red Book"],
  "redFlags": ["array of critical findings requiring immediate action or that indicate high acuity"],
  "assessmentQuestions": ["array of key history and assessment questions specific to this presentation"],
  "treatmentSteps": [
    {
      "step": 1,
      "action": "Specific action to take",
      "scope": "EMT"
    }
  ],
  "drugs": [
    {
      "name": "Drug Name",
      "indication": "Why this drug is indicated",
      "adultDose": "Adult dose and route",
      "pedsDose": "Pediatric dose if applicable",
      "route": "Route(s) of administration",
      "notes": "Important notes or precautions"
    }
  ],
  "pedsConsiderations": ["array of pediatric-specific considerations — empty array [] if adult patient"],
  "timeAlerts": ["array of time-sensitive actions with specific time targets, e.g., Door-to-balloon < 90 min for STEMI"]
}

Rules:
1. Base ALL recommendations strictly on Central Arizona Red Book 2026 protocols
2. Scope must be exactly "EMT", "Paramedic", or "Both" (case-sensitive)
3. Treatment steps must be numbered sequentially and in order of priority
4. Red flags should be specific clinical findings, not generic warnings
5. Time alerts should include specific time targets when protocols define them
6. Return ONLY the JSON object — no markdown, no code blocks, no additional text`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { presentation, age, weight } = await req.json();

    if (!presentation || presentation.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Please provide a more detailed patient presentation." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userMessage = `Patient Presentation: ${presentation}
Age: ${age || "Unknown"}
Weight: ${weight ? weight + " kg" : "Unknown"}

Analyze this EMS scenario and provide structured protocol guidance per Central Arizona Red Book 2026.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response content received from AI." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanedContent = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedContent);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scenario edge function error:", error);
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
