// /dev/redesign-2026-bakeoff page body: the switcher (direction × screen ×
// width × theme, plus side by side) and the stage. Router-free — the route
// passes the selection in and receives changes — so the same tree mounts in
// a screenshot harness outside the app shell.
//
// The stage is a box the direction fills as if it were the browser window:
// desktop takes the room under the switcher (zoomed to fit below 1024 px),
// phone is a 390 × 844 device frame on a wide screen and full-bleed on a
// narrow one. Each direction is its own lazy chunk, so a direction's code,
// CSS and fonts load only when it is first shown.

import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Info,
  LayoutGrid,
  Monitor,
  Moon,
  Smartphone,
  Sun,
  X,
} from 'lucide-react'
import {
  type ComponentType,
  type CSSProperties,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import './redesign2026.css'
import {
  DIRECTIONS,
  type DirectionKey,
  type DirectionProps,
  isForeignKey,
  SCREENS,
  type ScreenKey,
  type ThemeKey,
  useDismiss,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import { useFirstContentSignal } from '@/lib/motion'

export type Selection = {
  d: DirectionKey
  s: ScreenKey
  w: WidthKey
  t: ThemeKey
  sbs: boolean
  bare: boolean
}

const STAGES: Record<DirectionKey, ComponentType<DirectionProps>> = {
  a: lazy(() => import('./a-folio/Folio').then((m) => ({ default: m.Folio }))),
  b: lazy(() => import('./b-instrument/Instrument').then((m) => ({ default: m.Instrument }))),
  c: lazy(() => import('./c-spar/Spar').then((m) => ({ default: m.Spar }))),
  d: lazy(() => import('./d-lager/Lager').then((m) => ({ default: m.Lager }))),
}

const DESKTOP = { w: 1440, h: 900 }
const PHONE = { w: 390, h: 844 }
/** Below this the desktop layouts are zoomed rather than squeezed. */
const DESKTOP_MIN = 1024

function useBoxSize(ref: { current: HTMLElement | null }) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

export function Redesign2026Bakeoff({
  sel,
  onSelect,
}: {
  sel: Selection
  onSelect: (next: Partial<Selection>) => void
}) {
  // The page is its own content: lift the app's boot veil at once.
  useFirstContentSignal()
  const [barHidden, setBarHidden] = useState(false)
  const [info, setInfo] = useState(false)

  // Stable callbacks for the directions (their drill state keys off them).
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect
  const onScreen = useCallback((s: ScreenKey) => selectRef.current({ s }), [])
  const onTheme = useCallback((t: ThemeKey) => selectRef.current({ t }), [])

  // 1–4 direction, ←/→ screen, 0 side by side. Directions see keys first
  // (capture phase) and mark the ones they use.
  const selNow = useRef(sel)
  selNow.current = sel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isForeignKey(e)) return
      const cur = selNow.current
      if (e.key >= '1' && e.key <= '4') {
        e.preventDefault()
        selectRef.current({ d: DIRECTIONS[Number(e.key) - 1].key, sbs: false })
      } else if (e.key === '0') {
        e.preventDefault()
        selectRef.current({ sbs: !cur.sbs })
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const i = SCREENS.findIndex((x) => x.key === cur.s)
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + SCREENS.length) % SCREENS.length
        selectRef.current({ s: SCREENS[n].key })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const showBar = !sel.bare && !barHidden
  return (
    <div className="rb26" data-theme={sel.t} data-testid="rb26">
      {showBar ? (
        <Bar
          sel={sel}
          onSelect={onSelect}
          info={info}
          setInfo={setInfo}
          onHide={() => setBarHidden(true)}
        />
      ) : null}
      {!sel.bare && barHidden ? (
        <button
          type="button"
          className="rb26-restore"
          onClick={() => setBarHidden(false)}
          aria-label="Visa bake-off-menyn"
        >
          <ChevronUp size={14} strokeWidth={2} aria-hidden style={{ rotate: '180deg' }} />
          Bake-off
        </button>
      ) : null}
      {sel.sbs ? (
        <SideBySide sel={sel} onSelect={onSelect} onScreen={onScreen} onTheme={onTheme} />
      ) : (
        <Single sel={sel} onScreen={onScreen} onTheme={onTheme} />
      )}
    </div>
  )
}

// ── Switcher ─────────────────────────────────────────────────────────

function Bar({
  sel,
  onSelect,
  info,
  setInfo,
  onHide,
}: {
  sel: Selection
  onSelect: (next: Partial<Selection>) => void
  info: boolean
  setInfo: (open: boolean) => void
  onHide: () => void
}) {
  const dir = DIRECTIONS.find((d) => d.key === sel.d) ?? DIRECTIONS[0]
  const screen = SCREENS.find((s) => s.key === sel.s) ?? SCREENS[0]
  const step = (delta: 1 | -1) => {
    const i = SCREENS.findIndex((x) => x.key === sel.s)
    onSelect({ s: SCREENS[(i + delta + SCREENS.length) % SCREENS.length].key })
  }
  const panelRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setInfo(false), [setInfo])
  useDismiss(info, close, panelRef)

  return (
    <header className="rb26-bar" data-testid="rb26-bar">
      <div className="rb26-brand">
        <span className="rb26-brand-mark" aria-hidden />
        <span className="rb26-brand-name">Redesign 2026</span>
        <span className="rb26-pill">omgång 1</span>
      </div>

      <Seg
        label="Riktning"
        testid="rb26-direction"
        items={DIRECTIONS.map((d, i) => ({ key: d.key, label: d.name, kbd: String(i + 1) }))}
        active={sel.sbs ? null : sel.d}
        onPick={(d) => onSelect({ d, sbs: false })}
      />

      <div className="rb26-group">
        <button
          type="button"
          className="rb26-icon-btn"
          onClick={() => step(-1)}
          aria-label="Föregående skärm"
          title="Föregående skärm (←)"
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
        </button>
        <Seg
          label="Skärm"
          testid="rb26-screen"
          items={SCREENS.map((s) => ({ key: s.key, label: s.label }))}
          active={sel.s}
          onPick={(s) => onSelect({ s })}
        />
        <button
          type="button"
          className="rb26-icon-btn"
          onClick={() => step(1)}
          aria-label="Nästa skärm"
          title="Nästa skärm (→)"
        >
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <span className="rb26-spacer" />

      <Seg
        label="Bredd"
        testid="rb26-width"
        items={[
          {
            key: 'desktop' as const,
            label: 'Dator',
            icon: <Monitor size={14} strokeWidth={1.75} />,
          },
          {
            key: 'phone' as const,
            label: 'Telefon',
            icon: <Smartphone size={14} strokeWidth={1.75} />,
          },
        ]}
        active={sel.w}
        onPick={(w) => onSelect({ w })}
      />
      <Seg
        label="Tema"
        testid="rb26-theme"
        items={[
          { key: 'light' as const, label: 'Ljust', icon: <Sun size={14} strokeWidth={1.75} /> },
          { key: 'dark' as const, label: 'Mörkt', icon: <Moon size={14} strokeWidth={1.75} /> },
        ]}
        active={sel.t}
        onPick={(t) => onSelect({ t })}
      />
      <button
        type="button"
        className="rb26-toggle"
        aria-pressed={sel.sbs}
        data-testid="rb26-sbs"
        onClick={() => onSelect({ sbs: !sel.sbs })}
      >
        <LayoutGrid size={14} strokeWidth={1.75} aria-hidden />
        <span className="rb26-label">Sida vid sida</span>
        <kbd>0</kbd>
      </button>
      <div className="rb26-info-wrap" ref={panelRef}>
        <button
          type="button"
          className="rb26-toggle"
          aria-expanded={info}
          aria-controls="rb26-info"
          onClick={() => setInfo(!info)}
        >
          <Info size={14} strokeWidth={1.75} aria-hidden />
          <span className="rb26-label">Om {sel.sbs ? 'riktningarna' : dir.name}</span>
        </button>
        {info ? (
          <div className="rb26-info" id="rb26-info" data-testid="rb26-info">
            <button
              type="button"
              className="rb26-icon-btn rb26-info-close"
              onClick={close}
              aria-label="Stäng"
            >
              <X size={15} strokeWidth={1.75} aria-hidden />
            </button>
            {(sel.sbs ? DIRECTIONS : [dir]).map((d) => (
              <section key={d.key} className="rb26-info-dir">
                <h2>
                  <span className="rb26-info-key">{d.key.toUpperCase()}</span> {d.name}
                  <span className="rb26-info-tag"> — {d.tagline}</span>
                </h2>
                {sel.sbs ? null : (
                  <ul>
                    {d.traits.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
                <p className="rb26-info-risk">{d.risk}</p>
                {sel.sbs ? null : <p className="rb26-info-refs">Förebilder: {d.references}</p>}
              </section>
            ))}
            <section className="rb26-info-screen">
              <h3>
                Skärm {screen.key} · {screen.label}
              </h3>
              <p>{screen.blurb}</p>
              <p className="rb26-info-keys">
                Tangenter: <kbd>1</kbd>–<kbd>4</kbd> riktning · <kbd>←</kbd>
                <kbd>→</kbd> skärm · <kbd>0</kbd> sida vid sida
              </p>
            </section>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="rb26-icon-btn"
        onClick={onHide}
        aria-label="Dölj bake-off-menyn"
        title="Dölj menyn"
      >
        <ChevronUp size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </header>
  )
}

function Seg<K extends string | number>({
  label,
  items,
  active,
  onPick,
  testid,
}: {
  label: string
  items: { key: K; label: string; kbd?: string; icon?: ReactNode }[]
  active: K | null
  onPick: (key: K) => void
  testid: string
}) {
  return (
    <fieldset className="rb26-seg" data-testid={testid}>
      <legend className="rb26-sr">{label}</legend>
      {items.map((item) => {
        const on = item.key === active
        return (
          <button
            type="button"
            key={String(item.key)}
            aria-pressed={on}
            data-testid={`${testid}-${item.key}`}
            onClick={() => onPick(item.key)}
          >
            {item.icon ? <span aria-hidden>{item.icon}</span> : null}
            {item.kbd ? <kbd aria-hidden>{item.kbd}</kbd> : null}
            <span className={item.icon ? 'rb26-label' : undefined}>{item.label}</span>
          </button>
        )
      })}
    </fieldset>
  )
}

// ── Stage ────────────────────────────────────────────────────────────

function Single({
  sel,
  onScreen,
  onTheme,
}: {
  sel: Selection
  onScreen: (s: ScreenKey) => void
  onTheme: (t: ThemeKey) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const box = useBoxSize(ref)
  const Stage = STAGES[sel.d]
  const props: DirectionProps = {
    screen: sel.s,
    width: sel.w,
    theme: sel.t,
    live: true,
    onScreen,
    onTheme,
  }
  // Remount on direction or width only: a screen or theme change keeps the
  // drill's state (an answer given on Läsfråga carries into Facit).
  const key = `${sel.d}-${sel.w}`

  let inner: ReactNode = null
  if (box.w > 0) {
    if (sel.w === 'phone' && box.w < 560) {
      inner = <Fill>{<Stage key={key} {...props} />}</Fill>
    } else if (sel.w === 'phone') {
      const zoom = Math.min(1, (box.h - 40) / (PHONE.h + 20))
      inner = (
        <div className="rb26-device" style={{ zoom }} data-testid="rb26-device">
          <div className="rb26-device-screen" style={{ width: PHONE.w, height: PHONE.h }}>
            <Stage key={key} {...props} />
          </div>
        </div>
      )
    } else {
      const zoom = box.w < DESKTOP_MIN ? box.w / DESKTOP_MIN : 1
      inner = (
        <div
          className="rb26-desk"
          style={{ width: box.w / zoom, height: box.h / zoom, zoom } as CSSProperties}
        >
          <Stage key={key} {...props} />
        </div>
      )
    }
  }

  return (
    <main
      ref={ref}
      className="rb26-stage"
      data-width={sel.w}
      data-testid="rb26-stage"
      data-direction={sel.d}
      data-screen={sel.s}
    >
      <Suspense fallback={<div className="rb26-loading">Laddar {sel.d.toUpperCase()}…</div>}>
        {inner}
      </Suspense>
    </main>
  )
}

function Fill({ children }: { children: ReactNode }) {
  return <div className="rb26-fill">{children}</div>
}

function SideBySide({
  sel,
  onSelect,
  onScreen,
  onTheme,
}: {
  sel: Selection
  onSelect: (next: Partial<Selection>) => void
  onScreen: (s: ScreenKey) => void
  onTheme: (t: ThemeKey) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const box = useBoxSize(ref)
  const desktop = sel.w === 'desktop'
  const base = desktop ? DESKTOP : PHONE
  const narrow = box.w < 720
  const cols = narrow ? 1 : desktop ? 2 : 4
  const rows = narrow ? 4 : desktop ? 2 : 1
  const pad = narrow ? 12 : 24
  const gap = narrow ? 20 : 24
  const caption = 44
  const cellW = (box.w - pad * 2 - gap * (cols - 1)) / cols
  const cellH = (box.h - pad * 2 - gap * (rows - 1)) / rows - caption
  const zoom = narrow
    ? Math.max(0.1, cellW / base.w)
    : Math.max(0.1, Math.min(cellW / base.w, cellH / base.h))

  return (
    <main
      ref={ref}
      className="rb26-sbs"
      data-testid="rb26-sbs-grid"
      data-width={sel.w}
      data-screen={sel.s}
      style={{ '--rb26-cols': cols, padding: pad, gap } as CSSProperties}
    >
      {box.w > 0
        ? DIRECTIONS.map((d, i) => {
            const Stage = STAGES[d.key]
            return (
              <figure key={d.key} className="rb26-thumb" data-testid={`rb26-thumb-${d.key}`}>
                <figcaption>
                  <kbd>{i + 1}</kbd>
                  <strong>{d.name}</strong>
                  <span>{d.tagline}</span>
                </figcaption>
                <div
                  className="rb26-thumb-frame"
                  style={{ width: base.w * zoom, height: base.h * zoom }}
                  data-width={sel.w}
                >
                  <div inert style={{ width: base.w, height: base.h, zoom }}>
                    <Suspense fallback={<div className="rb26-loading" />}>
                      <Stage
                        screen={sel.s}
                        width={sel.w}
                        theme={sel.t}
                        live={false}
                        onScreen={onScreen}
                        onTheme={onTheme}
                      />
                    </Suspense>
                  </div>
                  <button
                    type="button"
                    className="rb26-thumb-open"
                    onClick={() => onSelect({ d: d.key, sbs: false })}
                    aria-label={`Öppna ${d.name} i full storlek`}
                  />
                </div>
              </figure>
            )
          })
        : null}
    </main>
  )
}
