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
