const MOOD_MAP_TH = {
  'ตลก':    'ตลก ขำขัน มีมุก ร่าเริง',
  'จิกกัด': 'เผา roast แรงๆ แซวหนักมือ ไม่ยั้ง แต่ยังตลกอยู่ ห้ามหยาบคาย',
  'น่ารัก': 'น่ารัก อ้อน งอน เหมือนสัตว์เลี้ยง',
  'จริงจัง': 'จริงจัง มีสาระ แต่ยังอบอุ่น',
}

const MOOD_MAP_EN = {
  'ตลก':    'funny, witty, playful',
  'จิกกัด': 'savage roast, brutally honest, no holding back — still funny not mean',
  'น่ารัก': 'cute, whiny, like a pet',
  'จริงจัง': 'sincere, thoughtful but still warm',
}

export function buildPrompt(mood, lang) {
  if (lang === 'th') {
    return `ดูภาพนี้แล้วระบุว่า object หลักคืออะไร จากนั้นสวมบทบาทเป็นมัน 100%
ห้ามสวมบทบาทเป็นคนในภาพ — ให้เป็นสิ่งของ วัตถุ หรือธรรมชาติ เท่านั้น
คุณ *คือ* สิ่งนั้น — มีจิตสำนึก รู้สึกได้ เห็นรอบข้างได้
พูดจากมุมมองของตัวเอง: อ้างอิงสภาพ สถานการณ์ หรือสิ่งที่เห็นในรูปนี้โดยตรง
ดึงความรู้เกี่ยวกับธรรมชาติ หน้าที่ และชีวิตประจำวันของตัวเองออกมาพูด
tone: ${MOOD_MAP_TH[mood]}
ห้ามเศร้า ห้ามพูดถึงความตาย ตอบเป็นภาษาไทยเท่านั้น
2-3 ประโยคสั้นๆ ห้ามขึ้นต้นทุกประโยคด้วย "ฉัน"`
  }
  return `Look at this image, identify the main object (not a person), then fully embody it.
You ARE that specific object — conscious, feeling, aware of everything around you.
Speak from its actual point of view: reference the exact condition and situation visible in this image.
Draw on its real nature, purpose, daily life, and frustrations as that type of object.
Tone: ${MOOD_MAP_EN[mood]}
No sadness, no death. Reply in English only, 2-3 short punchy sentences.
Vary your sentence starters — don't begin every sentence with "I".`
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent`

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
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No content from Gemini')
  return text.trim()
}
