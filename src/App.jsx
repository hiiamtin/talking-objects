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
