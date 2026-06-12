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

// DTK figure pages: dense JPEG renders.
//
// Readability problem: a landscape source page (aspect ~1.4) shoved into
// a phone-portrait column at 346px wide collapses to ~247px tall — bar
// chart labels and table digits go unreadable. Two-pronged fix:
//   1. Drop the 22px column gutter — landscape figures use full canvas
//      width so the inline preview is as large as the column allows.
//   2. Surface the "Förstora figur" affordance as an explicit floating
//      badge in the corner of the figure. Users learn it's tappable.
//
// The modal pans for figures wider than the viewport (overflow:auto on
// the modal scaffold) so the user can read native landscape pages
// without having to physically rotate the device.
function RasterFigure({ figure }: Props) {
  const [zoomed, setZoomed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [rotation, setRotation] = useState(0)
  const ratio = figure.aspect_ratio
  const isLandscape = ratio > 1.05
  const rotated = rotation === 90 || rotation === 270
  // Post-rotation effective aspect: swap when the figure is rotated
  // by 90/270 so the layout-reserved box matches what the rotated
  // image actually fills.
  const effectiveAspect = rotated ? 1 / ratio : ratio

  return (
    <>
      <div
        style={{
          position: 'relative',
          margin: '0 auto 18px',
          width: isLandscape && !rotated ? '100%' : 'calc(100% - 44px)',
        }}
      >
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Förstora figur"
          data-testid="question-figure"
          style={{
            position: 'relative',
            display: 'block',
            width: '100%',
            aspectRatio: String(effectiveAspect),
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
            style={
              rotated
                ? {
                    // When rotated 90/270, the image's native long axis
                    // (ratio > 1) becomes vertical. Size it to fill the
                    // ROTATED box (which has aspect 1/ratio): set
                    // height=100% of the new box (= width-of-old-box),
                    // width=100% of the orthogonal axis.
                    display: 'block',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: rotated ? `${100 * ratio}%` : '100%',
                    height: rotated ? `${100 / ratio}%` : '100%',
                    objectFit: 'contain',
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }
                : {
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }
            }
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'color-mix(in oklch, var(--bg) 92%, transparent)',
              border: '1px solid var(--hairline)',
              borderRadius: 999,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
              pointerEvents: 'none',
            }}
          >
            ⤢ förstora
          </span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setRotation((r) => (r + 90) % 360)
          }}
          aria-label="Rotera figur 90 grader"
          title="Rotera figur"
          style={{
            position: 'absolute',
            left: 10,
            bottom: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'color-mix(in oklch, var(--bg) 92%, transparent)',
            border: '1px solid var(--hairline)',
            borderRadius: 999,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            cursor: 'pointer',
          }}
        >
          ↻ rotera
        </button>
      </div>
      {zoomed && <RasterModal src={figure.src} onClose={() => setZoomed(false)} />}
    </>
  )
}

function RasterModal({ src, onClose }: { src: string; onClose: () => void }) {
  // Three controls available in the modal:
  //   - actual: 1:1 pixel size vs fit-to-viewport. DTK landscape
  //     renders are ~1700px wide — actual-pixel mode is essential for
  //     reading small chart labels.
  //   - rotation: 0/90/180/270 in degrees. Landscape DTK pages are
  //     more comfortable to read with the phone held landscape OR
  //     with the image rotated to portrait orientation; the rotate
  //     button gives the user control.
  //   - r-shortcut: keyboard accelerator for rotation (desktop).
  const [actual, setActual] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [grabbing, setGrabbing] = useState(false)
  const rotate = () => setRotation((r) => (r + 90) % 360)

  // Drag-to-pan for the zoomed (actual-pixel) view. DTK renders are
  // ~2400px wide — at 1:1 the viewport shows only a slice, so the user
  // needs to grab and drag to read across. Pointer events cover mouse
  // + touch + pen uniformly; the scroll position is driven directly so
  // it works regardless of native scrollbar affordances.
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, moved: false, x: 0, y: 0, sl: 0, st: 0 })

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current
    if (!el) return
    // Nothing to pan if the content already fits.
    if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return
    drag.current = {
      active: true,
      moved: false,
      x: e.clientX,
      y: e.clientY,
      sl: el.scrollLeft,
      st: el.scrollTop,
    }
    el.setPointerCapture(e.pointerId)
    setGrabbing(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollRef.current
    const d = drag.current
    if (!el || !d.active) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true
    el.scrollLeft = d.sl - dx
    el.scrollTop = d.st - dy
  }
  const endPan = (e: React.PointerEvent) => {
    const el = scrollRef.current
    if (el && drag.current.active) {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        // pointer already released — ignore
      }
    }
    drag.current.active = false
    setGrabbing(false)
  }

  useEffect(() => {
    // Capture phase + stopImmediatePropagation: SessionPlayer also
    // listens for Escape on window (to end the session and jump to
    // the "öva igen" idle screen). Without this, Escape from the
    // modal closed the modal AND ejected the user from the drill.
    // Capture lets us intercept first; stopImmediatePropagation halts
    // sibling listeners on the same target before they fire.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setRotation((r) => (r + 90) % 360)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const rotated = rotation === 90 || rotation === 270

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
        // Backdrop fills the viewport but does NOT scroll. The scroll
        // lives on the inner image-area box so the toolbar (absolute
        // child of the backdrop) stays pinned to the bottom edge even
        // when the user pans a 1:1 landscape figure.
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in oklch, var(--bg) 92%, transparent)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        cursor: 'zoom-out',
      }}
    >
      <div
        ref={scrollRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        onClickCapture={(e) => {
          // Swallow the click that terminates a pan drag (capture phase
          // fires before the image's own onClick) so it neither toggles
          // zoom nor bubbles to the backdrop and closes the modal.
          if (drag.current.moved) {
            e.stopPropagation()
            drag.current.moved = false
          }
        }}
        style={{
          position: 'absolute',
          // Reserve 80px at the bottom for the toolbar — keeps the
          // controls always visible above the image scroll area.
          // Clicks in the padding still bubble to the backdrop (closes
          // the modal), matching the "click outside to dismiss" gesture
          // users already know.
          inset: '0 0 80px 0',
          display: 'flex',
          overflow: 'auto',
          padding: 24,
          // grab affordance only when zoomed (and thus pannable).
          cursor: actual ? (grabbing ? 'grabbing' : 'grab') : 'default',
          // Pointer-driven panning owns the gesture; disable native
          // touch scroll so a drag doesn't fight the browser.
          touchAction: 'none',
        }}
      >
        <img
          src={`/${src}`}
          alt="Figur, förstorad"
          onClick={(e) => {
            e.stopPropagation()
            setActual((v) => !v)
          }}
          onKeyDown={(e) => e.stopPropagation()}
          draggable={false}
          style={
            actual
              ? {
                  // margin:auto (not flex centering) so the image stays
                  // centered when smaller than the box BUT remains
                  // scrollable from the origin when larger — flex
                  // justify/align-center clips the overflowed start.
                  margin: 'auto',
                  width: 'auto',
                  height: 'auto',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  background: 'var(--panel)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius)',
                  padding: 12,
                  cursor: 'inherit',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 220ms ease',
                }
              : {
                  // Fit inside the scroll-area box. When rotated 90/270
                  // the bounding box swaps so clamp by the orthogonal
                  // viewport axis instead.
                  margin: 'auto',
                  maxWidth: rotated ? 'min(94vh, 1400px)' : 'min(96vw, 1400px)',
                  maxHeight: rotated ? '94vw' : '94vh',
                  width: 'auto',
                  height: 'auto',
                  background: 'var(--panel)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--radius)',
                  padding: 12,
                  cursor: 'zoom-in',
                  transform: `rotate(${rotation}deg)`,
                  transition: 'transform 220ms ease',
                }
          }
        />
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="toolbar"
        aria-label="Figurkontroller"
        style={{
          // Absolute inside the backdrop — pinned at the bottom and
          // OUTSIDE the scroll container above, so panning the image
          // doesn't scroll the toolbar away. Avoids `position: fixed`
          // (gets trapped by transformed ancestors elsewhere in the
          // page chrome).
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '6px 8px 6px 14px',
          background: 'color-mix(in oklch, var(--bg) 96%, transparent)',
          border: '1px solid var(--hairline)',
          borderRadius: 999,
          boxShadow: '0 8px 24px -12px rgba(0, 0, 0, 0.18)',
          zIndex: 1,
          cursor: 'default',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
            pointerEvents: 'none',
          }}
        >
          {actual ? 'dra för att panorera · tryck = anpassa' : 'tryck = zooma in'} · esc stäng
        </span>
        <button
          type="button"
          onClick={rotate}
          aria-label="Rotera figur 90 grader"
          title="Rotera (R)"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 999,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            cursor: 'pointer',
          }}
        >
          ↻ rotera
        </button>
      </div>
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
  // Capture-phase Escape so the SessionPlayer's session-end handler
  // (also on window) doesn't fire too and eject the user out of the
  // drill. Same pattern as RasterModal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
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
