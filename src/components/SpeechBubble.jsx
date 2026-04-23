import { useRef, useState } from 'react'

const BG_CONFIG = {
  white:       { bg: 'white',         defaultColor: '#111', border: '#222', tailFill: 'white',         tailStroke: '#222'  },
  black:       { bg: '#222',          defaultColor: 'white', border: '#222', tailFill: '#222',          tailStroke: '#333'  },
  transparent: { bg: 'rgba(0,0,0,0)', defaultColor: 'white', border: 'white', tailFill: 'rgba(0,0,0,0)', tailStroke: 'white' },
}

const FONT_SIZES = { sm: '0.72rem', md: '0.9rem', lg: '1.15rem', xl: '1.5rem' }

// Tail as absolutely-positioned SVG outside the comic-bubble box
function Tail({ dir, fill, stroke }) {
  const p = { fill, stroke, strokeWidth: '2.5', strokeLinejoin: 'round' }
  const base = { position: 'absolute', pointerEvents: 'none', display: 'block' }

  if (dir === 'bottom') return (
    <svg width="20" height="14"
      style={{ ...base, bottom: -13, left: '50%', transform: 'translateX(-50%)' }}>
      <polygon points="0,0 20,0 10,14" {...p} />
    </svg>
  )
  if (dir === 'top') return (
    <svg width="20" height="14"
      style={{ ...base, top: -13, left: '50%', transform: 'translateX(-50%)' }}>
      <polygon points="0,14 20,14 10,0" {...p} />
    </svg>
  )
  if (dir === 'left') return (
    <svg width="14" height="20"
      style={{ ...base, left: -13, top: '50%', transform: 'translateY(-50%)' }}>
      <polygon points="14,0 14,20 0,10" {...p} />
    </svg>
  )
  if (dir === 'right') return (
    <svg width="14" height="20"
      style={{ ...base, right: -13, top: '50%', transform: 'translateY(-50%)' }}>
      <polygon points="0,0 0,20 14,10" {...p} />
    </svg>
  )
  return null
}

// Compute which direction tail should point for "auto" mode
function computeAutoDir(pos, containerRef, bubbleRef) {
  const stage = containerRef?.current
  const bubble = bubbleRef?.current
  if (!stage || !bubble) return 'bottom'

  const sw = stage.offsetWidth
  const sh = stage.offsetHeight
  const bh = bubble.offsetHeight || 60

  // Vector from bubble center → image center
  const dx = -pos.x                             // >0 = image is RIGHT of bubble
  const dy = sh / 2 - (16 + pos.y + bh / 2)    // >0 = image is BELOW bubble

  return Math.abs(dx) > Math.abs(dy)
    ? (dx > 0 ? 'right' : 'left')
    : (dy > 0 ? 'bottom' : 'top')
}

export default function SpeechBubble({
  image, speech, containerRef, bubbleRef,
  tailDir = 'auto', bubbleBg = 'white',
  fontSize = 'md', fontColor = null,
}) {
  const [pos, setPos] = useState({ x: 0, y: -10 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const cfg = BG_CONFIG[bubbleBg] ?? BG_CONFIG.white
  const textColor = fontColor ?? cfg.defaultColor
  const effectiveDir = tailDir === 'auto'
    ? computeAutoDir(pos, containerRef, bubbleRef)
    : tailDir

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
        style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div
          className="comic-bubble"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          <p className="bubble-text" style={{ color: textColor, fontSize: FONT_SIZES[fontSize] }}>
            {speech}
          </p>
        </div>
        <Tail dir={effectiveDir} fill={cfg.tailFill} stroke={cfg.tailStroke} />
      </div>
    </div>
  )
}
