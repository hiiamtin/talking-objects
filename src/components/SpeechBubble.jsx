import { useRef, useState, useEffect } from 'react'

export default function SpeechBubble({ image, speech, containerRef }) {
  const [pos, setPos] = useState({ x: 0, y: -10 })
  const [bubbleSize, setBubbleSize] = useState({ w: 200, h: 60 })
  const bubbleRef = useRef(null)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  // Re-measure bubble whenever speech changes (text height varies)
  useEffect(() => {
    if (bubbleRef.current) {
      setBubbleSize({
        w: bubbleRef.current.offsetWidth,
        h: bubbleRef.current.offsetHeight,
      })
    }
  }, [speech])

  function onPointerDown(e) {
    dragging.current = true
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragging.current) return
    const newX = e.clientX - dragStart.current.x
    const newY = e.clientY - dragStart.current.y

    const stage = containerRef.current
    const bubble = bubbleRef.current
    if (stage && bubble) {
      const sw = stage.offsetWidth
      const sh = stage.offsetHeight
      const bw = bubble.offsetWidth
      const bh = bubble.offsetHeight
      setPos({
        x: Math.max(bw / 2 - sw / 2, Math.min(sw / 2 - bw / 2, newX)),
        y: Math.max(-16, Math.min(sh - bh - 16, newY)),
      })
    } else {
      setPos({ x: newX, y: newY })
    }
  }

  function onPointerUp() {
    dragging.current = false
  }

  // Compute dynamic SVG tail pointing from bubble toward image center
  function computeTailPoints() {
    const stage = containerRef.current
    if (!stage) return null
    const sw = stage.offsetWidth
    const sh = stage.offsetHeight
    const { w: bw, h: bh } = bubbleSize

    // Bubble center in stage coords
    const bx = sw / 2 + pos.x
    const by = 16 + pos.y + bh / 2

    // Object = image center
    const ox = sw / 2
    const oy = sh / 2

    const dx = ox - bx
    const dy = oy - by
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 5) return null

    const ux = dx / dist  // unit vector toward object
    const uy = dy / dist

    // Find point on bubble edge nearest to object
    const tx = ux !== 0 ? (bw / 2) / Math.abs(ux) : Infinity
    const ty = uy !== 0 ? (bh / 2) / Math.abs(uy) : Infinity
    const t = Math.min(tx, ty)
    const edgeX = bx + ux * t
    const edgeY = by + uy * t

    // Perpendicular for triangle base width
    const halfBase = 9
    const px = -uy * halfBase
    const py = ux * halfBase

    return `${ox},${oy} ${edgeX + px},${edgeY + py} ${edgeX - px},${edgeY - py}`
  }

  const tailPoints = computeTailPoints()

  return (
    <div className="bubble-stage" ref={containerRef}>
      <img src={`data:image/jpeg;base64,${image}`} className="stage-image" alt="captured" />

      {/* Dynamic tail — SVG layer between image and bubble */}
      {tailPoints && (
        <svg
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 5,
            overflow: 'visible',
          }}
        >
          <polygon
            points={tailPoints}
            fill="white"
            stroke="#222"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      )}

      <div
        ref={bubbleRef}
        className="bubble-wrapper"
        style={{ transform: `translate(calc(-50% + ${pos.x}px), ${pos.y}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="comic-bubble">
          <p className="bubble-text">{speech}</p>
        </div>
        {/* static .bubble-tail removed — replaced by dynamic SVG above */}
      </div>
    </div>
  )
}
