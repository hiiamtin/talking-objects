const WORKER_URL = import.meta.env.VITE_WORKER_URL
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_DIRECT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

function buildBlessingPrompt(mood, lang) {
  const moodMap = {
    th: { sweet: 'หวาน อบอุ่น', touching: 'ซึ้ง จริงใจ', cool: 'เท่ มั่นใจ', cute: 'น่ารัก สดใส', pro: 'มืออาชีพ สุภาพ' },
    en: { sweet: 'warm and sweet', touching: 'emotional and sincere', cool: 'bold and cool', cute: 'cute and playful', pro: 'professional and polished' },
  }
  if (lang === 'th') {
    return `จากภาพที่ได้รับ ให้แต่งคำอวยพรครบรอบ 5 ปี SCB TechX 1 ข้อความ
โทน: ${moodMap.th[mood]}
ความยาวไม่เกิน 120 ตัวอักษร
สุภาพ ปลอดภัย ไม่พาดพิงการเมือง ศาสนา ความรุนแรง
ตอบเป็นภาษาไทยเท่านั้น และส่งเฉพาะข้อความคำอวยพร`}
  return `Based on this image, write one blessing message for SCB TechX's 5th anniversary.
Tone: ${moodMap.en[mood]}
Max length: 120 characters.
Safe, respectful, no politics/religion/violence.
Reply in English only and output only the final blessing.`
}

export async function generateBlessingFromImage(base64Image, mood, lang) {
  const prompt = buildBlessingPrompt(mood, lang)
  if (!GEMINI_KEY && !WORKER_URL) throw new Error('AI service is not configured')

  const payload = {
    contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: 'image/jpeg', data: base64Image } }] }],
    generationConfig: { maxOutputTokens: 100, temperature: 0.8 },
  }

  const res = GEMINI_KEY
    ? await fetch(`${GEMINI_DIRECT}?key=${GEMINI_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    : await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, image: base64Image }) })

  if (!res.ok) throw new Error(lang === 'th' ? 'AI สร้างข้อความไม่สำเร็จ ลองใหม่อีกครั้ง' : 'AI generation failed, please retry.')
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) throw new Error(lang === 'th' ? 'ไม่พบข้อความจาก AI' : 'No AI text found')
  return text.slice(0, 120)
}
