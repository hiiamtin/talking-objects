import { useRef, useState } from 'react'

export default function SpeechBubble({ image, speech, containerRef }) {
  const [pos, setPos] = useState({ x: 0, y: -10 })
  const bubbleRef = useRef(null)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })

  function onPointerDown(e) {
    dragging.current = true
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!dragging.current) return

    const newX = e.clientX - dragStart.current.x
    const newY = e.clientY - dragStart.current.y

    // Clamp bubble inside the stage container so it saves correctly
    const stage = containerRef.current
    const bubble = bubbleRef.current
    if (stage && bubble) {
      const sw = stage.offsetWidth
      const sh = stage.offsetHeight
      const bw = bubble.offsetWidth
      const bh = bubble.offsetHeight
      const minX = bw / 2 - sw / 2        // left edge flush
      const maxX = sw / 2 - bw / 2        // right edge flush
      const minY = -16                     // top CSS offset
      const maxY = sh - bh - 16           // bottom edge flush
      setPos({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      })
    } else {
      setPos({ x: newX, y: newY })
    }
  }

  function onPointerUp() {
    dragging.current = false
  }

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
        <div className="comic-bubble">
          <p className="bubble-text">{speech}</p>
        </div>
        <div className="bubble-tail" />
      </div>
    </div>
  )
}
