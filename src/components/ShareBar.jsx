import html2canvas from 'html2canvas'

// Mirror of BG_CONFIG in SpeechBubble — needed to get tail colors
const TAIL_COLORS = {
  white:       { fill: 'white',         stroke: '#222222' },
  black:       { fill: '#222222',       stroke: '#333333' },
  transparent: { fill: 'rgba(0,0,0,0)', stroke: '#ffffff' },
}

// Compute auto tail direction from viewport rects
function autoDir(bubbleRect, stageRect) {
  const bc = { x: bubbleRect.left + bubbleRect.width  / 2, y: bubbleRect.top + bubbleRect.height / 2 }
  const ic = { x: stageRect.left  + stageRect.width   / 2, y: stageRect.top  + stageRect.height  / 2 }
  const dx = ic.x - bc.x
  const dy = ic.y - bc.y
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top')
}

// Draw tail triangle directly on canvas (bypasses html2canvas SVG limitation)
// bx/by = top-left of bubbleWrapper in canvas coords
// bw/bh = wrapper dimensions (comic-bubble + 16px margin on each side)
function drawTail(ctx, dir, bx, by, bw, bh, fill, stroke) {
  const M = 16  // margin between wrapper edge and comic-bubble
  const cx = bx + bw / 2
  const cy = by + bh / 2

  let pts
  if (dir === 'bottom') pts = [[cx - 10, by + bh - M], [cx + 10, by + bh - M], [cx, by + bh - 2]]
  if (dir === 'top')    pts = [[cx - 10, by + M],       [cx + 10, by + M],       [cx, by + 2]]
  if (dir === 'left')   pts = [[bx + M, cy - 10],       [bx + M, cy + 10],       [bx + 2, cy]]
  if (dir === 'right')  pts = [[bx + bw - M, cy - 10],  [bx + bw - M, cy + 10],  [bx + bw - 2, cy]]
  if (!pts) return

  ctx.beginPath()
  ctx.moveTo(...pts[0])
  ctx.lineTo(...pts[1])
  ctx.lineTo(...pts[2])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = stroke
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.stroke()
}

export default function ShareBar({ stageRef, bubbleRef, imageBase64, tailDir, bubbleBg, onRegenerate, onReset, t }) {
  async function handleDownload() {
    const stage = stageRef.current
    const bubble = bubbleRef.current
    if (!stage || !bubble) return

    const stageRect  = stage.getBoundingClientRect()
    const bubbleRect = bubble.getBoundingClientRect()

    const minX = Math.min(stageRect.left,   bubbleRect.left)
    const minY = Math.min(stageRect.top,    bubbleRect.top)
    const maxX = Math.max(stageRect.right,  bubbleRect.right)
    const maxY = Math.max(stageRect.bottom, bubbleRect.bottom)

    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.width  = Math.round((maxX - minX) * dpr)
    canvas.height = Math.round((maxY - minY) * dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // 1. Draw photo
    const photoImg = new Image()
    photoImg.src = `data:image/jpeg;base64,${imageBase64}`
    await new Promise(r => { photoImg.onload = r })
    ctx.drawImage(photoImg, stageRect.left - minX, stageRect.top - minY, stageRect.width, stageRect.height)

    // 2. Capture bubble box via html2canvas (renders comic-bubble text+bg, but NOT SVG tail)
    const bubbleCanvas = await html2canvas(bubble, { backgroundColor: null, scale: dpr, logging: false })
    ctx.drawImage(bubbleCanvas, bubbleRect.left - minX, bubbleRect.top - minY, bubbleRect.width, bubbleRect.height)

    // 3. Draw tail manually — html2canvas doesn't render SVG, so we draw it ourselves
    const effectiveDir = tailDir === 'auto' ? autoDir(bubbleRect, stageRect) : tailDir
    const { fill, stroke } = TAIL_COLORS[bubbleBg] ?? TAIL_COLORS.white
    drawTail(ctx, effectiveDir,
      bubbleRect.left - minX,
      bubbleRect.top  - minY,
      bubbleRect.width,
      bubbleRect.height,
      fill, stroke,
    )

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
      <button className="btn-primary"  onClick={handleDownload}>{t.save}</button>
      <button className="btn-secondary" onClick={onRegenerate}>{t.regenerate}</button>
      <button className="btn-ghost"    onClick={onReset}>{t.retake}</button>
    </div>
  )
}
