// Folio · Konto & inställningar (screen 13) — the account set as a book's
// imprint page. The page grammar's masthead, title and standfirst, then
// one section per thing the reader thinks about (you, the exam, practice,
// looks, your data, help), each a serif head under a hairline over
// definition rows: a value with leader dots, or a word choice with the
// chosen word underlined in the accent — no switches, no cards, no chevron
// rows. The margin holds the page's own index and the app's one list of
// keyboard shortcuts. Logga ut and Radera kontot come last, behind the same
// double rule as on the account slip.
//
// There is no filled button on this page (spec §1.5): a setting applies
// the moment it is chosen. The deletion asks on a slip — a native modal
// dialog — for the typed word, and its act is the grave button, which ↵
// never presses.
//
// Kit v2: the page reads data.konto. The theme is actions.setTheme; every
// other choice sends its own actions.setPrefs patch. Nothing here claims a
// save, a sync or a deletion the kit does not confirm: a request that is
// sent is said as sent, and the bake-off's deletion is labelled a preview.

import { ArrowRight } from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { PrefsView } from '@/components/devbake/redesign/viewModel'
import { FolioPage, MarginBlock, Masthead } from './FolioHome'

/** The page's sections, and the margin's shortcuts, as places to go to. */
export type KontoPlace =
  | 'top'
  | 'du'
  | 'provet'
  | 'ovningen'
  | 'utseende'
  | 'data'
  | 'hjalp'
  | 'kortkommandon'

/** A request to show a place on the page: `n` makes a repeat a new one. */
export type KontoJump = { to: KontoPlace; n: number }

const SECTIONS: { id: Exclude<KontoPlace, 'top' | 'kortkommandon'>; title: string }[] = [
  { id: 'du', title: 'Du' },
  { id: 'provet', title: 'Provet' },
  { id: 'ovningen', title: 'Övningen' },
  { id: 'utseende', title: 'Utseende' },
  { id: 'data', title: 'Din data' },
  { id: 'hjalp', title: 'Hjälp' },
]

/** The word the deletion asks for, as the real app does (routes/konto.tsx);
 *  case and the spaces around it do not matter (spec screen 13). */
const DELETE_WORD = 'radera'

/** The app's one list of shortcuts, by where they work. */
const SHORTCUTS: { where: string; keys: [string, string][] }[] = [
  {
    where: 'Överallt',
    keys: [
      ['⌘B', 'fäll ihop eller ut menyn'],
      ['Esc', 'stäng en lapp eller gå tillbaka'],
    ],
  },
  {
    where: 'I en övning',
    keys: [
      ['A–E', 'välj ett alternativ'],
      ['⇧ + bokstav', 'stryk ett alternativ'],
      ['↵', 'svara, sedan nästa fråga'],
      ['F', 'styckefokus'],
      ['J / K', 'nästa och förra stycket'],
    ],
  },
  { where: 'I ett provpass', keys: [['← / →', 'förra och nästa fråga']] },
  {
    where: 'I Förstora',
    keys: [
      ['+ / −', 'zooma'],
      ['R', 'vrid sidan'],
    ],
  },
  { where: 'I Uppslag', keys: [['J / K', 'nästa och förra posten']] },
]

type Sent = 'sent' | 'failed' | null

/** Runs a host action and says how it went: sent, or failed when it
 *  throws. A return is a request sent, never a confirmed save. */
function attempt(run: () => void): Sent {
  try {
    run()
    return 'sent'
  } catch {
    return 'failed'
  }
}

/** Brings `el` to the top of its own scroll box (never the stage around
 *  it), for a place the reader asked for. */
function scrollToTop(el: HTMLElement | null): void {
  for (let n = el?.parentElement; n && el; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY
    if (y !== 'auto' && y !== 'scroll') continue
    if (typeof n.scrollTo !== 'function') return
    const top = el.getBoundingClientRect().top - n.getBoundingClientRect().top + n.scrollTop
    n.scrollTo({ top: Math.max(0, top - 24) })
    return
  }
}

export function FolioKonto({
  width,
  live,
  jump,
  onBack,
  backLabel,
}: {
  width: WidthKey
  live: boolean
  /** A place the reader asked for (an account-slip row), else none: on
   *  entry the page keeps its top and focus where they are. */
  jump: KontoJump | null
  /** Esc: back where the reader came from. */
  onBack: () => void
  /** Folio+: the name of the page Esc returns to, for the visible way back
   *  ("← Tillbaka till Öva"). Without it there is no button. */
  backLabel?: string
}) {
  const { data, actions } = useDirectionData()
  const k = data.konto
  const prefs = k.prefs
  const [deleting, setDeleting] = useState(false)
  const [exported, setExported] = useState<Sent>(null)
  // A choice whose save failed: its row says so (its value never moved).
  const [unsaved, setUnsaved] = useState<keyof PrefsView | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const phone = width === 'phone'

  const go = (to: KontoPlace) => {
    const root = pageRef.current
    const target =
      to === 'top'
        ? root?.querySelector<HTMLElement>('h1')
        : root?.querySelector<HTMLElement>(`#fp-kt-${to}`)
    scrollToTop(target ?? null)
    target?.focus({ preventScroll: true })
  }
  // Only a request moves the page: never its arrival on its own.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new request only
  useEffect(() => {
    if (jump && live) go(jump.to)
  }, [jump?.n])

  useKeyMap({ Escape: onBack }, live && !deleting)

  const choose = (key: keyof PrefsView, run: () => void) => {
    setUnsaved(attempt(run) === 'failed' ? key : null)
  }
  const exportNow = () => setExported(attempt(actions.exportData))

  const index = (
    <nav className="fp-kt-index" aria-label="På den här sidan">
      {SECTIONS.map((s, i) => (
        <span key={s.id}>
          {i > 0 ? (
            <span className="fp-kt-dot" aria-hidden>
              {' · '}
            </span>
          ) : null}
          <button type="button" className="fp-link" onClick={() => go(s.id)}>
            {s.title}
          </button>
        </span>
      ))}
    </nav>
  )

  const main = (
    <>
      {backLabel ? (
        <button type="button" className="fp-link fp-kt-back" data-fp-back onClick={onBack}>
          <span aria-hidden>← </span>Tillbaka till {backLabel}
        </button>
      ) : null}
      <h1 className="fp-greet" tabIndex={-1}>
        Ditt konto.
      </h1>
      <p className="fp-day">Ett val gäller så fort du gör det.</p>
      {phone ? index : null}

      <Part id="du" title="Du">
        <dl className="fp-kt-dl" data-testid="rd-konto-identity">
          <Value label="Namn" value={k.identity.name} />
          <Value label="E-post" value={k.identity.email} />
          {k.identity.plan ? <Value label="Plan" value={k.identity.plan} /> : null}
        </dl>
      </Part>

      <Part id="provet" title="Provet">
        <dl className="fp-kt-dl">
          <Value label="Provdatum" value={k.exam.label} />
        </dl>
        <p className="fp-kt-hint">Appen räknar mot nästa provtillfälle.</p>
      </Part>

      <Part id="ovningen" title="Övningen">
        <Choice
          legend="Frågeurval"
          options={[
            { key: 'smart', label: 'Smart' },
            { key: 'slumpat', label: 'Slumpat' },
          ]}
          value={prefs.smartDrill ? 'smart' : 'slumpat'}
          hint={prefs.smartDrill ? 'Frågor nära din nivå.' : 'Helt slumpade frågor.'}
          error={unsaved === 'smartDrill'}
          onPick={(v) =>
            choose('smartDrill', () => actions.setPrefs({ smartDrill: v === 'smart' }))
          }
        />
        <Choice
          legend="Coach"
          options={k.options.coach}
          value={prefs.coach}
          hint={k.options.coach.find((o) => o.key === prefs.coach)?.blurb}
          error={unsaved === 'coach'}
          testId={(key) => `rd-konto-coach-${key}`}
          onPick={(coach) => choose('coach', () => actions.setPrefs({ coach }))}
        />
      </Part>

      <Part id="utseende" title="Utseende">
        <Choice
          legend="Tema"
          options={k.options.mode}
          value={prefs.mode}
          error={unsaved === 'mode'}
          testId={(key) => `rd-konto-mode-${key}`}
          onPick={(mode) => choose('mode', () => actions.setTheme(mode))}
        />
        <Choice
          legend="Färg"
          options={k.options.palette}
          value={prefs.palette}
          hint="Papperets ton och accentfärgen, i ljust och mörkt."
          error={unsaved === 'palette'}
          swatches
          testId={(key) => `rd-konto-palette-${key}`}
          onPick={(palette) => choose('palette', () => actions.setPrefs({ palette }))}
        />
      </Part>

      <Part id="data" title="Din data">
        <p className="fp-kt-links">
          <button
            type="button"
            className="fp-link fp-kt-link"
            data-testid="rd-konto-export"
            onClick={exportNow}
          >
            Exportera min data
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </p>
        <p className="fp-kt-hint">En fil med allt du har gjort i appen.</p>
        <ExportStatus sent={exported} onRetry={exportNow} />
      </Part>

      <Part id="hjalp" title="Hjälp">
        {k.links.length ? (
          <p className="fp-kt-links">
            {k.links.map((l) => (
              <a key={l.href} className="fp-link fp-kt-link" href={l.href}>
                {l.label}
                <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
              </a>
            ))}
          </p>
        ) : null}
        <p className="fp-kt-hint">
          {phone ? 'Kortkommandona står längst ned på sidan.' : 'Kortkommandona står i marginalen.'}
        </p>
      </Part>

      {/* The account's end, behind the double rule, as on the slip. */}
      <div className="fp-kt-out">
        <button
          type="button"
          className="fp-quiet-btn"
          data-testid="rd-konto-signout"
          onClick={actions.signOut}
        >
          Logga ut
        </button>
        <button
          type="button"
          className="fp-link fp-kt-delete"
          data-testid="rd-konto-delete"
          aria-haspopup="dialog"
          onClick={() => setDeleting(true)}
        >
          Radera kontot
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </>
  )

  const aside = (
    <>
      {phone ? null : (
        <MarginBlock id="fp-kt-index-h" title="På den här sidan">
          {index}
        </MarginBlock>
      )}
      <section className="fp-aside-block" aria-labelledby="fp-kt-kortkommandon">
        <h2 className="fp-h3" id="fp-kt-kortkommandon" tabIndex={-1}>
          Kortkommandon
        </h2>
        {SHORTCUTS.map((g) => (
          <div key={g.where} className="fp-kt-keys">
            <h3 className="fp-kt-where">{g.where}</h3>
            <dl>
              {g.keys.map(([key, what]) => (
                <div key={key} className="fp-kt-key">
                  <dt>
                    <kbd className="fp-key">{key}</kbd>
                  </dt>
                  <dd>{what}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    </>
  )

  return (
    <div ref={pageRef} className="fp-kt">
      <FolioPage
        width={width}
        masthead={<Masthead label="Konto" />}
        aside={aside}
        asideLabelledBy={phone ? 'fp-kt-kortkommandon' : 'fp-kt-index-h'}
      >
        {main}
      </FolioPage>
      {deleting ? (
        <DeleteSlip
          onClose={() => setDeleting(false)}
          onExport={exportNow}
          exported={exported}
          live={live}
        />
      ) : null}
    </div>
  )
}

/** A section of the imprint page: a serif head under a hairline. Its head
 *  takes focus when the reader asks for the section. */
function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="fp-kt-part" aria-labelledby={`fp-kt-${id}`}>
      <h2 className="fp-h2 fp-kt-h" id={`fp-kt-${id}`} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** A definition row: the label, leader dots, the value. */
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="fp-kt-row">
      <dt>{label}</dt>
      <span className="fp-leader" aria-hidden />
      <dd>{value}</dd>
    </div>
  )
}

/** A word choice (`.fp-seg`): a fieldset with its legend, the words as
 *  pressed buttons, the chosen one underlined; its hint is visible and
 *  read with it. A failed save is said beside it. */
function Choice<K extends string>({
  legend,
  options,
  value,
  hint,
  error = false,
  testId,
  swatches = false,
  onPick,
}: {
  legend: string
  options: { key: K; label: string }[]
  value: K
  hint?: string
  error?: boolean
  testId?: (key: K) => string
  /** Färg: a small paper-and-accent chip before each word. */
  swatches?: boolean
  onPick: (key: K) => void
}) {
  const id = useId()
  return (
    <fieldset className="fp-kt-choice" aria-describedby={hint || error ? `${id}-hint` : undefined}>
      <legend className="fp-kt-label">{legend}</legend>
      <div className="fp-kt-value">
        <div className="fp-seg fp-seg--words fp-kt-seg">
          {options.map((o) => (
            <button
              type="button"
              key={o.key}
              aria-pressed={o.key === value}
              data-testid={testId?.(o.key)}
              onClick={() => onPick(o.key)}
            >
              {swatches ? <span className="fp-kt-swatch" data-swatch={o.key} aria-hidden /> : null}
              {o.label}
            </button>
          ))}
        </div>
        {hint || error ? (
          <p className="fp-kt-hint" id={`${id}-hint`}>
            {error ? (
              <span className="fp-kt-error" role="status">
                Det gick inte att spara – försök igen.
              </span>
            ) : (
              hint
            )}
          </p>
        ) : null}
      </div>
    </fieldset>
  )
}

function ExportStatus({ sent, onRetry }: { sent: Sent; onRetry: () => void }) {
  if (sent === 'failed') {
    return (
      <p className="fp-erratum fp-kt-status" role="status">
        Kunde inte exportera just nu. Försök igen om en stund.{' '}
        <button type="button" className="fp-link" onClick={onRetry}>
          Försök igen
        </button>
      </p>
    )
  }
  return (
    <p className="fp-kt-hint fp-kt-status" role="status">
      {sent === 'sent' ? 'Exporten är begärd.' : ''}
    </p>
  )
}

/**
 * The deletion slip (spec screen 13): a native modal dialog with the slip's
 * look. Today's warning and order; the act is the grave button, enabled by
 * the typed word, never pressed by ↵; Avbryt and Esc leave, and focus goes
 * back to Radera kontot. The dialog is closed before it unmounts, so the
 * opener gets its focus back. A press on the backdrop (outside the slip's
 * box) closes it too.
 */
function DeleteSlip({
  onClose,
  onExport,
  exported,
  live,
}: {
  onClose: () => void
  onExport: () => void
  exported: Sent
  live: boolean
}) {
  const { actions } = useDirectionData()
  const ref = useRef<HTMLDialogElement>(null)
  const fieldRef = useRef<HTMLInputElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const once = useRef(false)
  const [word, setWord] = useState('')
  const [sent, setSent] = useState<Sent>(null)
  const ids = useId()
  const armed = word.trim().toLocaleLowerCase('sv-SE') === DELETE_WORD

  useLayoutEffect(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const d = ref.current
    if (!d) return
    if (!d.open) d.showModal()
    // The top layer covers the window; the slip stands on Folio's own stage
    // (the bake-off's phone is a frame, not the window).
    const place = () => {
      const root = d.parentElement?.closest<HTMLElement>('[data-rd="folio-plus"]')
      const stage = root?.getBoundingClientRect()
      if (!root || !stage) return
      // Inside a zoomed frame (the bake-off zooms its phone) the slip's own
      // lengths are zoomed too: give them in the stage's own pixels.
      const zoom = root.offsetWidth > 0 ? stage.width / root.offsetWidth : 1
      const px = (n: number) => `${n / (zoom || 1)}px`
      d.style.setProperty('--fp-stage-x', px(stage.left))
      d.style.setProperty('--fp-stage-y', px(stage.top))
      d.style.setProperty('--fp-stage-w', px(stage.width))
      d.style.setProperty('--fp-stage-h', px(stage.height))
      d.style.setProperty('--fp-stage-b', px(Math.max(0, window.innerHeight - stage.bottom)))
    }
    place()
    window.addEventListener('resize', place)
    if (live) fieldRef.current?.focus({ preventScroll: true })
    return () => window.removeEventListener('resize', place)
  }, [live])

  const close = () => {
    ref.current?.close()
    opener.current?.focus({ preventScroll: true })
    onClose()
  }
  const confirm = () => {
    if (!armed || once.current) return
    once.current = true
    const result = attempt(actions.deleteAccount)
    // A refusal frees the act again: nothing was deleted.
    if (result === 'failed') once.current = false
    setSent(result)
  }
  // ↵ never presses the act: it takes a click, a tap, or Tab and space.
  const noEnter = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter') e.preventDefault()
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the backdrop's press only; Esc closes through the dialog's cancel
    <dialog
      ref={ref}
      className="fp-slip fp-kt-slip"
      aria-labelledby={`${ids}-h`}
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => {
        const d = ref.current
        if (!d || e.target !== d) return
        const r = d.getBoundingClientRect()
        const outside =
          e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
        if (outside) close()
      }}
    >
      <div className="fp-slip-head">
        <h2 className="fp-label" id={`${ids}-h`}>
          Radera konto
        </h2>
        <span className="fp-slip-meta">Förhandsvisning</span>
      </div>
      <p className="fp-slip-lede">
        Allt raderas direkt – konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom 30
        dagar. Det går inte att ångra.
      </p>
      <p className="fp-kt-slip-export">
        <button type="button" className="fp-link fp-kt-link" onClick={onExport}>
          Exportera min data först
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
        {exported === 'sent' ? <span className="fp-kt-hint"> Exporten är begärd.</span> : null}
        {exported === 'failed' ? (
          <span className="fp-kt-error"> Kunde inte exportera just nu.</span>
        ) : null}
      </p>
      <div className="fp-kt-word">
        <label className="fp-kt-word-label" htmlFor={`${ids}-word`}>
          Skriv ”{DELETE_WORD}” för att bekräfta.
        </label>
        <input
          ref={fieldRef}
          id={`${ids}-word`}
          className="fp-kt-field"
          data-testid="rd-konto-delete-word"
          value={word}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={`${ids}-why`}
          onChange={(e) => setWord(e.target.value)}
        />
      </div>
      <div className="fp-slip-actions">
        <button
          type="button"
          className="fp-btn fp-btn--grave"
          data-testid="rd-konto-delete-confirm"
          aria-disabled={!armed || sent === 'sent'}
          aria-describedby={`${ids}-why`}
          onClick={confirm}
          onKeyDown={noEnter}
        >
          Radera kontot permanent
        </button>
        <button type="button" className="fp-quiet-btn" onClick={close}>
          Avbryt
        </button>
      </div>
      <p className="fp-kt-hint fp-kt-why" id={`${ids}-why`} role="status">
        {sent === 'sent'
          ? 'Begäran om radering är skickad. I förhandsvisningen raderas ingenting.'
          : sent === 'failed'
            ? 'Kunde inte radera kontot. Inget raderades – försök igen.'
            : armed
              ? 'I förhandsvisningen raderas ingenting.'
              : `Skriv ”${DELETE_WORD}” för att aktivera knappen.`}
      </p>
    </dialog>
  )
}
