// QuestionFigure — render a parser-extracted vector diagram inline
// inside a quant question.
//
// Why inline SVG instead of <img src>:
//  - `stroke="currentColor"` inside the SVG cascades from the parent
//    color, so dark-mode theming "just works" without per-figure CSS.
//  - We can animate individual paths (entrance stroke-draw) and add
//    accessibility hooks (<title>, focusable parts) later without
//    touching the parser output.
//  - Tap-to-zoom can re-render the same SVG at a larger viewBox
//    instead of fetching a second asset.
//
// Why not bundle the SVGs into JS:
//  - 280+ figures × a few KB each adds up. We already moved the
//    JSON banks out of the bundle for the same reason. Lazy-fetch
//    keeps initial payload small.
//
// Layout discipline: the wrapper reserves space using `aspect-ratio`
// from the parser metadata. This eliminates layout-shift while the
// fetch is in flight — the option list below the figure stays put.

import { useEffect, useRef, useState } from 'react'

import type { QuestionFigureMeta } from '@/data/questions'

type Props = {
  figure: QuestionFigureMeta
}

// Module-level cache so two questions referencing the same figure
// (or a back-and-forth between drill questions) don't refetch.
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
  // and tall figures stay narrow, both fully proportional. This
  // replaces the earlier `width:100% + margin:22px` recipe that was
  // overflowing by 44px because margin sits outside the 100% box.
  const ratio = figure.aspect_ratio
  const MAX_H = 240 // px — leaves room for prompt + 5 options on a 780px frame
  const naturalWidth = ratio * MAX_H

  return (
    <>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        aria-label="Förstora figur"
        data-testid="question-figure"
        style={{
          // Centered inside the scroller, with the same 22px gutter
          // as the prompt and option rows.
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
          // Subtle entrance: fade the figure in once the SVG arrives.
          opacity: svg ? 1 : 0.35,
          transition: 'opacity 240ms ease',
        }}
        // Inline-render the SVG. Trusted source (our parser); no user
        // input flows in. Required to enable currentColor cascading.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: parser-emitted SVG, no user input
        dangerouslySetInnerHTML={svg ? { __html: wrapForFit(svg) } : undefined}
      />
      {zoomed && <FigureModal svg={svg} onClose={() => setZoomed(false)} />}
    </>
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
