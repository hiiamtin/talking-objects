export default {
  async fetch(request, env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS || "http://localhost:5173")
      .split(",").map(o => o.trim())

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request, allowedOrigins),
      })
    }

    const origin = request.headers.get("Origin") || ""
    if (request.method === "POST" && !allowedOrigins.includes(origin)) {
      return new Response("Forbidden", { status: 403 })
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    const body = await request.json()
    const { prompt, image } = body

    if (!prompt || !image) {
      return new Response("Missing prompt or image", { status: 400 })
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: image } },
          ],
        }],
        generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
      }),
    })

    const data = await geminiRes.json()

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(request, allowedOrigins),
      },
    })
  },
}

function corsHeaders(request, allowedOrigins) {
  const origin = request.headers.get("Origin") || ""
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}
