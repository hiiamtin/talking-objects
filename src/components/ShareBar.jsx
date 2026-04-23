import html2canvas from 'html2canvas'

const TAIL = 16 // tail SVG max size — expand capture area to include it

export default function ShareBar({ stageRef, bubbleRef, imageBase64, onRegenerate, onReset, t }) {
  async function handleDownload() {
    const stage = stageRef.current
    const bubble = bubbleRef.current
    if (!stage || !bubble) return

    const stageRect = stage.getBoundingClientRect()
    const bubbleRect = bubble.getBoundingClientRect()

    // Expand bubble bounds to include absolute-positioned SVG tail
    const bLeft  = bubbleRect.left  - TAIL
    const bTop   = bubbleRect.top   - TAIL
    const bRight = bubbleRect.right + TAIL
    const bBot   = bubbleRect.bottom + TAIL

    // Union bounding box: image area ∪ bubble+tail area
    const minX = Math.min(stageRect.left,  bLeft)
    const minY = Math.min(stageRect.top,   bTop)
    const maxX = Math.max(stageRect.right, bRight)
    const maxY = Math.max(stageRect.bottom, bBot)
    const W = maxX - minX
    const H = maxY - minY

    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.width  = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Draw photo (only covers image area — outside stays transparent)
    const photoImg = new Image()
    photoImg.src = `data:image/jpeg;base64,${imageBase64}`
    await new Promise(r => { photoImg.onload = r })
    ctx.drawImage(photoImg,
      stageRect.left - minX,
      stageRect.top  - minY,
      stageRect.width,
      stageRect.height,
    )

    // Capture bubble with expanded clip to include tail overflow
    const bubbleCanvas = await html2canvas(bubble, {
      backgroundColor: null,
      scale: dpr,
      logging: false,
      x: -TAIL,           // start TAIL px to the left of element
      y: -TAIL,           // start TAIL px above element
      width:  bubble.offsetWidth  + TAIL * 2,
      height: bubble.offsetHeight + TAIL * 2,
    })

    // Draw at expanded position (offset by -TAIL since we captured extra area)
    ctx.drawImage(bubbleCanvas,
      bubbleRect.left - minX - TAIL,
      bubbleRect.top  - minY - TAIL,
      bubbleRect.width  + TAIL * 2,
      bubbleRect.height + TAIL * 2,
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
      <button className="btn-primary" onClick={handleDownload}>{t.save}</button>
      <button className="btn-secondary" onClick={onRegenerate}>{t.regenerate}</button>
      <button className="btn-ghost" onClick={onReset}>{t.retake}</button>
    </div>
  )
}
