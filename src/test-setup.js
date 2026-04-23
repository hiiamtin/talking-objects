import '@testing-library/jest-dom'

// Polyfill URL.createObjectURL and URL.revokeObjectURL for jsdom
if (typeof URL.createObjectURL === 'undefined') {
  let urlCounter = 0
  const urlMap = new Map()

  URL.createObjectURL = function (blob) {
    const id = `blob:${++urlCounter}`
    urlMap.set(id, blob)
    return id
  }

  URL.revokeObjectURL = function (url) {
    urlMap.delete(url)
  }
}

// Mock Image to support onload event for data URLs
const OriginalImage = global.Image
class MockImage extends OriginalImage {
  set src(url) {
    super.src = url
    // Simulate onload for data URLs (JPEG and PNG)
    if ((url.startsWith('data:image/') || url.startsWith('blob:')) && this.onload) {
      // Extract width/height from data URL if possible
      if (url.includes('canvas') || url.startsWith('data:')) {
        // Use setTimeout to simulate async behavior
        setTimeout(() => {
          if (this.onload) {
            // For data URLs, we can extract canvas-based dimensions
            // This is a simplified implementation
            if (this._width && this._height) {
              Object.defineProperty(this, 'naturalWidth', { value: this._width, writable: true })
              Object.defineProperty(this, 'naturalHeight', { value: this._height, writable: true })
            }
            this.onload()
          }
        }, 0)
      }
    }
  }
}

global.Image = MockImage
