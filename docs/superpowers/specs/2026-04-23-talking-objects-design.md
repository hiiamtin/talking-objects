# Talking Objects — Design Spec

**Date:** 2026-04-23  
**Hackathon theme:** Social Impact  
**Stack:** Vite + React, Gemini 3.1 Flash Lite (free tier), html2canvas

---

## Concept

User takes/uploads photo → AI generates witty first-person voice of the main object → speech bubble overlaid on photo → shareable image.

Tone: ตลก, จิกกัด, อบอุ่น (funny, light roast, warm). Never sad or heavy.

---

## Platform

Responsive web app:
- **Mobile:** browser camera (`getUserMedia`) as primary input
- **Desktop:** file upload (`<input type="file" accept="image/*">`)

---

## App State Machine

Single-page, 4 states in `App.jsx`:

```
IDLE → CAPTURED → GENERATING → RESULT
         ↑                        |
         └────────────────────────┘ (ถ่ายใหม่ / regenerate)
```

**State variables in App.jsx:**
```js
const [appState, setAppState] = useState('idle')   // idle|captured|generating|result
const [image, setImage]       = useState(null)      // base64 string
const [mood, setMood]         = useState('ตลก')     // default
const [lang, setLang]         = useState('th')      // 'th' | 'en'
const [speech, setSpeech]     = useState('')
const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 }) // drag offset
```

**State transitions:**
- `IDLE` — camera/upload ready, MoodSelector + LangToggle visible
- `CAPTURED` — preview image shown, ปุ่ม "ให้ของพูด!" + "ถ่ายใหม่"
- `GENERATING` — loading animation on image, ปุ่ม cancel
- `RESULT` — image + draggable speech bubble, ShareBar

---

## Components

### `CameraCapture.jsx`
- Mobile: `navigator.mediaDevices.getUserMedia({ video: true })` → snapshot → base64
- Desktop: `<input type="file">` → FileReader → base64
- Detects mobile via `navigator.maxTouchPoints > 0`
- Emits: `onCapture(base64)`

### `MoodSelector.jsx`
- 4 pill buttons: **ตลก** (default selected) / จิกกัด / น่ารัก / จริงจัง
- Label stays Thai regardless of lang setting
- Emits: `onMoodChange(mood)`

### `SpeechBubble.jsx`
- Renders `<div>` container with `position: relative`
- `<img>` = actual photo, fills container
- Comic-style speech bubble (white fill, 2.5px dark stroke, tail) positioned absolute
- Default position: top-center of image
- Draggable via mouse + touch events (translate X/Y via state)
- Exposes `ref` for html2canvas capture
- Props: `image`, `speech`, `pos`, `onPosChange`

### `ShareBar.jsx`
- **Download PNG:** `html2canvas(bubbleRef.current)` → `canvas.toBlob()` → anchor download
- **Regenerate:** calls `generateObjectVoice()` → back to GENERATING
- **ถ่ายใหม่:** resets all state to IDLE

### `LangToggle.jsx`
- `TH | EN` toggle pill, shown in IDLE and CAPTURED states
- Updates `lang` in App.jsx

---

## Gemini Integration (`lib/gemini.js`)

```js
export async function generateObjectVoice(base64Image, mood, lang) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: buildPrompt(mood, lang) },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
        ]}],
        generationConfig: { maxOutputTokens: 150, temperature: 0.9 }
      })
    }
  )
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text.trim()
}
```

**Prompt (Thai):**
```
คุณคือสิ่งของหรือวัตถุหลักในภาพนี้
พูดในมุมมองของตัวเองด้วย tone: {MOOD_MAP_TH[mood]}
ห้ามเศร้า ห้ามหนัก ห้ามพูดถึงความตาย
จบด้วย encouragement หรือมุกเบาๆ
ตอบเป็นภาษาไทยเท่านั้น, 2-3 ประโยคสั้นๆ
ห้ามขึ้นต้นด้วย "ฉัน" ทุกประโยค
```

**Prompt (English):**
```
You are the main object in this image.
Speak from your own perspective with tone: {MOOD_MAP_EN[mood]}
No sadness, no heavy topics, no mention of death.
End with a light encouragement or punchline.
Reply in English only, 2-3 short sentences.
Don't start every sentence with "I".
```

**Mood maps:**
```js
const MOOD_MAP_TH = {
  'ตลก':    'ตลก ขำขัน มีมุก ร่าเริง',
  'จิกกัด': 'จิกกัด เสียดสีเบาๆ เหมือนเพื่อนล้อกัน',
  'น่ารัก': 'น่ารัก อ้อน งอน เหมือนสัตว์เลี้ยง',
  'จริงจัง': 'จริงจัง มีสาระ แต่ยังอบอุ่น'
}
const MOOD_MAP_EN = {
  'ตลก':    'funny, witty, playful',
  'จิกกัด': 'lightly sarcastic, like a friend roasting you',
  'น่ารัก': 'cute, whiny, like a pet',
  'จริงจัง': 'sincere, thoughtful but still warm'
}
```

---

## Error Handling

- Gemini fail → แสดง toast "ลองใหม่นะ" → กลับ CAPTURED state (ไม่ reset รูป)
- Camera permission denied → fallback แสดง file upload แทน
- Image too large → `CameraCapture.jsx` resize via canvas ก่อน emit (max 1024px longest side, quality 0.8 JPEG)

---

## File Structure

```
talking-objects/
├── .env                          # VITE_GEMINI_API_KEY=...
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx                   # state machine root
│   ├── components/
│   │   ├── CameraCapture.jsx
│   │   ├── MoodSelector.jsx
│   │   ├── LangToggle.jsx
│   │   ├── SpeechBubble.jsx
│   │   └── ShareBar.jsx
│   └── lib/
│       └── gemini.js
└── docs/superpowers/specs/
    └── 2026-04-23-talking-objects-design.md
```

---

## Out of Scope (hackathon MVP)

- Community feed / backend
- User accounts
- TTS / audio
- Multi-language UI labels (MoodSelector stays Thai)
- Object detection highlight (bubble placement = manual drag only)
