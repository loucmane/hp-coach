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

// Min/max zoom. scale === 1 means fit-to-viewport (the whole figure
// visible); MAX is enough to read the smallest chart labels on a ~2400px
// DTK render without going lossy-huge.
const MIN_SCALE = 1
const MAX_SCALE = 6

function RasterModal({ src, onClose }: { src: string; onClose: () => void }) {
  // A continuous zoom/pan viewer — not a binary fit↔1:1 toggle. Opens
  // fit-to-screen (whole figure visible, as large as the viewport
  // allows); scroll wheel / pinch / the ± buttons zoom smoothly,
  // anchored on the cursor (or pinch midpoint); drag pans once zoomed;
  // double-click toggles fit ↔ 2.5×. Rotation (button + R) uprights the
  // sideways-scanned DTK pages. Transform-based, so there's no scroll
  // container and no flex-overflow clipping.
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 })
  const [rotation, setRotation] = useState(0)
  const [interacting, setInteracting] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const gesture = useRef({ moved: false, lastX: 0, lastY: 0, pinch: 0 })

  const rotated = rotation === 90 || rotation === 270
  const reset = () => setView({ scale: 1, tx: 0, ty: 0 })
  const rotate = () => {
    setRotation((r) => (r + 90) % 360)
    reset()
  }

  // Cursor position relative to the image-area centre (the transform
  // origin), so zoom anchoring and the translate model share a frame.
  const centreRel = (clientX: number, clientY: number) => {
    const r = areaRef.current?.getBoundingClientRect()
    if (!r) return { ax: 0, ay: 0 }
    return { ax: clientX - (r.left + r.width / 2), ay: clientY - (r.top + r.height / 2) }
  }

  // Keep the figure from being dragged fully out of view: cap the
  // translation to the overflow half-extent on each axis.
  const clampPan = (v: { scale: number; tx: number; ty: number }) => {
    const area = areaRef.current
    const img = imgRef.current
    if (!area || !img) return v
    const bw = (rotated ? img.offsetHeight : img.offsetWidth) * v.scale
    const bh = (rotated ? img.offsetWidth : img.offsetHeight) * v.scale
    const maxX = Math.max(0, (bw - area.clientWidth) / 2)
    const maxY = Math.max(0, (bh - area.clientHeight) / 2)
    return {
      scale: v.scale,
      tx: Math.max(-maxX, Math.min(maxX, v.tx)),
      ty: Math.max(-maxY, Math.min(maxY, v.ty)),
    }
  }

  // Zoom to `target`, holding the area-relative point (ax, ay) fixed.
  const zoomAround = (
    v: { scale: number; tx: number; ty: number },
    target: number,
    ax: number,
    ay: number,
  ) => {
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, target))
    if (s === 1) return { scale: 1, tx: 0, ty: 0 }
    const k = s / v.scale
    return clampPan({ scale: s, tx: ax - k * (ax - v.tx), ty: ay - k * (ay - v.ty) })
  }

  const onWheel = (e: React.WheelEvent) => {
    const { ax, ay } = centreRel(e.clientX, e.clientY)
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    setView((v) => zoomAround(v, v.scale * factor, ax, ay))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    // A mouse only ever has one pointer, so drop any stale entry from a
    // missed pointerup — otherwise a leftover would make size === 2 and
    // a plain mouse drag would be misread as a pinch.
    if (e.pointerType === 'mouse') pointers.current.clear()
    // Register the pointer FIRST — setPointerCapture can throw for an
    // already-released pointer, and if it ran first the catch would skip
    // registration and kill panning entirely.
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current.moved = false
    gesture.current.lastX = e.clientX
    gesture.current.lastY = e.clientY
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y)
    }
    try {
      areaRef.current?.setPointerCapture(e.pointerId)
    } catch {
      // capture unavailable (e.g. synthetic pointer) — pan still works
      // via the document-level move events.
    }
    setInteracting(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      // Pinch-zoom around the two-finger midpoint.
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const prev = gesture.current.pinch || dist
      gesture.current.pinch = dist
      gesture.current.moved = true
      const { ax, ay } = centreRel((a.x + b.x) / 2, (a.y + b.y) / 2)
      setView((v) => zoomAround(v, v.scale * (dist / prev), ax, ay))
      return
    }

    // Single-pointer drag pans (only when zoomed in).
    const dx = e.clientX - gesture.current.lastX
    const dy = e.clientY - gesture.current.lastY
    gesture.current.lastX = e.clientX
    gesture.current.lastY = e.clientY
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) gesture.current.moved = true
    setView((v) => (v.scale === 1 ? v : clampPan({ scale: v.scale, tx: v.tx + dx, ty: v.ty + dy })))
  }

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) gesture.current.pinch = 0
    if (pointers.current.size === 0) setInteracting(false)
  }

  const onDoubleClick = (e: React.MouseEvent) => {
    const { ax, ay } = centreRel(e.clientX, e.clientY)
    setView((v) => (v.scale > 1 ? { scale: 1, tx: 0, ty: 0 } : zoomAround(v, 2.5, ax, ay)))
  }

  const stepZoom = (factor: number) => setView((v) => zoomAround(v, v.scale * factor, 0, 0))

  // biome-ignore lint/correctness/useExhaustiveDependencies: zoomAround/centreRel read refs only — stable across renders.
  useEffect(() => {
    // Lock background scroll while the viewer is open, and intercept
    // Escape/R in the capture phase so SessionPlayer's window-level
    // Escape (which ends the drill) doesn't also fire.
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
        setView({ scale: 1, tx: 0, ty: 0 })
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        setView((v) => zoomAround(v, v.scale * 1.25, 0, 0))
      } else if (e.key === '-') {
        e.preventDefault()
        setView((v) => zoomAround(v, v.scale / 1.25, 0, 0))
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const zoomed = view.scale > 1

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
        background: 'color-mix(in oklch, var(--bg) 96%, transparent)',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: pointer-driven image canvas; keyboard zoom is handled by the global +/-/R/Esc keys and the toolbar buttons */}
      <div
        ref={areaRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={onDoubleClick}
        onClickCapture={(e) => {
          // A click that ended a pan/pinch shouldn't close the modal.
          if (gesture.current.moved) {
            e.stopPropagation()
            gesture.current.moved = false
          }
        }}
        style={{
          position: 'absolute',
          inset: '0 0 76px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 24,
          touchAction: 'none',
          cursor: zoomed ? (interacting ? 'grabbing' : 'grab') : 'zoom-in',
        }}
      >
        <img
          ref={imgRef}
          src={`/${src}`}
          alt="Figur, förstorad"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={{
            // scale 1 = fit the area as large as it allows. When rotated
            // 90/270 the bounding box swaps, so clamp by the orthogonal
            // viewport axis.
            maxWidth: rotated ? '88vh' : '94vw',
            maxHeight: rotated ? '94vw' : '88vh',
            width: 'auto',
            height: 'auto',
            background: 'var(--panel)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--radius)',
            padding: 12,
            transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: interacting ? 'none' : 'transform 160ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
          }}
        />
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
          onClick={() => stepZoom(1 / 1.25)}
          aria-label="Zooma ut"
          title="Zooma ut (−)"
          disabled={view.scale <= MIN_SCALE}
          style={{ ...figCtrlBtn, opacity: view.scale <= MIN_SCALE ? 0.4 : 1 }}
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
          {Math.round(view.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => stepZoom(1.25)}
          aria-label="Zooma in"
          title="Zooma in (+)"
          disabled={view.scale >= MAX_SCALE}
          style={{ ...figCtrlBtn, opacity: view.scale >= MAX_SCALE ? 0.4 : 1 }}
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
          onClick={reset}
          aria-label="Återställ"
          title="Anpassa till skärm"
          disabled={!zoomed && rotation === 0}
          style={{
            ...figCtrlBtn,
            width: 'auto',
            padding: '0 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: !zoomed && rotation === 0 ? 0.4 : 1,
          }}
        >
          Anpassa
        </button>
      </div>
    </div>
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
