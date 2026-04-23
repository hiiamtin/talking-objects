import { useRef, useState } from 'react'

const BG_CONFIG = {
  white:       { bg: 'white',           color: '#111',  border: '#222',  tailFill: 'white',           tailStroke: '#222'  },
  black:       { bg: '#222',            color: 'white', border: '#222',  tailFill: '#222',            tailStroke: '#222'  },
  transparent: { bg: 'rgba(0,0,0,0)',   color: 'white', border: 'white', tailFill: 'rgba(0,0,0,0)',   tailStroke: 'white' },
}

const FLEX = {
  bottom: { flexDirection: 'column',         alignItems: 'center' },
  top:    { flexDirection: 'column-reverse',  alignItems: 'center' },
  left:   { flexDirection: 'row-reverse',     alignItems: 'center' },
  right:  { flexDirection: 'row',             alignItems: 'center' },
}

function Tail({ dir, fill, stroke }) {
  const p = { fill, stroke, strokeWidth: '2.5', strokeLinejoin: 'round' }
  if (dir === 'bottom') return <svg width="20" height="14" style={{ display: 'block' }}><polygon points="0,0 20,0 10,14" {...p} /></svg>
  if (dir === 'top')    return <svg width="20" height="14" style={{ display: 'block' }}><polygon points="0,14 20,14 10,0" {...p} /></svg>
  if (dir === 'left')   return <svg width="14" height="20" style={{ display: 'block' }}><polygon points="14,0 14,20 0,10" {...p} /></svg>
  if (dir === 'right')  return <svg width="14" height="20" style={{ display: 'block' }}><polygon points="0,0 0,20 14,10" {...p} /></svg>
  return null
}

export default function SpeechBubble({ image, speech, containerRef, bubbleRef, tailDir = 'bottom', bubbleBg = 'white' }) {
  const [pos, setPos] = useState({ x: 0, y: -10 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const cfg = BG_CONFIG[bubbleBg] ?? BG_CONFIG.white

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

  function onPointerUp() { dragging.current = false }

  return (
    <div className="bubble-stage" ref={containerRef}>
      <img src={`data:image/jpeg;base64,${image}`} className="stage-image" alt="captured" />

      <div
        ref={bubbleRef}
        className="bubble-wrapper"
        style={{
          transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)`,
          display: 'flex',
          ...FLEX[tailDir],
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="comic-bubble"
          style={{
            background: cfg.bg,
            color: cfg.color,
            borderColor: cfg.border,
          }}
        >
          <p className="bubble-text" style={{ color: cfg.color }}>{speech}</p>
        </div>
        <Tail dir={tailDir} fill={cfg.tailFill} stroke={cfg.tailStroke} />
      </div>
    </div>
  )
}
