// QuestionFigure — render a parser-extracted figure inline inside a
// quant question. Two source kinds:
//
//  - 'svg' (XYZ/KVA/NOG vector diagrams): inlined as HTML so
//    `stroke="currentColor"` cascades for dark-mode theming. Compact
//    (a few KB each), themable, animatable.
//  - 'raster' (DTK figure pages): a full-page JPEG render of the
//    printed source. DTK diagrams/tables/maps don't reasonably
//    vectorize, so we ship them as JPEG. Loaded as <img>, with a
//    tap-to-zoom modal because the source pages are dense.
//
// Layout discipline: the wrapper reserves space using `aspect-ratio`
// from the parser metadata. This eliminates layout-shift while the
// fetch is in flight — the option list below the figure stays put.

import { useEffect, useRef, useState } from 'react'

import type { QuestionFigureMeta } from '@/data/questions'

type Props = {
  figure: QuestionFigureMeta
}

const svgCache = new Map<string, Promise<string>>()

function fetchSvg(src: string): Promise<string> {
  let p = svgCache.get(src)
  if (!p) {
    p = fetch(`/${src}`).then((r) => {
      if (!r.ok) throw new Error(`figure fetch failed: ${r.status}`)
      return r.text()
    })
    svgCache.set(src, p)
  }
  return p
}

export function QuestionFigure({ figure }: Props) {
  return figure.kind === 'raster' ? <RasterFigure figure={figure} /> : <SvgFigure figure={figure} />
}

function SvgFigure({ figure }: Props) {
  const [svg, setSvg] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    setSvg(null)
    fetchSvg(figure.src)
      .then((text) => {
        if (mounted.current) setSvg(text)
      })
      .catch(() => {
        // Silent fall-through. The aspect-reserved box stays empty;
        // the question is still answerable from text alone.
      })
    return () => {
      mounted.current = false
    }
  }, [figure.src])

  // Two competing constraints:
  //   - we cap the figure's height (MAX_H) so a tall narrow figure
  //     doesn't eat the entire viewport
  //   - we cap the figure's width to the column (the artboard's inner
  //     width minus the 22px gutters used by prompt + options)
  // The natural-at-MAX_H width is `ratio * MAX_H`; we pick whichever
  // of (column, naturalWidth) is smaller. Aspect-ratio then derives
  // the height from that resolved width — so wide figures stay short
  // and tall figures stay narrow, both fully proportional.
  const ratio = figure.aspect_ratio
  const MAX_H = 240
  const naturalWidth = ratio * MAX_H

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label="Förstora figur"
        data-testid="question-figure"
        style={{
          display: 'block',
          margin: '0 auto 18px',
          width: `min(${naturalWidth.toFixed(1)}px, calc(100% - 44px))`,
          aspectRatio: String(ratio),
          background: 'var(--panel)',
          border: '1px solid var(--hairline)',
          borderRadius: 'calc(var(--radius) * 0.5)',
          color: 'var(--ink)',
          padding: 12,
          cursor: 'zoom-in',
          opacity: svg ? 1 : 0.35,
          transition: 'opacity 240ms ease',
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: parser-emitted SVG, no user input
        dangerouslySetInnerHTML={svg ? { __html: wrapForFit(svg) } : undefined}
      />
      {zoomed && <FigureModal svg={svg} onClose={() => setZoomed(false)} />}
    </>
  )
}

// DTK figure pages: dense JPEG renders. Show at full column width with
// the aspect-reserved box (no height cap — the figure IS the question,
// readers WILL scroll to take it in). Tap-to-zoom opens an unconstrained
// modal so axis labels and table digits stay legible.
function RasterFigure({ figure }: Props) {
  const [zoomed, setZoomed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ratio = figure.aspect_ratio

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label="Förstora figur"
        data-testid="question-figure"
        style={{
          display: 'block',
          margin: '0 auto 18px',
          width: 'calc(100% - 44px)',
          aspectRatio: String(ratio),
          background: 'var(--panel)',
          border: '1px solid var(--hairline)',
          borderRadius: 'calc(var(--radius) * 0.5)',
          padding: 0,
          overflow: 'hidden',
          cursor: 'zoom-in',
          opacity: loaded ? 1 : 0.35,
          transition: 'opacity 240ms ease',
        }}
      >
        <img
          src={`/${figure.src}`}
          alt="Figur"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </button>
      {zoomed && <RasterModal src={figure.src} onClose={() => setZoomed(false)} />}
    </>
  )
}

function RasterModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Förstorad figur"
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in oklch, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
        cursor: 'zoom-out',
        // The figure-page renders are large (1700×1200+); allow the
        // user to scroll if it exceeds the viewport at native size.
        overflow: 'auto',
      }}
    >
      <img
        src={`/${src}`}
        alt="Figur, förstorad"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(96vw, 1400px)',
          maxHeight: '94vh',
          width: 'auto',
          height: 'auto',
          background: 'var(--panel)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius)',
          padding: 12,
          cursor: 'zoom-out',
        }}
      />
    </div>
  )
}

// Inject `width="100%" height="100%"` on the root <svg> so it scales
// to fill the wrapper. The parser emits viewBox + preserveAspectRatio
// already, so adding sizing attrs is enough — no transform needed.
function wrapForFit(rawSvg: string): string {
  return rawSvg.replace(
    /<svg([^>]*)>/,
    '<svg$1 width="100%" height="100%" style="display:block;color:inherit">',
  )
}

function FigureModal({ svg, onClose }: { svg: string | null; onClose: () => void }) {
  // ESC to dismiss — modal pattern users already know from Cmd+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Förstorad figur"
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in oklch, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 24,
        cursor: 'zoom-out',
      }}
    >
      {svg && (
        <div
          style={{
            width: 'min(90vw, 720px)',
            maxHeight: '85vh',
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius)',
            color: 'var(--ink)',
            padding: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: parser-emitted SVG, no user input
          dangerouslySetInnerHTML={{ __html: wrapForFit(svg) }}
        />
      )}
    </div>
  )
}
