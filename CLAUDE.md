# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Talking Objects** — hackathon project (social impact theme). User takes/uploads photo, AI generates funny first-person voice of the object in the image. Tone: จิกกัด, ตลก, อบอุ่น (witty, light roast, warm). Not sad/heavy.

## Tech Stack

- **Frontend:** Vite + React
- **AI:** Gemini 3.1 Flash Lite (vision + text generation) — free tier via Google AI Studio
- **Language output:** Thai (primary)

## Dev Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview build
```

## Architecture

```
src/
├── App.jsx              # root, manages camera/upload state
├── components/
│   ├── Camera.jsx       # browser camera capture → base64
│   ├── ImageUpload.jsx  # file upload fallback
│   ├── SpeechBubble.jsx # displays object's generated voice
│   └── ShareButton.jsx  # share/download image with bubble overlay
├── lib/
│   └── gemini.js        # Gemini API client, prompt builder
└── main.jsx
```

## Gemini Integration

API key from `.env`:
```
VITE_GEMINI_API_KEY=your_key_here
```

Prompt pattern for object voice:
```
วิเคราะห์ภาพนี้แล้วพูดในมุมมองของ [object หลักในภาพ]
tone: ตลก จิกกัด แต่อบอุ่น ห้ามเศร้า
จบด้วย encouragement เบาๆ
ภาษาไทย, 2-3 ประโยค
```

## Key Design Decisions

- **Tone must stay positive/funny** — no sad/dark content, objects are witty friends not victims
- **Share-ready output** — speech bubble overlaid on photo, exportable for social media
- **Thai language first** — all generated text in Thai unless user switches
