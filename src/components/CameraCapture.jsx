import { useRef, useState, useEffect } from 'react'
import { resizeImage } from '../lib/imageUtils'

const isMobile = navigator.maxTouchPoints > 0

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraActive, setCameraActive] = useState(isMobile) // mobile: auto-start
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!cameraActive) return
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: isMobile ? 'environment' : 'user' } })
      .then(s => {
        streamRef.current = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => {
        setError('camera_denied')
        setCameraActive(false)
      })
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [cameraActive])

  async function handleSnapshot() {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async blob => {
      const file = new File([blob], 'snap.jpg', { type: 'image/jpeg' })
      const base64 = await resizeImage(file, 1024, 0.8)
      // stop camera after snapshot
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setCameraActive(false)
      onCapture(base64)
    }, 'image/jpeg')
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const base64 = await resizeImage(file, 1024, 0.8)
    onCapture(base64)
  }

  // Camera feed active
  if (cameraActive) {
    return (
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline className="camera-feed" />
        <div className="camera-actions">
          <button className="capture-btn" onClick={handleSnapshot}>📸 ถ่าย</button>
          <button className="btn-ghost" onClick={() => setCameraActive(false)}>ยกเลิก</button>
        </div>
      </div>
    )
  }

  // Idle: show options
  return (
    <div className="upload-container">
      {error && <p className="error-hint">ไม่มีสิทธิ์กล้อง — อัพโหลดรูปได้เลย</p>}
      <button className="btn-primary" onClick={() => { setError(null); setCameraActive(true) }}>
        📷 เปิดกล้อง
      </button>
      <div className="divider-text">หรือ</div>
      <label className="upload-label">
        <span>📁 เลือกรูปจากเครื่อง</span>
        <input type="file" accept="image/*" onChange={handleFileChange} hidden />
      </label>
    </div>
  )
}
