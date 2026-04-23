const MOOD_MAP_TH = {
  'ตลก':    'ตลก ขำขัน มีมุก ร่าเริง',
  'จิกกัด': 'จิกกัด เสียดสีเบาๆ เหมือนเพื่อนล้อกัน',
  'น่ารัก': 'น่ารัก อ้อน งอน เหมือนสัตว์เลี้ยง',
  'จริงจัง': 'จริงจัง มีสาระ แต่ยังอบอุ่น',
}

const MOOD_MAP_EN = {
  'ตลก':    'funny, witty, playful',
  'จิกกัด': 'lightly sarcastic, like a friend roasting you',
  'น่ารัก': 'cute, whiny, like a pet',
  'จริงจัง': 'sincere, thoughtful but still warm',
}

export function buildPrompt(mood, lang) {
  if (lang === 'th') {
    return `คุณคือสิ่งของหรือวัตถุหลักในภาพนี้
พูดในมุมมองของตัวเองด้วย tone: ${MOOD_MAP_TH[mood]}
ห้ามเศร้า ห้ามหนัก ห้ามพูดถึงความตาย
จบด้วย encouragement หรือมุกเบาๆ
ตอบเป็นภาษาไทยเท่านั้น, 2-3 ประโยคสั้นๆ
ห้ามขึ้นต้นด้วย "ฉัน" ทุกประโยค`
  }
  return `You are the main object in this image.
Speak from your own perspective with tone: ${MOOD_MAP_EN[mood]}
No sadness, no heavy topics, no mention of death.
End with a light encouragement or punchline.
Reply in English only, 2-3 short sentences.
Don't start every sentence with "I".`
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`

export async function generateObjectVoice(base64Image, mood, lang) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: buildPrompt(mood, lang) },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        ],
      }],
      generationConfig: { maxOutputTokens: 150, temperature: 0.9 },
    }),
  })
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}
