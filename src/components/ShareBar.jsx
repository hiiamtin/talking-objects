import html2canvas from 'html2canvas'

export default function ShareBar({ stageRef, onRegenerate, onReset, t }) {
  async function handleDownload() {
    const canvas = await html2canvas(stageRef.current, { useCORS: true })
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
