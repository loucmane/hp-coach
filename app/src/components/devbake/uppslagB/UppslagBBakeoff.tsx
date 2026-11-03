import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { useFolioFonts } from '@/folio/lib/useFolioFonts'
import { useFirstContentSignal } from '@/lib/motion'
import { UppslagBKort } from './UppslagBKort'
import { UppslagBMarginal } from './UppslagBMarginal'
import { UppslagBTavla } from './UppslagBTavla'
import {
  DIRECTIONS,
  ENTRIES,
  ESSENTIAL,
  PALETTES,
  type Selection,
  type StudyFlow,
  VIEWS,
} from './uppslagBFixtures'
import '@/folio/styles/tokens.css'
import '@/folio/styles/palette.css'
import './uppslagBBakeoff.css'

type Props = { sel: Selection; onSelect: (next: Partial<Selection>) => void }

export default function UppslagBBakeoff({ sel, onSelect }: Props) {
  useFirstContentSignal()
  useFolioFonts()
  const viewer = useRef<HTMLElement>(null)
  const focusDirection = useRef<string | null>(null)
  const previousView = useRef(`${sel.s}:${sel.e}`)
  useLayoutEffect(() => {
    const view = `${sel.s}:${sel.e}`
    if (previousView.current === view) return
    previousView.current = view
    if (focusDirection.current) {
      viewer.current
        ?.querySelector<HTMLElement>(`[data-testid="${focusDirection.current}"] .ub-title`)
        ?.focus()
      focusDirection.current = null
    }
  }, [sel.s, sel.e])
  const selectFromPage = (next: Partial<Selection>) => {
    focusDirection.current =
      document.activeElement?.closest('.ub-surface')?.getAttribute('data-testid') ?? null
    onSelect(next)
  }
  return (
    <main
      ref={viewer}
      className="ub-viewer"
      data-folio=""
      data-theme={sel.t}
      data-palette={sel.p}
      data-testid="uppslag-b-bakeoff"
    >
      <header className="ub-controls" data-testid="uppslag-b-controls">
        <div className="ub-control-heading">
          <div>
            <p className="ub-label">Folio+ · designstudie</p>
            <h1>Rådet och resonemanget.</h1>
          </div>
          <p>Tre sätt att läsa. Samma innehåll.</p>
        </div>
        <div className="ub-control-row">
          <ControlGroup label="Riktning">
            {DIRECTIONS.map((d) => (
              <button
                type="button"
                key={d.key}
                aria-pressed={sel.d === d.key && !sel.sbs}
                onClick={() => onSelect({ d: d.key, sbs: false })}
              >
                {d.key.toUpperCase()} · {d.name}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="Jämförelse">
            <button
              type="button"
              aria-pressed={sel.sbs}
              onClick={() => onSelect({ sbs: !sel.sbs })}
            >
              Sida vid sida
            </button>
          </ControlGroup>
        </div>
        <div className="ub-control-row">
          <ControlGroup label="Vy">
            {VIEWS.map((view) => (
              <button
                type="button"
                key={view.key}
                aria-pressed={sel.s === view.key}
                onClick={() => onSelect({ s: view.key, e: 0 })}
              >
                {view.label}
              </button>
            ))}
          </ControlGroup>
        </div>
        <div className="ub-control-row">
          <ControlGroup label="Ram">
            {(['desktop', 'phone'] as const).map((w) => (
              <button
                type="button"
                key={w}
                aria-pressed={sel.w === w}
                onClick={() => onSelect({ w })}
              >
                {w === 'desktop' ? 'Dator' : 'Telefon'}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="Tema">
            {(['light', 'dark'] as const).map((t) => (
              <button
                type="button"
                key={t}
                aria-pressed={sel.t === t}
                onClick={() => onSelect({ t })}
              >
                {t === 'light' ? 'Ljust' : 'Mörkt'}
              </button>
            ))}
          </ControlGroup>
          <ControlGroup label="Färg">
            {PALETTES.map((p) => (
              <button
                type="button"
                key={p.key}
                aria-pressed={sel.p === p.key}
                onClick={() => onSelect({ p: p.key })}
              >
                {p.label}
              </button>
            ))}
          </ControlGroup>
        </div>
        <p className="ub-review-note">
          Förhandsvisning med riktiga råd och en fråga från högskoleprovet hösten 2017. De två sista
          stegen låter dig försöka själv först. Inget sparas.
        </p>
      </header>
      <Study key={`${sel.s}:${sel.e}`} sel={sel} onSelect={selectFromPage} />
    </main>
  )
}

function Study({ sel, onSelect }: Props) {
  const [revealed, setRevealed] = useState(() =>
    sel.s === 8
      ? ESSENTIAL.length
      : sel.s === 7
        ? ESSENTIAL.length - 2
        : sel.s === 6
          ? Math.floor(ESSENTIAL.length / 2)
          : 1,
  )
  const entryIndex = sel.s === 3 ? 1 : sel.s === 4 ? 4 : sel.e
  const flow: StudyFlow = {
    sel,
    entryIndex,
    entry: ENTRIES[entryIndex],
    openEntry: (index) => onSelect({ s: index === 1 ? 3 : index === 4 ? 4 : 2, e: index }),
    contents: () => onSelect({ s: 1, e: 0 }),
    revealed,
    next: () => setRevealed((count) => Math.min(count + 1, ESSENTIAL.length)),
    restart: () => setRevealed(1),
  }
  return (
    <div className="ub-stages" data-side-by-side={sel.sbs} data-width={sel.w}>
      {DIRECTIONS.filter((d) => sel.sbs || d.key === sel.d).map((direction) => (
        <section
          className="ub-candidate"
          key={direction.key}
          aria-label={`${direction.key.toUpperCase()} · ${direction.name}`}
        >
          <header className="ub-caption">
            <span>
              <b>{direction.key.toUpperCase()}</b> {direction.name}
            </span>
            <p>{direction.description}</p>
          </header>
          <PreviewFrame width={sel.w}>
            <div
              className="ub-surface"
              data-folio=""
              data-theme={sel.t}
              data-palette={sel.p}
              data-width={sel.w}
              data-view={sel.s}
              data-testid={`uppslag-b-${direction.key}`}
            >
              {direction.key === 'a' ? (
                <UppslagBMarginal flow={flow} />
              ) : direction.key === 'b' ? (
                <UppslagBKort flow={flow} />
              ) : (
                <UppslagBTavla flow={flow} />
              )}
            </div>
          </PreviewFrame>
        </section>
      ))}
    </div>
  )
}

function PreviewFrame({ width, children }: { width: Selection['w']; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const element = frame.current
    if (!element) return
    const measure = () =>
      setScale(
        width === 'desktop' && element.clientWidth > 0
          ? Math.min(1, element.clientWidth / 1100)
          : 1,
      )
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [width])
  return (
    <div className="ub-frame" data-width={width} ref={frame}>
      <div
        className="ub-canvas"
        style={{ zoom: scale, width: width === 'desktop' && scale < 1 ? 1100 : '100%' }}
      >
        {children}
      </div>
    </div>
  )
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="ub-control-group">
      <legend>{label}</legend>
      <div>{children}</div>
    </fieldset>
  )
}
