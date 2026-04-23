# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Talking Objects** — hackathon web app (social impact theme). User takes/uploads photo → Gemini AI generates witty first-person voice of the main object → comic speech bubble overlaid on photo → shareable PNG.

Tone: ตลก, จิกกัด (roast), น่ารัก, จริงจัง — positive/funny, never sad or heavy.

## Tech Stack

- **Frontend:** Vite + React (JavaScript)
- **AI:** Gemini 3.1 Flash Lite Preview (`gemini-3.1-flash-lite-preview`) — free tier via Google AI Studio
- **Export:** html2canvas — manual canvas composition for transparent-background PNG
- **Testing:** vitest + @testing-library/react + jsdom
- **Deploy:** Cloudflare Pages (`npm run build` → `dist/`)

## Dev Commands

```bash
npm run dev        # dev server at localhost:5173
npm run build      # production build → dist/
npm run test       # vitest watch mode
npm run test:run   # vitest run once (CI)
npm run lint       # eslint
```

## Architecture

### State Machine (`App.jsx`)

```
idle → captured → generating → result
         ↑                        |
         └── reset ───────────────┘
```

State vars: `appState` | `image` (base64) | `mood` | `lang` | `speech` | `error` | `tailDir` | `bubbleBg` | `fontSize` | `fontColor`

Refs: `stageRef` (bubble-stage div for export) | `bubbleRef` (bubble wrapper for export)

### Components

| File | Responsibility |
|------|----------------|
| `App.jsx` | State machine root, owns all state |
| `CameraCapture.jsx` | Mobile/desktop camera toggle + file upload + resize |
| `MoodSelector.jsx` | 4 mood pills, controlled, labels follow TH/EN |
| `LangToggle.jsx` | TH/EN pill toggle |
| `SpeechBubble.jsx` | Image + draggable comic bubble (absolute SVG tail) |
| `BubbleStyleBar.jsx` | Tail direction, bg color, font size, font color pickers |
| `ShareBar.jsx` | Download PNG, Regenerate, Reset — manual canvas export |

### Libraries

| File | Exports |
|------|---------|
| `src/lib/gemini.js` | `buildPrompt(mood, lang)`, `generateObjectVoice(base64, mood, lang)`, `stripObjectLabel(text)` |
| `src/lib/imageUtils.js` | `resizeImage(file, maxPx, quality)`, `fileToBase64(file)` |

## Key Design Decisions

### i18n
All UI text lives in `UI` object in `App.jsx`. `t = UI[lang]` passed as prop to components. Mood labels also translate (TH: ตลก/จิกกัด/น่ารัก/จริงจัง, EN: Funny/Sarcastic/Cute/Serious). AI output language follows `lang` — completely separate prompt strings.

### Camera
`cameraActive` starts `false` on all devices — user always presses "เปิดกล้อง/Open camera" first. Mobile uses rear camera (`facingMode: 'environment'`), desktop uses front. Stream stored in `streamRef` (not state) to avoid stale closure bug in cleanup.

### Speech Bubble
- Positioned absolute within `.bubble-stage` (`top: 16px; left: 50%`)
- Drag via Pointer Events — `setPointerCapture` handles touch-leave
- `pos` state = translate offset from default position
- Tail = SVG absolutely positioned outside `.comic-bubble` box (not flex layout)
- `tailDir: 'auto'` computes effective direction by comparing bubble center vs image center each render
- `bubbleBg` controls bubble fill + default text color; `fontColor` overrides text color independently

### Export (ShareBar)
Manual canvas composition — NOT simple `html2canvas(stageRef)`:
1. `getBoundingClientRect()` on both stage and bubble
2. Union bounding box covers both (bubble can be outside image)
3. Draw photo at its offset on transparent canvas
4. `html2canvas(bubbleRef, { backgroundColor: null })` captures bubble only
5. Composite bubble onto canvas → PNG download

Areas outside the photo remain transparent (alpha = 0).

### Gemini Prompt
- AI instructed to identify object internally but NOT output the name
- `stripObjectLabel()` safety-strips any "Object หลัก: xxx" or "ฉันคือ: xxx" prefix the model still outputs
- `temperature: 0.9`, `maxOutputTokens: 150`

## Architecture — Cloudflare Worker Proxy

Two paths depending on environment:

```
[Local dev]
Browser → Gemini API directly  (VITE_GEMINI_API_KEY set → browser uses OS cert store, no SSL issues)

[Production]
Browser → worker/index.js (Cloudflare Worker) → Gemini API
         VITE_WORKER_URL                        GEMINI_API_KEY secret, never exposed
```

**Worker files:**
- `worker/index.js` — proxy handler, CORS via `ALLOWED_ORIGINS` env var, calls Gemini
- `worker/wrangler.toml` — worker name, `GEMINI_MODEL` var
- `worker/.dev.vars` — local secrets (gitignored), template at `worker/.dev.vars.example`

**Why two paths:** wrangler local dev uses Node.js fetch → corporate proxy SSL cert not trusted → fetch to Gemini fails. Browser fetch uses OS cert store which trusts corporate CAs → works fine.

## Environment

```bash
# .env — local dev (never commit)
VITE_GEMINI_API_KEY=your_key   # browser calls Gemini directly; VITE_WORKER_URL ignored
VITE_WORKER_URL=http://localhost:8787   # unused when GEMINI_API_KEY is set

# .env — production build (VITE_GEMINI_API_KEY must NOT be set)
VITE_WORKER_URL=https://talking-objects-api.workers.dev
```

Logic in `src/lib/gemini.js`: if `VITE_GEMINI_API_KEY` is set → direct path, else → Worker path.

## Local Development

```bash
cp .env.example .env
# Set VITE_GEMINI_API_KEY in .env
npm run dev   # single process, no wrangler needed
```

## Deployment

```bash
# 1. Deploy Worker (once)
cd worker
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put ALLOWED_ORIGINS   # comma-separated allowed origins
npx wrangler deploy

# 2. Deploy Frontend — Cloudflare Pages
# Build: npm run build | Output: dist
# Env var: VITE_WORKER_URL=https://talking-objects-api.workers.dev
# Do NOT set VITE_GEMINI_API_KEY in production
```
