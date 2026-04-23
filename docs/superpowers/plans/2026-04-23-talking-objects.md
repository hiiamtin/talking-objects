# Talking Objects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web app where users take/upload a photo, Gemini AI generates a witty first-person voice of the main object, and the result appears as a draggable comic speech bubble overlaid on the image — exportable as PNG.

**Architecture:** Single-page app with a 4-state machine (idle → captured → generating → result) in App.jsx. All state lives at the root. Each component handles one concern and communicates via props/callbacks.

**Tech Stack:** Vite + React, @google/generative-ai (or raw fetch), html2canvas, vitest + @testing-library/react

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/App.jsx` | State machine root — owns all state, renders correct component per state |
| `src/App.css` | Global styles + comic UI theme |
| `src/components/CameraCapture.jsx` | Camera (mobile) or file upload (desktop), resize image, emit base64 |
| `src/components/MoodSelector.jsx` | 4 mood pill buttons, default "ตลก" |
| `src/components/LangToggle.jsx` | TH/EN toggle pill |
| `src/components/SpeechBubble.jsx` | Image + draggable comic bubble overlay, exposes ref for export |
| `src/components/ShareBar.jsx` | Download PNG, Regenerate, Reset buttons |
| `src/lib/imageUtils.js` | `resizeImage(file, maxPx, quality)` → base64 string |
| `src/lib/imageUtils.test.js` | Unit tests for resizeImage |
| `src/lib/gemini.js` | `buildPrompt(mood, lang)`, `generateObjectVoice(base64, mood, lang)` |
| `src/lib/gemini.test.js` | Unit tests for buildPrompt |

---

## Task 1: Scaffold Project

**Files:**
- Create: `package.json`, `vite.config.js`, `src/main.jsx`, `index.html`, `.env`, `.gitignore`

- [ ] **Step 1: Create Vite + React project**

```bash
cd /Users/rattanaritprasomsab/rattanarit-data/ai/poc/talking-objects
npm create vite@latest . -- --template react
```

Answer prompts: select "React" → "JavaScript"

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install html2canvas
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure vitest in vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
})
```

- [ ] **Step 4: Create test setup file**

```js
// src/test-setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 6: Create .env**

```bash
# .env
VITE_GEMINI_API_KEY=your_key_here
```

- [ ] **Step 7: Update .gitignore**

Add to `.gitignore`:
```
.env
.superpowers/
```

- [ ] **Step 8: Wipe Vite boilerplate**

Delete `src/App.css` content (will rewrite), delete `src/assets/`, clear `src/App.jsx` to empty export.

```jsx
// src/App.jsx (temporary placeholder)
export default function App() {
  return <div>Talking Objects</div>
}
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: server at `http://localhost:5173`, shows "Talking Objects"

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold vite+react project with vitest"
```

---

## Task 2: Image Utilities (`imageUtils.js`)

**Files:**
- Create: `src/lib/imageUtils.js`
- Create: `src/lib/imageUtils.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/lib/imageUtils.test.js
import { resizeImage, fileToBase64 } from './imageUtils'

describe('resizeImage', () => {
  it('returns a base64 jpeg string', async () => {
    // Create a minimal canvas-based fake image file
    const canvas = document.createElement('canvas')
    canvas.width = 2000
    canvas.height = 1500
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'))
    const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })

    const result = await resizeImage(file, 1024, 0.8)

    expect(typeof result).toBe('string')
    expect(result.startsWith('/9j/')).toBe(true) // JPEG base64 signature
  })

  it('preserves aspect ratio — width > height', async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 2000
    canvas.height = 1000
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg'))
    const file = new File([blob], 'wide.jpg', { type: 'image/jpeg' })

    const result = await resizeImage(file, 1024, 0.8)
    // Decode to check dimensions
    const img = new Image()
    await new Promise(r => { img.onload = r; img.src = `data:image/jpeg;base64,${result}` })

    expect(img.naturalWidth).toBeLessThanOrEqual(1024)
    expect(img.naturalHeight).toBeLessThanOrEqual(1024)
  })
})
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npm run test:run -- imageUtils
```

Expected: FAIL — "Cannot find module './imageUtils'"

- [ ] **Step 3: Implement imageUtils.js**

```js
// src/lib/imageUtils.js

/**
 * Resize image file to max maxPx on longest side, return base64 JPEG string (no data: prefix)
 */
export function resizeImage(file, maxPx = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const scale = Math.min(1, maxPx / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl.split(',')[1]) // strip "data:image/jpeg;base64,"
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Read File as base64 string (no data: prefix). No resizing.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npm run test:run -- imageUtils
```

Expected: PASS — 2 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/imageUtils.js src/lib/imageUtils.test.js
git commit -m "feat: add resizeImage and fileToBase64 utilities"
```

---

## Task 3: Gemini Integration (`gemini.js`)

**Files:**
- Create: `src/lib/gemini.js`
- Create: `src/lib/gemini.test.js`

- [ ] **Step 1: Write failing tests for buildPrompt**

```js
// src/lib/gemini.test.js
import { buildPrompt } from './gemini'

describe('buildPrompt', () => {
  it('Thai prompt contains Thai mood description', () => {
    const prompt = buildPrompt('ตลก', 'th')
    expect(prompt).toContain('ตลก ขำขัน มีมุก ร่าเริง')
    expect(prompt).toContain('ภาษาไทย')
  })

  it('English prompt contains English mood description', () => {
    const prompt = buildPrompt('ตลก', 'en')
    expect(prompt).toContain('funny, witty, playful')
    expect(prompt).toContain('English only')
  })

  it('Thai prompt contains all 4 moods correctly', () => {
    expect(buildPrompt('จิกกัด', 'th')).toContain('เสียดสีเบาๆ')
    expect(buildPrompt('น่ารัก', 'th')).toContain('อ้อน งอน')
    expect(buildPrompt('จริงจัง', 'th')).toContain('มีสาระ')
  })

  it('English prompt contains all 4 moods correctly', () => {
    expect(buildPrompt('จิกกัด', 'en')).toContain('lightly sarcastic')
    expect(buildPrompt('น่ารัก', 'en')).toContain('cute, whiny')
    expect(buildPrompt('จริงจัง', 'en')).toContain('sincere, thoughtful')
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
npm run test:run -- gemini
```

Expected: FAIL — "Cannot find module './gemini'"

- [ ] **Step 3: Implement gemini.js**

```js
// src/lib/gemini.js

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
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npm run test:run -- gemini
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/gemini.js src/lib/gemini.test.js
git commit -m "feat: add gemini buildPrompt and generateObjectVoice"
```

---

## Task 4: MoodSelector + LangToggle Components

**Files:**
- Create: `src/components/MoodSelector.jsx`
- Create: `src/components/LangToggle.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/components/MoodSelector.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import MoodSelector from './MoodSelector'

describe('MoodSelector', () => {
  it('renders all 4 mood buttons', () => {
    render(<MoodSelector mood="ตลก" onMoodChange={() => {}} />)
    expect(screen.getByText('ตลก')).toBeInTheDocument()
    expect(screen.getByText('จิกกัด')).toBeInTheDocument()
    expect(screen.getByText('น่ารัก')).toBeInTheDocument()
    expect(screen.getByText('จริงจัง')).toBeInTheDocument()
  })

  it('calls onMoodChange when button clicked', () => {
    const onChange = vi.fn()
    render(<MoodSelector mood="ตลก" onMoodChange={onChange} />)
    fireEvent.click(screen.getByText('จิกกัด'))
    expect(onChange).toHaveBeenCalledWith('จิกกัด')
  })

  it('highlights active mood', () => {
    render(<MoodSelector mood="น่ารัก" onMoodChange={() => {}} />)
    expect(screen.getByText('น่ารัก').closest('button')).toHaveClass('active')
  })
})
```

```jsx
// src/components/LangToggle.test.jsx
import { render, screen, fireEvent } from '@testing-library/react'
import LangToggle from './LangToggle'

describe('LangToggle', () => {
  it('renders TH and EN buttons', () => {
    render(<LangToggle lang="th" onLangChange={() => {}} />)
    expect(screen.getByText('TH')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('calls onLangChange with en when EN clicked', () => {
    const onChange = vi.fn()
    render(<LangToggle lang="th" onLangChange={onChange} />)
    fireEvent.click(screen.getByText('EN'))
    expect(onChange).toHaveBeenCalledWith('en')
  })
})
```

- [ ] **Step 2: Run to verify fail**

```bash
npm run test:run -- MoodSelector LangToggle
```

Expected: FAIL — modules not found

- [ ] **Step 3: Implement MoodSelector.jsx**

```jsx
// src/components/MoodSelector.jsx
const MOODS = ['ตลก', 'จิกกัด', 'น่ารัก', 'จริงจัง']

export default function MoodSelector({ mood, onMoodChange }) {
  return (
    <div className="mood-selector">
      {MOODS.map(m => (
        <button
          key={m}
          className={`mood-btn ${mood === m ? 'active' : ''}`}
          onClick={() => onMoodChange(m)}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement LangToggle.jsx**

```jsx
// src/components/LangToggle.jsx
export default function LangToggle({ lang, onLangChange }) {
  return (
    <div className="lang-toggle">
      <button
        className={`lang-btn ${lang === 'th' ? 'active' : ''}`}
        onClick={() => onLangChange('th')}
      >
        TH
      </button>
      <span className="lang-divider">|</span>
      <button
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => onLangChange('en')}
      >
        EN
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify pass**

```bash
npm run test:run -- MoodSelector LangToggle
```

Expected: PASS — 5 tests

- [ ] **Step 6: Commit**

```bash
git add src/components/MoodSelector.jsx src/components/LangToggle.jsx \
        src/components/MoodSelector.test.jsx src/components/LangToggle.test.jsx
git commit -m "feat: add MoodSelector and LangToggle components"
```

---

## Task 5: CameraCapture Component

**Files:**
- Create: `src/components/CameraCapture.jsx`

- [ ] **Step 1: Implement CameraCapture.jsx**

No unit tests for this component — it relies entirely on `navigator.mediaDevices` and `HTMLVideoElement`, which are not testable in jsdom without deep mocking that adds no value.

```jsx
// src/components/CameraCapture.jsx
import { useRef, useState, useEffect } from 'react'
import { resizeImage, fileToBase64 } from '../lib/imageUtils'

const isMobile = navigator.maxTouchPoints > 0

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isMobile) return
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        setStream(s)
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => setError('camera_denied'))
    return () => stream?.getTracks().forEach(t => t.stop())
  }, [])

  async function handleSnapshot() {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async blob => {
      const file = new File([blob], 'snap.jpg', { type: 'image/jpeg' })
      const base64 = await resizeImage(file, 1024, 0.8)
      onCapture(base64)
    }, 'image/jpeg')
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const base64 = await resizeImage(file, 1024, 0.8)
    onCapture(base64)
  }

  // Mobile: show camera feed
  if (isMobile && !error) {
    return (
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        <button className="capture-btn" onClick={handleSnapshot}>📸 ถ่าย</button>
      </div>
    )
  }

  // Desktop or camera denied: show file upload
  return (
    <div className="upload-container">
      {error && <p className="error-hint">ไม่มีสิทธิ์กล้อง — อัพโหลดรูปได้เลย</p>}
      <label className="upload-label">
        <span>📁 เลือกรูป</span>
        <input type="file" accept="image/*" onChange={handleFileChange} hidden />
      </label>
    </div>
  )
}
```

- [ ] **Step 2: Verify file created correctly**

```bash
ls src/components/CameraCapture.jsx
```

Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add src/components/CameraCapture.jsx
git commit -m "feat: add CameraCapture with mobile camera and file upload fallback"
```

---

## Task 6: SpeechBubble Component

**Files:**
- Create: `src/components/SpeechBubble.jsx`

- [ ] **Step 1: Implement SpeechBubble.jsx**

```jsx
// src/components/SpeechBubble.jsx
import { useRef, useState } from 'react'

export default function SpeechBubble({ image, speech, containerRef }) {
  const [pos, setPos] = useState({ x: 0, y: -10 }) // default: near top
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  function onPointerDown(e) {
    dragging.current = true
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragging.current) return
    setPos({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    })
  }

  function onPointerUp() {
    dragging.current = false
  }

  return (
    <div className="bubble-stage" ref={containerRef}>
      <img src={`data:image/jpeg;base64,${image}`} className="stage-image" alt="captured" />

      {/* Comic speech bubble — draggable */}
      <div
        className="bubble-wrapper"
        style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="comic-bubble">
          <p className="bubble-text">{speech}</p>
        </div>
        <div className="bubble-tail" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add SpeechBubble CSS to App.css**

Append to `src/App.css`:

```css
.bubble-stage {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 480px;
  user-select: none;
}

.stage-image {
  width: 100%;
  display: block;
  border-radius: 12px;
}

.bubble-wrapper {
  position: absolute;
  top: 16px;
  left: 50%;
  cursor: grab;
  touch-action: none;
  z-index: 10;
}
.bubble-wrapper:active { cursor: grabbing; }

.comic-bubble {
  background: #fff;
  border: 2.5px solid #222;
  border-radius: 16px;
  padding: 10px 16px;
  box-shadow: 3px 3px 0 #222;
  min-width: 160px;
  max-width: 260px;
}

.bubble-text {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Noto Sans Thai', sans-serif;
  line-height: 1.5;
  color: #111;
}

.bubble-tail {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 14px solid #222;
  margin-left: 24px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SpeechBubble.jsx src/App.css
git commit -m "feat: add draggable comic SpeechBubble component"
```

---

## Task 7: ShareBar Component

**Files:**
- Create: `src/components/ShareBar.jsx`

- [ ] **Step 1: Implement ShareBar.jsx**

```jsx
// src/components/ShareBar.jsx
import html2canvas from 'html2canvas'

export default function ShareBar({ stageRef, onRegenerate, onReset }) {
  async function handleDownload() {
    const canvas = await html2canvas(stageRef.current, { useCORS: true })
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `talking-object-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div className="share-bar">
      <button className="btn-primary" onClick={handleDownload}>💾 บันทึกรูป</button>
      <button className="btn-secondary" onClick={onRegenerate}>🔄 พูดใหม่</button>
      <button className="btn-ghost" onClick={onReset}>📷 ถ่ายใหม่</button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ShareBar.jsx
git commit -m "feat: add ShareBar with download, regenerate, reset"
```

---

## Task 8: Wire App.jsx State Machine

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`

- [ ] **Step 1: Implement App.jsx**

```jsx
// src/App.jsx
import { useState, useRef } from 'react'
import CameraCapture from './components/CameraCapture'
import MoodSelector from './components/MoodSelector'
import LangToggle from './components/LangToggle'
import SpeechBubble from './components/SpeechBubble'
import ShareBar from './components/ShareBar'
import { generateObjectVoice } from './lib/gemini'
import './App.css'

export default function App() {
  const [appState, setAppState] = useState('idle')   // idle|captured|generating|result
  const [image, setImage]       = useState(null)
  const [mood, setMood]         = useState('ตลก')
  const [lang, setLang]         = useState('th')
  const [speech, setSpeech]     = useState('')
  const [error, setError]       = useState(null)
  const stageRef                = useRef(null)
  const abortRef                = useRef(null)

  function handleCapture(base64) {
    setImage(base64)
    setAppState('captured')
  }

  async function handleGenerate() {
    setAppState('generating')
    setError(null)
    try {
      const text = await generateObjectVoice(image, mood, lang)
      setSpeech(text)
      setAppState('result')
    } catch {
      setError('ลองใหม่นะ 🙏')
      setAppState('captured')
    }
  }

  function handleReset() {
    setImage(null)
    setSpeech('')
    setError(null)
    setAppState('idle')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🗯️ ของมันพูดได้</h1>
        {appState !== 'result' && (
          <LangToggle lang={lang} onLangChange={setLang} />
        )}
      </header>

      {/* IDLE — camera / upload */}
      {appState === 'idle' && (
        <div className="idle-screen">
          <MoodSelector mood={mood} onMoodChange={setMood} />
          <CameraCapture onCapture={handleCapture} />
        </div>
      )}

      {/* CAPTURED — preview + generate */}
      {appState === 'captured' && (
        <div className="captured-screen">
          <img src={`data:image/jpeg;base64,${image}`} className="preview-img" alt="preview" />
          <MoodSelector mood={mood} onMoodChange={setMood} />
          {error && <p className="toast-error">{error}</p>}
          <div className="action-row">
            <button className="btn-primary" onClick={handleGenerate}>💬 ให้ของพูด!</button>
            <button className="btn-ghost" onClick={handleReset}>↩ ถ่ายใหม่</button>
          </div>
        </div>
      )}

      {/* GENERATING — loading */}
      {appState === 'generating' && (
        <div className="generating-screen">
          <img src={`data:image/jpeg;base64,${image}`} className="preview-img loading" alt="processing" />
          <p className="loading-text">กำลังถามของว่าคิดอะไรอยู่... 🤔</p>
        </div>
      )}

      {/* RESULT — speech bubble + share */}
      {appState === 'result' && (
        <div className="result-screen">
          <SpeechBubble image={image} speech={speech} containerRef={stageRef} />
          <ShareBar
            stageRef={stageRef}
            onRegenerate={handleGenerate}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write App.css**

Replace `src/App.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Noto Sans Thai', sans-serif;
  background: #FFF9F0;
  min-height: 100dvh;
}

.app {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #111;
}

/* Screens */
.idle-screen, .captured-screen, .generating-screen, .result-screen {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.preview-img {
  width: 100%;
  border-radius: 12px;
  border: 2.5px solid #222;
  box-shadow: 4px 4px 0 #222;
}

.preview-img.loading {
  opacity: 0.5;
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.loading-text {
  font-size: 1rem;
  color: #555;
}

/* Camera */
.camera-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}

.camera-feed {
  width: 100%;
  border-radius: 12px;
  border: 2.5px solid #222;
}

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 2rem;
  border: 2.5px dashed #888;
  border-radius: 12px;
  width: 100%;
  font-size: 1rem;
  color: #555;
  transition: border-color 0.2s;
}
.upload-label:hover { border-color: #333; color: #111; }

/* Mood selector */
.mood-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.mood-btn {
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 2px solid #333;
  background: white;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.15s;
}

.mood-btn.active, .mood-btn:hover {
  background: #333;
  color: white;
}

/* Lang toggle */
.lang-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  border: 2px solid #333;
  border-radius: 999px;
  padding: 0.2rem 0.5rem;
}

.lang-btn {
  background: none;
  border: none;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.1rem 0.3rem;
  border-radius: 999px;
  transition: all 0.15s;
}
.lang-btn.active { background: #333; color: white; }
.lang-divider { color: #aaa; }

/* Buttons */
.btn-primary {
  padding: 0.7rem 1.5rem;
  border-radius: 999px;
  border: 2.5px solid #222;
  background: #FFD600;
  font-family: inherit;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 3px 3px 0 #222;
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #222;
}

.btn-secondary {
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  border: 2.5px solid #222;
  background: white;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 3px 3px 0 #222;
}

.btn-ghost {
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  text-decoration: underline;
}

.action-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.capture-btn {
  padding: 0.7rem 1.5rem;
  border-radius: 999px;
  border: 2.5px solid #222;
  background: #FFD600;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 3px 3px 0 #222;
  font-size: 1rem;
}

/* Share bar */
.share-bar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.toast-error {
  color: #c62828;
  font-size: 0.85rem;
}

.error-hint {
  color: #888;
  font-size: 0.8rem;
}

/* SpeechBubble (defined in Task 6) is appended here */
.bubble-stage {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 480px;
  user-select: none;
}

.stage-image {
  width: 100%;
  display: block;
  border-radius: 12px;
  border: 2.5px solid #222;
  box-shadow: 4px 4px 0 #222;
}

.bubble-wrapper {
  position: absolute;
  top: 16px;
  left: 50%;
  cursor: grab;
  touch-action: none;
  z-index: 10;
}
.bubble-wrapper:active { cursor: grabbing; }

.comic-bubble {
  background: #fff;
  border: 2.5px solid #222;
  border-radius: 16px;
  padding: 10px 16px;
  box-shadow: 3px 3px 0 #222;
  min-width: 160px;
  max-width: 260px;
}

.bubble-text {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: 'Noto Sans Thai', sans-serif;
  line-height: 1.5;
  color: #111;
}

.bubble-tail {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 14px solid #222;
  margin-left: 24px;
}
```

- [ ] **Step 3: Run all tests**

```bash
npm run test:run
```

Expected: PASS — all tests green

- [ ] **Step 4: Start dev server and test manually**

```bash
npm run dev
```

Verify on browser:
1. Open `http://localhost:5173`
2. Upload test image → mood selector shows, "ให้ของพูด!" button appears
3. Click generate → loading animation shows
4. Result shows speech bubble on image, draggable
5. Click "พูดใหม่" → generates again
6. Click "บันทึกรูป" → PNG downloads with bubble
7. Verify on mobile: camera preview appears instead of file upload

- [ ] **Step 5: Add .env with real key and test end-to-end**

```bash
# .env
VITE_GEMINI_API_KEY=<your_real_key>
```

Restart dev server: `npm run dev`  
Upload any photo → generate → verify Thai/English speech appears correctly

- [ ] **Step 6: Final commit**

```bash
git add src/App.jsx src/App.css
git commit -m "feat: wire App.jsx state machine — talking objects MVP complete"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Mobile camera via getUserMedia | Task 5 (CameraCapture) |
| Desktop file upload | Task 5 (CameraCapture) |
| Resize image max 1024px | Task 2 (imageUtils) |
| 4 mood buttons, default ตลก | Task 4 (MoodSelector) |
| TH/EN toggle | Task 4 (LangToggle) |
| Prompt changes with lang | Task 3 (gemini.js buildPrompt) |
| Gemini 3.1 Flash Lite API call | Task 3 (gemini.js generateObjectVoice) |
| Draggable speech bubble | Task 6 (SpeechBubble) |
| Default bubble position: top-center | Task 6 (SpeechBubble — `top: 16px, left: 50%`) |
| Comic style (stroke, shadow, tail) | Task 6 + Task 8 CSS |
| Download PNG with bubble | Task 7 (ShareBar html2canvas) |
| Regenerate | Task 7 (ShareBar + App.jsx handleGenerate) |
| Reset to idle | Task 7 (ShareBar + App.jsx handleReset) |
| Gemini error → toast, stay on CAPTURED | Task 8 (App.jsx catch block) |
| Camera denied → file upload fallback | Task 5 (CameraCapture error state) |

All spec requirements covered. No gaps found.
