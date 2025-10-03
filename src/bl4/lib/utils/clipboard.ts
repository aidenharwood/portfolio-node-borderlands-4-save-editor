export function copyToClipboard(text?: string): void {
  if (!text) return

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      // Use modern clipboard API where available
      navigator.clipboard.writeText(text).catch((err) => {
        console.warn('Clipboard write failed:', err)
      })
      return
    }

    // Fallback for older browsers
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.warn('Fallback clipboard copy failed:', err)
      }
      document.body.removeChild(textarea)
    }
  } catch (error) {
    console.warn('copyToClipboard error:', error)
  }
}
