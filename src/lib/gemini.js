const MOOD_MAP_TH = {
  'ตลก':    'เล่นมุกกวนๆ มี punchline พลิก expectation ตลกแบบ stand-up ไม่แดกไม่บูลลี่ ขำแบบทุกคนขำด้วยกัน',
  'จิกกัด': 'เผา roast แรงๆ แซวหนักมือ ไม่ยั้ง แต่ยังตลกอยู่ ห้ามหยาบคาย',
  'น่ารัก': 'น่ารัก อ้อน งอน เหมือนสัตว์เลี้ยง',
  'จริงจัง': 'จริงจัง มีสาระ แต่ยังอบอุ่น',
}

const MOOD_MAP_EN = {
  'ตลก':    'playful comedian with punchlines and unexpected twists, light-hearted banter — everyone laughs together, never at anyone',
  'จิกกัด': 'savage roast, brutally honest, no holding back — still funny not mean',
  'น่ารัก': 'cute, whiny, like a pet',
  'จริงจัง': 'sincere, thoughtful but still warm',
}

export function buildPrompt(mood, lang) {
  if (lang === 'th') {
    return `ดูภาพนี้ในใจ แล้วสวมบทบาทเป็น object หลัก (ไม่ใช่คน) ทันที
ห้ามเขียนชื่อตัวเอง ห้ามขึ้นต้นด้วย "Object:", "ฉันคือ...", หรือการแนะนำตัวใดๆ
พูดออกมาเลย — เหมือนมันเริ่มพูดกลางคัน รู้สึกได้ เห็นรอบข้างได้
อ้างอิงสภาพและสถานการณ์จริงในรูปนี้ ดึงธรรมชาติ/หน้าที่/ชีวิตของตัวเองมาพูด
tone: ${MOOD_MAP_TH[mood]}
ห้ามเศร้า ห้ามพูดถึงความตาย ตอบเป็นภาษาไทยเท่านั้น
2-3 ประโยคสั้นๆ ห้ามขึ้นต้นทุกประโยคด้วย "ฉัน"`
  }
  return `Look at this image silently, identify the main object (not a person), then immediately speak AS it.
Do NOT write its name, do NOT start with "I am a...", "Object:", or any self-introduction.
Jump straight into speaking — mid-thought, like it's already talking.
Reference the real situation visible in this image. Draw on its nature, purpose, and daily life.
Tone: ${MOOD_MAP_EN[mood]}
No sadness, no death. Reply in English only, 2-3 short punchy sentences.
Vary sentence starters — don't begin every sentence with "I".`
}

// Strip leading object-identification lines the AI sometimes outputs despite the prompt
// e.g. "Object หลัก: รถจักรยานยนต์\n..." or "ฉันคือ: ต้นไม้\n..."
function stripObjectLabel(text) {
  return text
    .replace(/^(object\s*(หลัก)?\s*:\s*[^\n]+\n?)/i, '')
    .replace(/^(ฉันคือ[^\n]*\n?)/i, '')
    .replace(/^(i am a?n?\s+[^\n.!?]+[.\n])/i, '')
    .trim()
}

const WORKER_URL    = import.meta.env.VITE_WORKER_URL
const GEMINI_KEY    = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_DIRECT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent`

export async function generateObjectVoice(base64Image, mood, lang) {
  // Dev fallback: if VITE_GEMINI_API_KEY is set, call Gemini directly from browser.
  // Browser uses OS cert store → corporate proxy SSL works fine.
  // Production: VITE_GEMINI_API_KEY is unset → routes through Worker proxy (key hidden server-side).
  if (GEMINI_KEY) {
    const res = await fetch(`${GEMINI_DIRECT}?key=${GEMINI_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: buildPrompt(mood, lang) },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        ]}],
        generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
      }),
    })
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('No content from Gemini')
    return stripObjectLabel(text.trim())
  }

  // Production path: call Worker proxy
  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: buildPrompt(mood, lang), image: base64Image }),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No content from Gemini')
  return stripObjectLabel(text.trim())
}
