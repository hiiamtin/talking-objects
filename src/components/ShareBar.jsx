import html2canvas from 'html2canvas'

export default function ShareBar({ stageRef, bubbleRef, imageBase64, onRegenerate, onReset, t }) {
  async function handleDownload() {
    const stage = stageRef.current
    const bubble = bubbleRef.current
    if (!stage || !bubble) return

    const stageRect = stage.getBoundingClientRect()
    const bubbleRect = bubble.getBoundingClientRect()

    // Union bounding box covering image + bubble (even if bubble is outside)
    const minX = Math.min(stageRect.left, bubbleRect.left)
    const minY = Math.min(stageRect.top, bubbleRect.top)
    const maxX = Math.max(stageRect.right, bubbleRect.right)
    const maxY = Math.max(stageRect.bottom, bubbleRect.bottom)
    const W = maxX - minX
    const H = maxY - minY

    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Draw the photo (only covers image area — outside is transparent)
    const photoImg = new Image()
    photoImg.src = `data:image/jpeg;base64,${imageBase64}`
    await new Promise(r => { photoImg.onload = r })
    ctx.drawImage(photoImg,
      stageRect.left - minX,
      stageRect.top - minY,
      stageRect.width,
      stageRect.height,
    )

    // Capture bubble (with transparent background)
    const bubbleCanvas = await html2canvas(bubble, {
      backgroundColor: null,
      scale: dpr,
      logging: false,
    })
    ctx.drawImage(bubbleCanvas,
      bubbleRect.left - minX,
      bubbleRect.top - minY,
      bubbleRect.width,
      bubbleRect.height,
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
