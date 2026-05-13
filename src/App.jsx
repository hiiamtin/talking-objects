import { useEffect, useMemo, useState } from 'react'
import CameraCapture from './components/CameraCapture'
import LangToggle from './components/LangToggle'
import { generateBlessingFromImage } from './lib/gemini'
import { getRandomQuote, moods } from './lib/quotes'
import './App.css'

const labels = {
  th: {
    title: 'SCB TechX 5th Greeting Booth', consent: 'ความยินยอม', agree: 'ฉันยอมรับเงื่อนไข', allowAi: 'ยินยอมส่งรูปให้ AI',
    continue: 'ฉันยินยอม', modeA: 'สุ่มข้อความ', modeB: 'AI จากรูป', gen: 'สร้างคำอวยพร', download: 'ดาวน์โหลด',
    reset: 'เริ่มใหม่', gallery: 'แกลเลอรีหน้างาน', kiosk: 'โหมด Kiosk', addGallery: 'เพิ่มเข้า Gallery', needAiConsent: 'โหมด AI ต้องยินยอมส่งรูปให้ AI ก่อน',
  },
  en: {
    title: 'SCB TechX 5th Greeting Booth', consent: 'Consent', agree: 'I accept the terms', allowAi: 'Allow AI image processing',
    continue: 'I Consent', modeA: 'Random message', modeB: 'AI from photo', gen: 'Generate blessing', download: 'Download',
    reset: 'Restart', gallery: 'Event gallery', kiosk: 'Kiosk mode', addGallery: 'Add to Gallery', needAiConsent: 'AI mode requires AI consent',
  },
}
const FRAMES = ['💜 Classic', '✨ Minimal', '🎉 Party', '🚀 Future', '🌈 Cute', '🏆 Premium']
const CONSENT_KEY = 'scb_consent_v1'

export default function App() {
  const [lang, setLang] = useState('th')
  const t = labels[lang]
  const [consented, setConsented] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [allowAi, setAllowAi] = useState(false)
  const [mode, setMode] = useState('random')
  const [kiosk, setKiosk] = useState(false)
  const [image, setImage] = useState(null)
  const [mood, setMood] = useState(moods[0])
  const [frame, setFrame] = useState(FRAMES[0])
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [gallery, setGallery] = useState(() => JSON.parse(localStorage.getItem('gallery') || '[]'))

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null')
    if (saved?.consented) {
      setConsented(true)
      setAgreeTerms(!!saved.agreeTerms)
      setAllowAi(!!saved.allowAi)
    }
  }, [])

  useEffect(() => localStorage.setItem('gallery', JSON.stringify(gallery.slice(0, 40))), [gallery])

  useEffect(() => {
    if (!kiosk) return
    const timer = setTimeout(() => resetAll(true), 45000)
    return () => clearTimeout(timer)
  }, [kiosk, image, text, mode, mood, frame])

  async function generate() {
    setError('')
    try {
      const next = mode === 'random' ? getRandomQuote(lang, mood) : await generateBlessingFromImage(image, mood, lang)
      setText(next)
    } catch (e) {
      setError(e.message)
    }
  }

  function onConsentSubmit() {
    if (!agreeTerms) return
    const payload = { consented: true, agreeTerms, allowAi, createdAt: Date.now(), retentionDays: 1 }
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload))
    setConsented(true)
  }

  const canCapture = mode === 'random' || allowAi

  function saveToGallery() { if (image && text) setGallery(prev => [{ id: Date.now(), frame, text, image }, ...prev]) }
  function resetAll(keepConsent = false) {
    setImage(null); setText(''); setError(''); setMood(moods[0]); setFrame(FRAMES[0]); setMode('random')
    if (!keepConsent) return
    setConsented(false)
    setAgreeTerms(false)
    setAllowAi(false)
    localStorage.removeItem(CONSENT_KEY)
  }

  const downloadHref = useMemo(() => `data:text/plain;charset=utf-8,${encodeURIComponent(`${frame}\n${text}`)}`, [frame, text])

  return <div className="app">
    <header className="app-header"><h1 className="app-title">{t.title}</h1><LangToggle lang={lang} onLangChange={setLang} /></header>
    <button className="btn-ghost" onClick={() => setKiosk(v => !v)}>{t.kiosk}: {kiosk ? 'ON' : 'OFF'}</button>

    {!consented && <section className="card"><h3>{t.consent}</h3>
      <p>Retention config: 1 day (for gallery display in event).</p>
      <label><input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} /> {t.agree}</label>
      <label><input type="checkbox" checked={allowAi} onChange={e => setAllowAi(e.target.checked)} /> {t.allowAi}</label>
      <button className="btn-primary" onClick={onConsentSubmit} disabled={!agreeTerms}>{t.continue}</button>
    </section>}

    {consented && !image && <section className="card">
      <div className="row"><button type="button" className={mode==='random'?'btn-primary':'btn-secondary'} onClick={()=>setMode('random')}>{t.modeA}</button>
      <button type="button" className={mode==='ai'?'btn-primary':'btn-secondary'} onClick={()=>setMode('ai')}>{t.modeB}</button></div>
      <div className="row">{moods.map(m => <button type="button" key={m} className={`chip ${mood===m?'active':''}`} onClick={()=>setMood(m)}>{m}</button>)}</div>
      <div className="row">{FRAMES.map(f => <button type="button" key={f} className={`chip ${frame===f?'active':''}`} onClick={()=>setFrame(f)}>{f}</button>)}</div>
      {!canCapture && <p className="error-hint">{t.needAiConsent}</p>}
      {canCapture && <CameraCapture onCapture={setImage} t={{ openCamera:'📷 Open camera', uploadFile:'📁 Upload image', snapshot:'📸 Snap', cancel:'Cancel', or:'or', flipFront:'Front', flipBack:'Back', noCam:'No camera permission' }} />}
    </section>}

    {image && <section className="card"><img alt="preview" className="preview-img" src={`data:image/jpeg;base64,${image}`} />
      <button className="btn-primary" onClick={generate}>{t.gen}</button>
      {error && <p className="toast-error">{error}</p>}
      {!!text && <><p>{frame}</p><textarea maxLength={120} value={text} onChange={e=>setText(e.target.value)} />
        <div className="row"><a className="btn-secondary" href={downloadHref} download="greeting.txt">{t.download}</a>
        <button className="btn-secondary" onClick={saveToGallery}>{t.addGallery}</button><button className="btn-ghost" onClick={() => resetAll(false)}>{t.reset}</button></div></>}</section>}

    <section className="card"><h3>{t.gallery}</h3>{gallery.map(item => <div key={item.id} className="gallery-item"><span>{item.frame}</span><p>{item.text}</p></div>)}</section>
  </div>
}
