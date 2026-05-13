import { useEffect, useMemo, useState } from 'react'
import CameraCapture from './components/CameraCapture'
import LangToggle from './components/LangToggle'
import { generateBlessingFromImage } from './lib/gemini'
import { getRandomQuote, moods } from './lib/quotes'
import './App.css'

const labels = {
  th: {
    title: 'SCB TechX 5th Greeting Booth', consent: 'ยินยอม', start: 'เริ่มใช้งาน', modeA: 'สุ่มข้อความ', modeB: 'AI จากรูป',
    kiosk: 'โหมด Kiosk', gen: 'สร้างคำอวยพร', download: 'ดาวน์โหลด', reset: 'เริ่มใหม่', gallery: 'แกลเลอรีหน้างาน',
    consentText: 'ฉันยอมรับเงื่อนไขการใช้งานและการประมวลผลข้อมูลรูปภาพ', allowAi: 'ยินยอมส่งรูปให้ AI ประมวลผล (เฉพาะโหมด AI)',
  },
  en: {
    title: 'SCB TechX 5th Greeting Booth', consent: 'Consent', start: 'Start', modeA: 'Random message', modeB: 'AI from photo',
    kiosk: 'Kiosk mode', gen: 'Generate blessing', download: 'Download', reset: 'Restart', gallery: 'Event gallery',
    consentText: 'I accept terms and consent to image data processing', allowAi: 'Allow AI image processing (required for AI mode)',
  },
}

const FRAMES = ['💜 Classic', '✨ Minimal', '🎉 Party', '🚀 Future', '🌈 Cute', '🏆 Premium']

export default function App() {
  const [lang, setLang] = useState('th')
  const t = labels[lang]
  const [consented, setConsented] = useState(false)
  const [allowAi, setAllowAi] = useState(false)
  const [mode, setMode] = useState('random')
  const [kiosk, setKiosk] = useState(false)
  const [image, setImage] = useState(null)
  const [mood, setMood] = useState(moods[0])
  const [frame, setFrame] = useState(FRAMES[0])
  const [text, setText] = useState('')
  const [gallery, setGallery] = useState(() => JSON.parse(localStorage.getItem('gallery') || '[]'))

  useEffect(() => {
    localStorage.setItem('gallery', JSON.stringify(gallery.slice(0, 20)))
  }, [gallery])

  useEffect(() => {
    if (!kiosk) return
    const timer = setTimeout(() => resetAll(), 45000)
    return () => clearTimeout(timer)
  }, [kiosk, image, text, mode, mood, frame])

  const canStart = consented && (mode === 'random' || allowAi)

  async function generate() {
    if (mode === 'random') setText(getRandomQuote(lang, mood))
    else setText(await generateBlessingFromImage(image, mood, lang))
  }

  const downloadHref = useMemo(() => {
    const payload = `${frame}\n${text}`
    return `data:text/plain;charset=utf-8,${encodeURIComponent(payload)}`
  }, [frame, text])

  function saveToGallery() {
    setGallery(prev => [{ id: Date.now(), frame, text, image }, ...prev])
  }

  function resetAll() { setImage(null); setText('') }

  return <div className="app">
    <header className="app-header"><h1>{t.title}</h1><LangToggle lang={lang} onLangChange={setLang} /></header>
    <button className="btn-ghost" onClick={() => setKiosk(v => !v)}>{t.kiosk}: {kiosk ? 'ON' : 'OFF'}</button>

    {!consented && <section className="card"><h3>{t.consent}</h3><p>Retention config: 1 day (for gallery display).</p>
      <label><input type="checkbox" onChange={e => setConsented(e.target.checked)} /> {t.consentText}</label>
      <label><input type="checkbox" onChange={e => setAllowAi(e.target.checked)} /> {t.allowAi}</label></section>}

    {consented && !image && <section className="card">
      <div className="row"><button className={mode==='random'?'btn-primary':'btn-secondary'} onClick={()=>setMode('random')}>{t.modeA}</button>
      <button className={mode==='ai'?'btn-primary':'btn-secondary'} onClick={()=>setMode('ai')}>{t.modeB}</button></div>
      <div className="row">{moods.map(m => <button key={m} className="btn-secondary" onClick={()=>setMood(m)}>{m}</button>)}</div>
      <div className="row">{FRAMES.map(f => <button key={f} className="btn-ghost" onClick={()=>setFrame(f)}>{f}</button>)}</div>
      {(mode === 'random' || canStart) && <CameraCapture onCapture={setImage} t={{ openCamera:'Open camera', uploadFile:'Upload', snapshot:'Snap', cancel:'Cancel', or:'or' }} />}
    </section>}

    {image && <section className="card"><img className="preview-img" src={`data:image/jpeg;base64,${image}`} />
      <button className="btn-primary" onClick={generate}>{t.gen}</button>
      {!!text && <><p>{frame}</p><textarea maxLength={120} value={text} onChange={e=>setText(e.target.value)} />
        <div className="row"><a className="btn-secondary" href={downloadHref} download="greeting.txt">{t.download}</a>
        <button className="btn-secondary" onClick={saveToGallery}>Add to Gallery</button><button className="btn-ghost" onClick={resetAll}>{t.reset}</button></div></>}</section>}

    <section className="card"><h3>{t.gallery}</h3>{gallery.map(item => <div key={item.id} className="gallery-item"><span>{item.frame}</span><p>{item.text}</p></div>)}</section>
  </div>
}
