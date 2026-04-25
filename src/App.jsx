// src/App.jsx
import { useState, useRef, useEffect } from 'react'
import CameraCapture from './components/CameraCapture'
import MoodSelector from './components/MoodSelector'
import LangToggle from './components/LangToggle'
import SpeechBubble from './components/SpeechBubble'
import BubbleStyleBar from './components/BubbleStyleBar'
import ShareBar from './components/ShareBar'
import { generateObjectVoice } from './lib/gemini'
import './App.css'

const UI = {
  th: {
    title:      '🗯️ ฉันอยากบอกว่า',
    generate:   '💬 คิดก่อนนะ!',
    retake:     '↩ ถ่ายใหม่',
    loading:    'กำลังคิดอยู่... 🤔',
    error:      'ลองใหม่นะ 🙏',
    save:       '💾 บันทึกรูป',
    regenerate: '🔄 พูดใหม่',
    openCamera: '📷 เปิดกล้อง',
    uploadFile: '📁 เลือกรูปจากเครื่อง',
    snapshot:   '📸 ถ่าย',
    cancel:     'ยกเลิก',
    or:         'หรือ',
    noCam:      'ไม่มีสิทธิ์กล้อง — อัพโหลดรูปได้เลย',
    flipFront:  'กล้องหน้า',
    flipBack:   'กล้องหลัง',
    moods:      { 'ตลก': 'ตลก', 'จิกกัด': 'จิกกัด', 'น่ารัก': 'น่ารัก', 'จริงจัง': 'จริงจัง' },
  },
  en: {
    title:      '🗯️ I want to say',
    generate:   '💬 Let me think!',
    retake:     '↩ Retake',
    loading:    'Thinking... 🤔',
    error:      'Try again 🙏',
    save:       '💾 Save image',
    regenerate: '🔄 Say again',
    openCamera: '📷 Open camera',
    uploadFile: '📁 Choose from device',
    snapshot:   '📸 Snap',
    cancel:     'Cancel',
    or:         'or',
    noCam:      'No camera access — upload instead',
    flipFront:  'Front cam',
    flipBack:   'Back cam',
    moods:      { 'ตลก': 'Funny', 'จิกกัด': 'Sarcastic', 'น่ารัก': 'Cute', 'จริงจัง': 'Serious' },
  },
}

export default function App() {
  const [appState, setAppState] = useState('idle')
  const [image, setImage]       = useState(null)
  const [mood, setMood]         = useState('ตลก')
  const [lang, setLang]         = useState('th')
  const [speech, setSpeech]     = useState('')
  const [error, setError]       = useState(null)
  const [tailDir, setTailDir]     = useState('auto')
  const [bubbleBg, setBubbleBg]   = useState('white')
  const [fontSize, setFontSize]   = useState('md')
  const [fontColor, setFontColor] = useState(null)
  const stageRef                = useRef(null)
  const bubbleRef               = useRef(null)
  const turnstileWidgetRef      = useRef(null)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const t = UI[lang]

  const TURNSTILE_SITE_KEY = '0x4AAAAAADDPoIedqeUBUsiM'
  const needsTurnstile = !import.meta.env.VITE_GEMINI_API_KEY

  useEffect(() => {
    if (appState !== 'captured' || !needsTurnstile) return
    setTurnstileToken(null)
    let widgetId = null
    const id = setTimeout(() => {
      if (window.turnstile) {
        widgetId = window.turnstile.render('#turnstile-captured', {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(null),
          'error-callback': () => setTurnstileToken(null),
        })
        turnstileWidgetRef.current = widgetId
      }
    }, 300)
    return () => {
      clearTimeout(id)
      if (turnstileWidgetRef.current !== null && window.turnstile) {
        window.turnstile.remove(turnstileWidgetRef.current)
        turnstileWidgetRef.current = null
      }
    }
  }, [appState])

  function handleCapture(base64) {
    setImage(base64)
    setAppState('captured')
  }

  async function handleGenerate() {
    if (needsTurnstile && !turnstileToken) return
    setAppState('generating')
    setError(null)
    try {
      const text = await generateObjectVoice(image, mood, lang, turnstileToken)
      setSpeech(text)
      setAppState('result')
    } catch (err) {
      setError(err.message || t.error)
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
        <h1 className="app-title">{t.title}</h1>
        {appState !== 'result' && (
          <LangToggle lang={lang} onLangChange={setLang} />
        )}
      </header>

      {appState === 'idle' && (
        <div className="idle-screen">
          <MoodSelector mood={mood} onMoodChange={setMood} moodLabels={t.moods} />
          <CameraCapture onCapture={handleCapture} t={t} />
        </div>
      )}

      {appState === 'captured' && (
        <div className="captured-screen">
          <img src={`data:image/jpeg;base64,${image}`} className="preview-img" alt="preview" />
          <MoodSelector mood={mood} onMoodChange={setMood} moodLabels={t.moods} />
          <div id="turnstile-captured" style={{ display: 'flex', justifyContent: 'center', margin: '0.75rem 0' }}></div>
          {error && <p className="toast-error">{error}</p>}
          <div className="action-row">
            <button className="btn-primary" onClick={handleGenerate} disabled={needsTurnstile && !turnstileToken}>{t.generate}</button>
            <button className="btn-ghost" onClick={handleReset}>{t.retake}</button>
          </div>
        </div>
      )}

      {appState === 'generating' && (
        <div className="generating-screen">
          <img src={`data:image/jpeg;base64,${image}`} className="preview-img loading" alt="processing" />
          <p className="loading-text">{t.loading}</p>
        </div>
      )}

      {appState === 'result' && (
        <div className="result-screen">
          <SpeechBubble
            image={image}
            speech={speech}
            containerRef={stageRef}
            bubbleRef={bubbleRef}
            tailDir={tailDir}
            bubbleBg={bubbleBg}
            fontSize={fontSize}
            fontColor={fontColor}
          />
          <BubbleStyleBar
            tailDir={tailDir}   onTailDir={setTailDir}
            bubbleBg={bubbleBg} onBubbleBg={setBubbleBg}
            fontSize={fontSize} onFontSize={setFontSize}
            fontColor={fontColor} onFontColor={setFontColor}
          />
          <ShareBar
            stageRef={stageRef}
            bubbleRef={bubbleRef}
            imageBase64={image}
            tailDir={tailDir}
            bubbleBg={bubbleBg}
            onRegenerate={handleGenerate}
            onReset={handleReset}
            t={t}
          />
        </div>
      )}
    </div>
  )
}
