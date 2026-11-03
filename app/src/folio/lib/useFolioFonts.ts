import { useEffect } from 'react'
import '../styles/fonts.css'

// Ljusbord's faces are self-hosted: fonts.css ships with this module, so Folio
// asks Google for nothing. A face loads on first use; warming every file up
// front keeps a later screen (a key cap, an italic) from swapping mid-read.
const FACES = [
  '1em "Atkinson Hyperlegible Next"',
  'italic 1em "Atkinson Hyperlegible Next"',
  '1em "Atkinson Hyperlegible Mono"',
  '1em "Schibsted Grotesk"',
]

export function useFolioFonts() {
  useEffect(() => {
    if (!('fonts' in document)) return
    for (const face of FACES) void document.fonts.load(face).catch(() => {})
  }, [])
}
