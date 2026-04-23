import { useRef, useState, useEffect } from 'react'
import { resizeImage } from '../lib/imageUtils'

const isMobile = navigator.maxTouchPoints > 0

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isMobile) return
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        setStream(s)
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => setError('camera_denied'))
    return () => stream?.getTracks().forEach(t => t.stop())
  }, [])

  async function handleSnapshot() {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async blob => {
      const file = new File([blob], 'snap.jpg', { type: 'image/jpeg' })
      const base64 = await resizeImage(file, 1024, 0.8)
      onCapture(base64)
    }, 'image/jpeg')
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const base64 = await resizeImage(file, 1024, 0.8)
    onCapture(base64)
  }

  // Mobile: show camera feed
  if (isMobile && !error) {
    return (
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        <button className="capture-btn" onClick={handleSnapshot}>📸 ถ่าย</button>
      </div>
    )
  }

  // Desktop or camera denied: show file upload
  return (
    <div className="upload-container">
      {error && <p className="error-hint">ไม่มีสิทธิ์กล้อง — อัพโหลดรูปได้เลย</p>}
      <label className="upload-label">
        <span>📁 เลือกรูป</span>
        <input type="file" accept="image/*" onChange={handleFileChange} hidden />
      </label>
    </div>
  )
}
