export default {
  async fetch(request, env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS || "http://localhost:5173")
      .split(",").map(o => o.trim())

    const cors = corsHeaders(request, allowedOrigins)

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors })
    }

    const origin = request.headers.get("Origin") || ""
    if (request.method === "POST" && !allowedOrigins.includes(origin)) {
      return new Response("Forbidden", { status: 403, headers: cors })
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: cors })
    }

    const turnstileToken = request.headers.get("X-Turnstile-Token")
    if (!turnstileToken) {
      return new Response("Missing Turnstile token", { status: 403, headers: cors })
    }

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: turnstileToken,
        remoteip: request.headers.get("CF-Connecting-IP"),
      }),
    })
    const verifyData = await verifyRes.json()
    if (!verifyData.success) {
      return new Response("Turnstile verification failed", { status: 403, headers: cors })
    }

    try {
      const body = await request.json()
      const { prompt, image } = body

      if (!prompt || !image) {
        return new Response("Missing prompt or image", { status: 400, headers: cors })
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

      if (!geminiRes.ok) {
        return new Response(JSON.stringify(data), {
          status: geminiRes.status,
          headers: { "Content-Type": "application/json", ...cors },
        })
      }

      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", ...cors },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors },
      })
    }
  },
}

function corsHeaders(request, allowedOrigins) {
  const origin = request.headers.get("Origin") || ""
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Turnstile-Token",
  }
}
