/**
 * Resize image file to max maxPx on longest side, return base64 JPEG string (no data: prefix)
 */
export function resizeImage(file, maxPx = 1024, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img
      const scale = Math.min(1, maxPx / Math.max(width, height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve(dataUrl.split(',')[1]) // strip "data:image/jpeg;base64,"
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Read File as base64 string (no data: prefix). No resizing.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
