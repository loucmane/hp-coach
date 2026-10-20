// Samtal · Konto och inställningar — a short form in the coach's language,
// not a run of questions.
//
// The page opens with its date, as every conversation does, and one short
// coach turn: who is signed in, "Här ställer du in hur du vill öva." (spec)
// and that there is nothing to save — each choice is sent the moment it is
// made. Its one reply is the way back to the door the reader came from
// ("Tillbaka till Öva"; Enter takes it). Konto is no door of its own, and
// the account card is its one way in.
// Below a quiet line, the account as the coach's attachments, each a card
// with its own heading; the account card's rows lead to them:
//   - Ditt konto: the name and the whole e-mail (it wraps), the plan only
//     when the account has one, the exam and its days left;
//   - Inställningar: labelled groups of reply-shaped choices — Tema (light
//     or dark, the two modes the app keeps), Palett, Typsnitt, Täthet,
//     Coachens röst (with what the chosen voice is like) and Frågeurval.
//     The chosen one takes your tint, a solid plum line and a drawn check;
//     the filled plum stays the page's one reply. What is chosen is what
//     the account says, never a guess; a choice the host refuses says
//     "Kunde inte spara ändringen." in its own group, keeps what was asked
//     and offers a real retry. Palette, type and density are the app's own
//     look: Samtal keeps its colours and type here, and says so;
//   - Hjälp och villkor: the help and policy pages;
//   - Dina data: the export, signing out and — deepest — deleting the
//     account (spec §13: the app's own guarded flow). What it removes is
//     said first and the export offered before it; then the typed word
//     "radera", and a confirm that sends nothing until the word is right,
//     and only once. The flow says it is a preview, and a request is said
//     as a request, never as done.
// Arriving moves nothing: the frame keeps its focus and the page its place.
// A section the reader asked for from the account card takes focus and
// comes into view — only then.

import { ArrowRight, UserRound } from 'lucide-react'
import { type ReactNode, type RefObject, useEffect, useId, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  type ThemeKey,
  useKeyMap,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type { PrefOption, PrefsView } from '@/components/devbake/redesign/viewModel'
import { bringIntoView, Coach, count, Divider, isPromise, Kbd, Replies } from './SamtalParts'

/** The parts of Konto the account card's rows lead to. */
export type KontoSection = 'konto' | 'installningar' | 'hjalp'

/** A section asked for from the account card; `n` tells two asks for the
 *  same section apart. */
export type KontoAsk = { section: KontoSection; n: number }

/** The word the app's deletion asks for (routes/konto.tsx). */
const DELETE_WORD = 'radera'

/** The preferences a choice on this page changes. */
type PrefKey = 'mode' | 'palette' | 'font' | 'density' | 'coach' | 'smartDrill'

/** What a request ended in, as far as the page can tell. */
type Asked = 'asked' | 'failed' | null

/** Sends `action`, says it was asked, and hears a refusal — thrown at once
 *  or a promise that rejects. */
function request(action: () => unknown, set: (s: Asked) => void): void {
  set('asked')
  try {
    const done = action()
    if (isPromise(done)) done.catch(() => set('failed'))
  } catch {
    set('failed')
  }
}

export function SamtalKonto({
  width,
  live,
  theme,
  origin,
  ask,
  onAsked,
}: {
  width: WidthKey
  live: boolean
  /** The theme on display: the mode chosen. */
  theme: ThemeKey
  /** The door the reader came from. */
  origin: Destination
  ask: KontoAsk | null
  /** The ask has been met (or could not be). */
  onAsked: () => void
}) {
  const { data, actions } = useDirectionData()
  const k = data.konto
  const back = DESTINATIONS.find((d) => d.id === origin) ?? DESTINATIONS[0]
  const toOrigin = () => actions.go(back.id)
  useKeyMap({ Enter: toOrigin }, live)
  const leadId = useId()
  const heads: Record<KontoSection, RefObject<HTMLHeadingElement | null>> = {
    konto: useRef<HTMLHeadingElement>(null),
    installningar: useRef<HTMLHeadingElement>(null),
    hjalp: useRef<HTMLHeadingElement>(null),
  }
  // The section the reader asked for takes focus and comes into view.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on a new ask only
  useEffect(() => {
    if (!ask) return
    const el = heads[ask.section].current
    if (live && el) {
      el.focus({ preventScroll: true })
      bringIntoView(el)
    }
    onAsked()
  }, [ask])

  const name = k.identity.name.trim()
  return (
    <div className="sa-konto" data-width={width}>
      <Divider>{data.home.today.dateLabel}</Divider>

      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby={leadId}>
          <p className="sa-hello">
            {name ? (
              <>
                Inloggad som <b>{name}</b>.
              </>
            ) : (
              'Konto och inställningar.'
            )}
          </p>
          <h1 className="sa-lead-q" id={leadId} tabIndex={-1}>
            Här ställer du in hur du vill öva.
          </h1>
          <p className="sa-say sa-say--quiet">
            Varje val skickas när du gör det, så det finns ingen spara-knapp.
          </p>
        </Coach>
        <Replies>
          <button
            type="button"
            className="sa-chip sa-chip--primary sa-chip--big"
            onClick={toOrigin}
            data-testid="sa-konto-back"
          >
            Tillbaka till {back.label}
            <Kbd>↵</Kbd>
          </button>
        </Replies>
      </div>

      <div className="sa-later">
        <Divider quiet>Ditt konto och dina val</Divider>
        <div className="sa-cards">
          <Identity headRef={heads.konto} />
          <Preferences theme={theme} headRef={heads.installningar} />
          {k.links.length ? (
            <section className="sa-card sa-card--help" aria-labelledby={`${leadId}-help`}>
              <header className="sa-card-head">
                <h2 id={`${leadId}-help`} ref={heads.hjalp} tabIndex={-1}>
                  Hjälp och villkor
                </h2>
              </header>
              <ul className="sa-konto-links">
                {k.links.map((l) => (
                  <li key={l.href}>
                    <a className="sa-link" href={l.href}>
                      {l.label}
                      <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <YourData />
        </div>
      </div>
    </div>
  )
}

/** Who is signed in, as the account says it; what it lacks is said, never
 *  made up. */
function Identity({ headRef }: { headRef: RefObject<HTMLHeadingElement | null> }) {
  const { data } = useDirectionData()
  const { identity, exam } = data.konto
  const id = useId()
  return (
    <section className="sa-card sa-card--who" aria-labelledby={id} data-testid="rd-konto-identity">
      <header className="sa-card-head">
        <h2 id={id} ref={headRef} tabIndex={-1}>
          Ditt konto
        </h2>
      </header>
      <div className="sa-who">
        <span className="sa-avatar sa-avatar--xl" aria-hidden>
          {identity.initials.trim() || <UserRound size={22} strokeWidth={1.75} />}
        </span>
        <dl className="sa-facts">
          <div>
            <dt>Namn</dt>
            <dd>{identity.name.trim() || 'Inget namn i kontot'}</dd>
          </div>
          <div>
            <dt>E-post</dt>
            <dd className="sa-mail">{identity.email.trim() || 'Ingen e-post i kontot'}</dd>
          </div>
          {identity.plan ? (
            <div>
              <dt>Plan</dt>
              <dd>{identity.plan}</dd>
            </div>
          ) : null}
          <div>
            <dt>Provet</dt>
            <dd>
              {exam.label} · {count(exam.daysLeft, 'dag', 'dagar')} kvar
            </dd>
          </div>
        </dl>
      </div>
      <p className="sa-card-note">Lösenord och tvåfaktor hanteras via din inloggningsleverantör.</p>
    </section>
  )
}

const DRILL_CHOICES: PrefOption<'smart' | 'slumpat'>[] = [
  { key: 'smart', label: 'Smart', blurb: 'Frågor nära din nivå.' },
  { key: 'slumpat', label: 'Slumpat', blurb: 'Helt slumpade frågor.' },
]

/** The preferences as labelled groups of choices. The mode goes through
 *  setTheme (the theme on display); every other choice sends its own
 *  setPrefs patch. A refused choice is said where it was made. */
function Preferences({
  theme,
  headRef,
}: {
  theme: ThemeKey
  headRef: RefObject<HTMLHeadingElement | null>
}) {
  const { data, actions } = useDirectionData()
  const { prefs, options } = data.konto
  const id = useId()
  // A choice the host refused, by group: what was asked, kept for a retry.
  const [refused, setRefused] = useState<Partial<Record<PrefKey, string | boolean>>>({})
  const send = (key: PrefKey, value: string | boolean) => {
    setRefused(({ [key]: _gone, ...rest }) => rest)
    request(
      () =>
        key === 'mode'
          ? actions.setTheme(value as ThemeKey)
          : actions.setPrefs({ [key]: value } as Partial<PrefsView>),
      (s) => {
        if (s === 'failed') setRefused((r) => ({ ...r, [key]: value }))
      },
    )
  }
  const voice = options.coach.find((o) => o.key === prefs.coach)
  const smart = prefs.smartDrill ? 'smart' : 'slumpat'
  const refusedDrill = refused.smartDrill
  return (
    <section className="sa-card sa-card--prefs" aria-labelledby={id}>
      <header className="sa-card-head">
        <h2 id={id} ref={headRef} tabIndex={-1}>
          Inställningar
        </h2>
      </header>
      <h3 className="sa-pref-sub">Utseende</h3>
      <PrefGroup
        legend="Tema"
        testId="mode"
        options={options.mode}
        value={theme}
        refused={refused.mode as ThemeKey | undefined}
        onPick={(v) => send('mode', v)}
      />
      <PrefGroup
        legend="Palett"
        testId="palette"
        options={options.palette}
        value={prefs.palette}
        refused={refused.palette as PrefsView['palette'] | undefined}
        onPick={(v) => send('palette', v)}
      />
      <PrefGroup
        legend="Typsnitt"
        testId="font"
        options={options.font}
        value={prefs.font}
        refused={refused.font as PrefsView['font'] | undefined}
        onPick={(v) => send('font', v)}
      />
      <PrefGroup
        legend="Täthet"
        testId="density"
        options={options.density}
        value={prefs.density}
        refused={refused.density as PrefsView['density'] | undefined}
        onPick={(v) => send('density', v)}
      />
      <p className="sa-pref-aside">
        Palett, typsnitt och täthet gäller appens vanliga utseende. Samtal behåller sina egna färger
        och typsnitt här.
      </p>
      <h3 className="sa-pref-sub">Övning</h3>
      <PrefGroup
        legend="Coachens röst"
        testId="coach"
        options={options.coach}
        value={prefs.coach}
        refused={refused.coach as PrefsView['coach'] | undefined}
        onPick={(v) => send('coach', v)}
        note={voice?.blurb}
      />
      <PrefGroup
        legend="Frågeurval"
        options={DRILL_CHOICES}
        value={smart}
        refused={refusedDrill == null ? undefined : refusedDrill ? 'smart' : 'slumpat'}
        onPick={(v) => send('smartDrill', v === 'smart')}
        note={DRILL_CHOICES.find((o) => o.key === smart)?.blurb}
      />
    </section>
  )
}

/** One preference: a legend and its choices as replies, the chosen one
 *  pressed. Without choices to offer, the group is left out. */
function PrefGroup<K extends string>({
  legend,
  options,
  value,
  onPick,
  note,
  refused,
  testId,
}: {
  legend: string
  options: PrefOption<K>[]
  value: K
  onPick: (key: K) => void
  /** A line under the choices: what the chosen one does. */
  note?: ReactNode
  /** The choice the host refused, kept for a retry. */
  refused?: K
  /** The contract's group in rd-konto-<group>-<key>. */
  testId?: string
}) {
  if (!options.length) return null
  const asked = refused != null ? options.find((o) => o.key === refused) : undefined
  return (
    <fieldset className="sa-pref">
      <legend className="sa-pref-legend">{legend}</legend>
      <div className="sa-pref-opts">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            className="sa-pick"
            aria-pressed={value === o.key}
            data-testid={testId ? `rd-konto-${testId}-${o.key}` : undefined}
            onClick={() => onPick(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {note ? <p className="sa-pref-note">{note}</p> : null}
      {refused != null ? (
        <p className="sa-pref-fail" role="alert">
          <span>Kunde inte spara ändringen.</span>{' '}
          <button type="button" className="sa-link" onClick={() => onPick(refused)}>
            Försök igen{asked ? `: ${asked.label}` : ''}
          </button>
        </p>
      ) : null}
    </fieldset>
  )
}

/** The export, signing out and, deepest, the deletion. Each says what was
 *  asked; none claims more than the host answers. */
function YourData() {
  const { actions } = useDirectionData()
  const id = useId()
  const [exported, setExported] = useState<Asked>(null)
  const [signedOut, setSignedOut] = useState<Asked>(null)
  const exportData = () => request(() => actions.exportData(), setExported)
  return (
    <section className="sa-card sa-card--data" aria-labelledby={id}>
      <header className="sa-card-head">
        <h2 id={id}>Dina data</h2>
      </header>
      <div className="sa-data-row">
        <p className="sa-data-say">En fil med allt HP-Coach har sparat om dig.</p>
        <button
          type="button"
          className="sa-chip"
          data-testid="rd-konto-export"
          onClick={exportData}
        >
          Exportera mina data
        </button>
      </div>
      <p className="sa-data-status" role="status">
        {exported === 'asked'
          ? 'Export begärd.'
          : exported === 'failed'
            ? 'Kunde inte exportera just nu. Försök igen om en stund.'
            : null}
      </p>
      <div className="sa-data-row">
        <p className="sa-data-say">Logga ut från HP-Coach.</p>
        <button
          type="button"
          className="sa-chip"
          data-testid="rd-konto-signout"
          onClick={() => request(() => actions.signOut(), setSignedOut)}
        >
          Logga ut
        </button>
      </div>
      <p className="sa-data-status" role="status">
        {signedOut === 'asked'
          ? 'Utloggning begärd.'
          : signedOut === 'failed'
            ? 'Kunde inte logga ut just nu.'
            : null}
      </p>
      <DeleteAccount onExport={exportData} exported={exported} />
    </section>
  )
}

/** The app's deletion, kept deep and guarded (spec §13): what is removed is
 *  said first; opened, the flow offers the export again, asks for the
 *  typed word and sends the request once — only with the word right. It is
 *  labelled a preview (the bake-off deletes nothing), and a sent request is
 *  said as sent, never as a deletion under way. A refusal says that
 *  nothing was deleted and may be tried again. */
function DeleteAccount({ onExport, exported }: { onExport: () => void; exported: Asked }) {
  const { actions } = useDirectionData()
  const flowId = useId()
  const wordId = useId()
  const statusId = useId()
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [early, setEarly] = useState(false)
  const [sent, setSent] = useState<Asked>(null)
  const once = useRef(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const armed = word === DELETE_WORD
  const confirm = () => {
    if (!armed) {
      setEarly(true)
      return
    }
    if (once.current) return
    once.current = true
    request(
      () => actions.deleteAccount(),
      (s) => {
        // A refusal frees the confirm again: nothing was deleted.
        if (s === 'failed') once.current = false
        setSent(s)
      },
    )
  }
  const cancel = () => {
    setOpen(false)
    setWord('')
    setEarly(false)
    toggle.current?.focus()
  }
  const status = early
    ? `Skriv ${DELETE_WORD} först.`
    : sent === 'asked'
      ? 'Begäran om radering skickad. I förhandsvisningen raderas ingenting.'
      : sent === 'failed'
        ? 'Kunde inte radera kontot. Inget raderades — försök igen.'
        : null
  return (
    <div className="sa-delete">
      <h3 className="sa-delete-h">Radera konto</h3>
      <p className="sa-delete-say">
        Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom 30
        dagar. Det går inte att ångra.
      </p>
      <button
        ref={toggle}
        type="button"
        className="sa-danger sa-danger--quiet"
        data-testid="rd-konto-delete"
        aria-expanded={open}
        aria-controls={flowId}
        onClick={() => setOpen((o) => !o)}
      >
        Radera kontot …
      </button>
      {open ? (
        <div className="sa-delete-flow" id={flowId}>
          <p className="sa-preview-tag">Förhandsvisning – här raderas ingenting.</p>
          <p className="sa-delete-say">
            Vill du ha kvar dina data, exportera dem först.{' '}
            <button type="button" className="sa-link" onClick={onExport}>
              Exportera mina data
            </button>
            {exported === 'asked' ? <span className="sa-delete-done"> Begärd.</span> : null}
          </p>
          <label className="sa-word-label" htmlFor={wordId}>
            Skriv <b>{DELETE_WORD}</b> för att bekräfta.
          </label>
          <input
            id={wordId}
            className="sa-word"
            data-testid="rd-konto-delete-word"
            value={word}
            onChange={(e) => {
              setWord(e.target.value)
              setEarly(false)
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={statusId}
          />
          <div className="sa-delete-acts">
            <button type="button" className="sa-quiet" onClick={cancel}>
              Avbryt
            </button>
            <button
              type="button"
              className="sa-danger"
              data-testid="rd-konto-delete-confirm"
              aria-disabled={!armed || sent === 'asked'}
              aria-describedby={statusId}
              onClick={confirm}
            >
              Radera kontot permanent
            </button>
          </div>
          <p className="sa-delete-status" id={statusId} role="status">
            {status}
          </p>
        </div>
      ) : null}
    </div>
  )
}
