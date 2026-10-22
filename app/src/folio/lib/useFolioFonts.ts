import { useEffect } from 'react'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap'

export function useFolioFonts() {
  useEffect(() => {
    if (document.querySelector('link[data-folio-fonts]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = FONTS
    link.dataset.folioFonts = ''
    document.head.appendChild(link)
    // Keep the sheet cached across preview toggles; it has no global selectors.
  }, [])
}
