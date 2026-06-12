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

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

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

const MAX_ZOOM = 6
// zoom 1 == the whole page fitted on screen; you only ever zoom IN from
// there, so don't allow shrinking much below the fit.
const MIN_ZOOM = 1
const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z))

function RasterModal({ src, onClose }: { src: string; onClose: () => void }) {
  // A document-style viewer: the figure opens at fit-WIDTH (filling the
  // viewport horizontally), so a tall scanned page overflows vertically
  // and is immediately scrollable + draggable — no dead "fits perfectly,
  // nothing to do" state. Mouse wheel / trackpad scroll the page
  // natively, drag pans, pinch + the ± buttons zoom, rotate uprights a
  // sideways chart, and "Anpassa" snaps to the whole page on screen.
  // `zoom` is a multiplier on the fit-width base size.
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [cont, setCont] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [grabbing, setGrabbing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, moved: false, x: 0, y: 0, sl: 0, st: 0 })
  const touch = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchPrev = useRef(0)
  const rotated = rotation === 90 || rotation === 270

  useLayoutEffect(() => {
    const measure = () => {
      const el = scrollRef.current
      if (el) setCont({ w: el.clientWidth, h: el.clientHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Geometry. effAspect is the VISIBLE box aspect (w/h) after rotation.
  // At zoom 1 the figure is CONTAINED — the whole page fits on screen at
  // a comfortable size (like a PDF viewer opening a page). Zoom in to
  // read detail; the page then overflows and is scrollable/draggable.
  const aspect = nat ? nat.w / nat.h : 1
  const effAspect = rotated ? 1 / aspect : aspect
  const containVisW = Math.min(cont.w, cont.h * effAspect)
  const visW = containVisW * zoom
  const visH = effAspect > 0 ? visW / effAspect : visW
  const boxW = visW
  const boxH = visH
  // The <img>'s own pre-rotation size, so a 90/270° rotation lands it at
  // exactly visW × visH.
  const imgW = rotated ? visH : visW
  const imgH = rotated ? visW : visH

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollRef.current
    if (!el) return
    if (e.pointerType === 'touch') touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (touch.current.size === 2) {
      const [a, b] = [...touch.current.values()]
      pinchPrev.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
    drag.current = {
      active: true,
      moved: false,
      x: e.clientX,
      y: e.clientY,
      sl: el.scrollLeft,
      st: el.scrollTop,
    }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      // capture unavailable — pan still works via bubbled move events.
    }
    setGrabbing(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollRef.current
    if (!el) return
    if (e.pointerType === 'touch' && touch.current.has(e.pointerId)) {
      touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touch.current.size === 2) {
        const [a, b] = [...touch.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const prev = pinchPrev.current || dist
        pinchPrev.current = dist
        drag.current.moved = true
        setZoom((z) => clampZoom(z * (dist / prev)))
        return
      }
    }
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) drag.current.moved = true
    el.scrollLeft = drag.current.sl - dx
    el.scrollTop = drag.current.st - dy
  }

  const endPointer = (e: React.PointerEvent) => {
    touch.current.delete(e.pointerId)
    if (touch.current.size < 2) pinchPrev.current = 0
    drag.current.active = false
    setGrabbing(false)
  }

  // Ctrl/⌘ + wheel zooms; a plain wheel falls through to native scroll.
  const onWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    setZoom((z) => clampZoom(z * factor))
  }

  const rotate = () => {
    setRotation((r) => (r + 90) % 360)
    setZoom(1)
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        onClose()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setRotation((r) => (r + 90) % 360)
        setZoom(1)
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setZoom((z) => clampZoom(z * 1.25))
      } else if (e.key === '-') {
        e.preventDefault()
        setZoom((z) => clampZoom(z / 1.25))
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  // Portal to <body>: the modal renders inside whichever variant mounted
  // the figure, so without this the variant's scoped `.xxx-fig img` rules
  // bleed onto the modal image, and a transformed ancestor would capture
  // its position:fixed. The portal escapes both.
  return createPortal(
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
        background: 'color-mix(in oklch, var(--bg) 96%, transparent)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
      }}
    >
      <div
        ref={scrollRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onClickCapture={(e) => {
          // A click that ended a drag/pinch shouldn't close the modal.
          if (drag.current.moved) {
            e.stopPropagation()
            drag.current.moved = false
          }
        }}
        style={{
          position: 'absolute',
          inset: '0 0 76px 0',
          overflow: 'auto',
          display: 'flex',
          padding: 24,
          touchAction: 'none',
          cursor: grabbing ? 'grabbing' : 'grab',
        }}
      >
        {/* Box sized to the (possibly rotated) figure; margin:auto centres
            it when it fits and keeps the origin reachable when it overflows. */}
        <div
          style={{
            width: boxW || '100%',
            height: boxH || 'auto',
            margin: 'auto',
            position: 'relative',
          }}
        >
          <img
            src={`/${src}`}
            alt="Figur, förstorad"
            draggable={false}
            onLoad={(e) => {
              const im = e.currentTarget
              setNat({ w: im.naturalWidth, h: im.naturalHeight })
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: imgW || 'auto',
              height: imgH || 'auto',
              maxWidth: nat ? 'none' : '94vw',
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius)',
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              opacity: nat ? 1 : 0,
            }}
          />
        </div>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="toolbar"
        aria-label="Figurkontroller"
        style={{
          position: 'absolute',
          bottom: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: 5,
          background: 'color-mix(in oklch, var(--bg) 96%, transparent)',
          border: '1px solid var(--hairline)',
          borderRadius: 999,
          boxShadow: '0 8px 24px -12px rgba(0, 0, 0, 0.18)',
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z / 1.25))}
          aria-label="Zooma ut"
          title="Zooma ut (−)"
          disabled={zoom <= MIN_ZOOM}
          style={{ ...figCtrlBtn, opacity: zoom <= MIN_ZOOM ? 0.4 : 1 }}
        >
          −
        </button>
        <span
          aria-live="polite"
          style={{
            minWidth: 46,
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => clampZoom(z * 1.25))}
          aria-label="Zooma in"
          title="Zooma in (+)"
          disabled={zoom >= MAX_ZOOM}
          style={{ ...figCtrlBtn, opacity: zoom >= MAX_ZOOM ? 0.4 : 1 }}
        >
          +
        </button>
        <span style={{ width: 1, height: 20, background: 'var(--hairline)', margin: '0 4px' }} />
        <button
          type="button"
          onClick={rotate}
          aria-label="Rotera figur 90 grader"
          title="Rotera (R)"
          style={figCtrlBtn}
        >
          ↻
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          aria-label="Anpassa till skärm"
          title="Anpassa hela sidan till skärmen"
          disabled={zoom === 1 && rotation === 0}
          style={{
            ...figCtrlBtn,
            width: 'auto',
            padding: '0 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: zoom === 1 && rotation === 0 ? 0.4 : 1,
          }}
        >
          Hela sidan
        </button>
      </div>
    </div>,
    document.body,
  )
}

const figCtrlBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  background: 'var(--panel)',
  border: '1px solid var(--hairline)',
  borderRadius: 999,
  fontSize: 16,
  lineHeight: 1,
  color: 'var(--ink)',
  cursor: 'pointer',
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
