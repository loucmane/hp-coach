// Svep · Konto och inställningar — the account card dealt open from the
// avatar and expanded into the same indexed stock: a small deck of three
// cards on the neutral table. Konto (who is signed in and the theme, with
// the one way back to where you were), Inställningar (palette, typeface,
// density, coach and question selection, each a direct choice) and Hjälp
// (Svep's keys and the support and legal pages). The register names the
// three; the account's details lie farther down the table in the real
// page's order — the sign-in, the plan, then your data: export first and
// deletion last, deep on the page, after the typed word.
//
// Desktop: the page and the exam to the left, the deck in the middle with
// the details under it, the register to the right. Phone: one column — the
// three cards as tabs over the deck, then the details.
//
// Kit v2: everything is data.konto. The theme asks actions.setTheme; every
// other preference sends its own setPrefs patch; a choice shows what the
// data then says, never a save the kit has not confirmed. Export and
// deletion are requests with no answer in the kit: the screen says what it
// asked for and claims nothing more, and its deletion is labelled a
// preview. The deck moves by its register, tabs and arrows, not by ←/→
// (they stay the bake-off's here, on a card of choices) and not by a swipe
// (the cards hold controls).

import { ArrowUpRight } from 'lucide-react'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  DirectionActions,
  KontoView,
  PrefOption,
  PrefsView,
} from '@/components/devbake/redesign/viewModel'
import { useDeck } from './deck'
import { type DeckCard, DeckCounter, DeckRegister, DeckStage, Kbd } from './parts'
import type { KontoAsk, KontoReturn } from './Svep'

/** Konto's three cards. */
export type KontoCardId = 'konto' | 'installningar' | 'hjalp'

/** The detail sections farther down the table. */
type DetailId = 'inloggning' | 'plan' | 'data'

/** The word the real app's deletion asks for (routes/konto.tsx). */
const DELETE_WORD = 'radera'

/** The choices a preference group offers, by the preference it sets. */
type ChoiceKey = 'palette' | 'font' | 'density' | 'coach'

const CHOICE_NAME: Record<ChoiceKey, string> = {
  palette: 'Palett',
  font: 'Typsnitt',
  density: 'Täthet',
  coach: 'Coach',
}

type KontoCard = DeckCard & { id: KontoCardId }

export function SvepKonto({
  width,
  live,
  ask,
  back,
}: {
  width: WidthKey
  live: boolean
  /** The card an account-card row asked for; null when Konto was reached
   *  another way (the focus and the scroll then stay where they are). */
  ask: KontoAsk | null
  /** The one way back: to the page Konto was asked from. */
  back: KontoReturn
}) {
  const { data, actions } = useDirectionData()
  const k = data.konto
  const phone = width === 'phone'
  const kontoHead = useId()
  const settingsHead = useId()
  const helpHead = useId()
  const heads = useMemo<Record<KontoCardId, string>>(
    () => ({ konto: kontoHead, installningar: settingsHead, hjalp: helpHead }),
    [kontoHead, settingsHead, helpHead],
  )
  const detailHeads: Record<DetailId, string> = {
    inloggning: useId(),
    plan: useId(),
    data: useId(),
  }
  // What a choice said last, for the polite announcement (one at a time).
  const [said, setSaid] = useState<string | null>(null)
  const cards = useMemo<KontoCard[]>(
    () => kontoCards({ k, actions, back, heads, phone, onSaid: setSaid }),
    [k, actions, back, heads, phone],
  )
  const deck = useDeck(cards)

  // Asked for a card (an account-card row): that card in front, its heading
  // focused and in view. Two steps, since a card turns reachable (no longer
  // inert) only once it is in front.
  const focusNext = useRef<KontoCardId | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: each new ask, once
  useLayoutEffect(() => {
    if (!ask) return
    focusNext.current = ask.card
    deck.go(cards.findIndex((c) => c.id === ask.card))
  }, [ask?.n])
  useLayoutEffect(() => {
    const want = focusNext.current
    if (!want || cards[deck.index]?.id !== want) return
    focusNext.current = null
    const head = document.getElementById(heads[want])
    head?.focus({ preventScroll: true })
    head?.scrollIntoView?.({ block: 'nearest' })
  })

  /** A detail farther down, brought into view with its heading focused. */
  const toDetail = (id: DetailId) => {
    const head = document.getElementById(detailHeads[id])
    head?.focus({ preventScroll: true })
    head?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
  }

  const stage = (
    <DeckStage
      deck={deck}
      cards={cards}
      label={`Konto, ${cards.length} kort`}
      kind="konto"
      live={live}
      swipe={false}
    />
  )
  const details = <KontoDetails k={k} actions={actions} heads={detailHeads} />
  const announce = (
    <p className="sv-sr" aria-live="polite">
      {said ?? ''}
    </p>
  )

  if (phone) {
    const front = cards[deck.index]
    return (
      <div className="sv-ptri sv-pko">
        <header className="sv-ptri-head">
          <h1 className="sv-greet">Konto och inställningar</h1>
          <p className="sv-day">
            {k.exam.daysLeft} dagar kvar till {k.exam.label}
          </p>
        </header>
        <fieldset className="sv-seg sv-ko-tabs">
          <legend className="sv-sr">Visa kortet</legend>
          {cards.map((c, i) => (
            <button
              type="button"
              key={c.id}
              aria-pressed={front?.id === c.id}
              onClick={() => deck.go(i)}
            >
              {c.label}
            </button>
          ))}
        </fieldset>
        <div className="sv-ptri-deck">{stage}</div>
        <div className="sv-phome-foot">
          <DeckCounter deck={deck} cards={cards} arrows={false} />
        </div>
        {details}
        {announce}
      </div>
    )
  }

  return (
    <div className="sv-tri sv-ko">
      <aside className="sv-tri-side" aria-label="Konto och inställningar">
        <h1 className="sv-greet">Konto och inställningar</h1>
        <p className="sv-day">
          Ett kort för kontot, ett för inställningarna och ett för hjälpen. Uppgifterna om kontot
          ligger längre ned.
        </p>
        <p className="sv-countdown">
          <span className="sv-countdown-n">{k.exam.daysLeft}</span>
          <span>
            dagar kvar till
            <br />
            {k.exam.label}
          </span>
        </p>
      </aside>
      <div className="sv-ko-center">
        <div className="sv-ko-deck">
          {stage}
          <DeckCounter deck={deck} cards={cards} />
        </div>
        {details}
      </div>
      <div className="sv-tri-end">
        <DeckRegister
          deck={deck}
          cards={cards}
          label="Kontots kort"
          head={
            <>
              Kontot <span>· {cards.length} kort</span>
            </>
          }
        />
        <nav className="sv-index sv-tri-register sv-ko-below" aria-label="Längre ned på sidan">
          <p className="sv-index-group">Längre ned</p>
          <ol>
            {(
              [
                ['inloggning', 'Inloggning'],
                ['plan', 'Plan och betalning'],
                ['data', 'Dina data'],
              ] as const
            ).map(([id, label]) => (
              <li key={id}>
                <button type="button" className="sv-index-row" onClick={() => toDetail(id)}>
                  <span className="sv-index-n" aria-hidden>
                    ↓
                  </span>
                  <span className="sv-index-name">{label}</span>
                  <span className="sv-index-meta" />
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {announce}
      </div>
    </div>
  )
}

// ── The cards ────────────────────────────────────────────────────────

function kontoCards({
  k,
  actions,
  back,
  heads,
  phone,
  onSaid,
}: {
  k: KontoView
  actions: DirectionActions
  back: KontoReturn
  heads: Record<KontoCardId, string>
  phone: boolean
  onSaid: (text: string) => void
}): KontoCard[] {
  const foot = (
    <div className="sv-hc-foot">
      <button
        type="button"
        className="sv-btn sv-btn--primary sv-btn--block sv-btn--lg"
        onClick={back.go}
      >
        {back.label}
      </button>
    </div>
  )
  const label = (key: ChoiceKey) =>
    k.options[key].find((o) => o.key === k.prefs[key])?.label ?? String(k.prefs[key])
  return [
    {
      id: 'konto',
      label: 'Konto',
      tint: 'none',
      meta: k.identity.initials || undefined,
      body: (
        <>
          <AccountCardBody k={k} actions={actions} headId={heads.konto} onSaid={onSaid} />
          {foot}
        </>
      ),
    },
    {
      id: 'installningar',
      label: 'Inställningar',
      tint: 'none',
      meta: label('palette'),
      metaSaid: `palett ${label('palette')}`,
      body: (
        <>
          <SettingsCardBody k={k} actions={actions} headId={heads.installningar} onSaid={onSaid} />
          {foot}
        </>
      ),
    },
    {
      id: 'hjalp',
      label: 'Hjälp',
      tint: 'none',
      meta: k.links.length ? `${k.links.length} länkar` : undefined,
      body: (
        <>
          <HelpCardBody links={k.links} headId={heads.hjalp} phone={phone} />
          {foot}
        </>
      ),
    },
  ]
}

/** Who is signed in, in full (the address is never cut short), and the
 *  theme. The avatar here is a picture, not another way in. */
function AccountCardBody({
  k,
  actions,
  headId,
  onSaid,
}: {
  k: KontoView
  actions: DirectionActions
  headId: string
  onSaid: (text: string) => void
}) {
  const { name, email, initials, plan } = k.identity
  const who = name || email
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Konto · inloggad som</span>
      </div>
      <div className="sv-hc-body sv-ko-body">
        <div className="sv-ko-who" data-testid="rd-konto-identity">
          <span className="sv-ko-avatar" aria-hidden>
            {initials}
          </span>
          {who ? (
            <div className="sv-ko-who-text">
              <h2 className="sv-ko-name" id={headId} tabIndex={-1}>
                {who}
              </h2>
              {name && email ? <p className="sv-ko-email">{email}</p> : null}
              {plan ? <p className="sv-ko-plan">{plan}</p> : null}
            </div>
          ) : (
            <h2 className="sv-ko-name" id={headId} tabIndex={-1}>
              Du är inte inloggad
            </h2>
          )}
        </div>
        <Choices
          name="Tema"
          options={k.options.mode}
          current={k.prefs.mode}
          testId={(key) => `rd-konto-mode-${key}`}
          onPick={(o) => {
            actions.setTheme(o.key)
            onSaid(`Tema: ${o.label}`)
          }}
        />
      </div>
    </>
  )
}

/** Every preference as a direct choice: pressing one sets it, and the
 *  pressed state is what the data says. */
function SettingsCardBody({
  k,
  actions,
  headId,
  onSaid,
}: {
  k: KontoView
  actions: DirectionActions
  headId: string
  onSaid: (text: string) => void
}) {
  const choice = <Key extends ChoiceKey>(key: Key, options: PrefOption<PrefsView[Key]>[]) => (
    <Choices
      name={CHOICE_NAME[key]}
      options={options}
      current={k.prefs[key]}
      testId={(o) => `rd-konto-${key}-${o}`}
      wide={key === 'coach'}
      onPick={(o) => {
        actions.setPrefs({ [key]: o.key } as Partial<PrefsView>)
        onSaid(`${CHOICE_NAME[key]}: ${o.label}`)
      }}
    />
  )
  const smart = k.prefs.smartDrill
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Inställningar</span>
      </div>
      <div className="sv-hc-body sv-ko-body">
        <h2 className="sv-ko-title" id={headId} tabIndex={-1}>
          Så ser HP-Coach ut för dig
        </h2>
        {choice('palette', k.options.palette)}
        {choice('coach', k.options.coach)}
        <Choices
          name="Urval"
          options={[
            { key: 'smart', label: 'Smart' },
            { key: 'slumpat', label: 'Slumpat' },
          ]}
          current={smart ? 'smart' : 'slumpat'}
          testId={(key) => `sv-konto-urval-${key}`}
          hint={smart ? 'Frågor nära din nivå.' : 'Helt slumpade frågor.'}
          onPick={(o) => {
            actions.setPrefs({ smartDrill: o.key === 'smart' })
            onSaid(`Urval: ${o.label}`)
          }}
        />
        <h3 className="sv-ko-sub">Finjustering</h3>
        {choice('font', k.options.font)}
        {choice('density', k.options.density)}
      </div>
    </>
  )
}

/** One preference: a labelled group of buttons, the current one pressed. A
 *  coach's blurb says what each voice is. */
function Choices<K extends string>({
  name,
  options,
  current,
  testId,
  onPick,
  hint,
  wide,
}: {
  name: string
  options: PrefOption<K>[]
  current: K
  testId: (key: K) => string
  onPick: (option: PrefOption<K>) => void
  /** A line under the choices about the current one. */
  hint?: string
  /** One choice a row, each with its blurb. */
  wide?: boolean
}) {
  return (
    <fieldset className="sv-ko-field">
      <legend className="sv-ko-label">{name}</legend>
      <div className="sv-ko-choices" data-wide={wide ? 'true' : undefined}>
        {options.map((o) => (
          <button
            type="button"
            key={o.key}
            className="sv-ko-choice"
            data-testid={testId(o.key)}
            aria-pressed={o.key === current}
            onClick={() => onPick(o)}
          >
            <span className="sv-ko-choice-name">{o.label}</span>
            {wide && o.blurb ? <span className="sv-ko-choice-blurb">{o.blurb}</span> : null}
          </button>
        ))}
      </div>
      {hint ? <p className="sv-ko-hint">{hint}</p> : null}
    </fieldset>
  )
}

/** Svep's keys (or, on a phone, its moves) and the support and legal pages,
 *  which open beside the bake-off. */
function HelpCardBody({
  links,
  headId,
  phone,
}: {
  links: KontoView['links']
  headId: string
  phone: boolean
}) {
  const keys: [ReactNode, string][] = phone
    ? [
        ['Svep åt sidan', 'Bläddrar i en lek'],
        ['Till frågan', 'Lyfter frågekortet över texten'],
        ['Till texten', 'Lägger ned det igen, texten där du var'],
      ]
    : [
        [
          <>
            <Kbd>←</Kbd> <Kbd>→</Kbd>
          </>,
          'Bläddrar i en lek; vid lekens ände går de vidare',
        ],
        [<Kbd key="enter">↵</Kbd>, 'Tar kortet framför dig, svarar, går vidare'],
        [
          <>
            <Kbd>A</Kbd>–<Kbd>E</Kbd>
          </>,
          'Väljer ett svarsalternativ',
        ],
        [
          <>
            <Kbd>⇧</Kbd> + bokstav
          </>,
          'Stryker ett alternativ',
        ],
        [
          <>
            <Kbd>F</Kbd> <Kbd>J</Kbd> <Kbd>K</Kbd>
          </>,
          'Styckefokus i en text',
        ],
        [<Kbd key="esc">Esc</Kbd>, 'Släpper styckefokus – lämnar aldrig en övning'],
      ]
  return (
    <>
      <div className="sv-hc-top">
        <span className="sv-hc-eyebrow">Hjälp</span>
      </div>
      <div className="sv-hc-body sv-ko-body">
        <h2 className="sv-ko-title" id={headId} tabIndex={-1}>
          {phone ? 'Så rör du korten' : 'Kortkommandon'}
        </h2>
        <dl className="sv-ko-keys">
          {keys.map(([key, what]) => (
            <div key={what} className="sv-ko-key">
              <dt>{key}</dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
        {links.length ? (
          <ul className="sv-ko-links" aria-label="Support och villkor">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="sv-ko-link">
                  {l.label}
                  <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
                  <span className="sv-sr"> (öppnas i en ny flik)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  )
}

// ── Farther down the table ───────────────────────────────────────────

/** The account's details in the real page's order: the sign-in, the plan,
 *  then your data — export above the destructive control, and deletion
 *  last. Nothing here is in the register's deck, the account card or the
 *  main action. */
function KontoDetails({
  k,
  actions,
  heads,
}: {
  k: KontoView
  actions: DirectionActions
  heads: Record<DetailId, string>
}) {
  const sectionId = useId()
  const [exported, setExported] = useState(false)
  return (
    <section className="sv-ko-details" aria-labelledby={sectionId}>
      <h2 className="sv-ko-details-head" id={sectionId}>
        Kontouppgifter
      </h2>
      <div className="sv-card sv-ko-detail">
        <h3 className="sv-ko-detail-title" id={heads.inloggning} tabIndex={-1}>
          Inloggning
        </h3>
        <p className="sv-ko-detail-text">
          Hanteras via din inloggningsleverantör. Logga ut och in igen för att byta metod.
        </p>
        <button
          type="button"
          className="sv-btn sv-btn--tonal"
          data-testid="rd-konto-signout"
          onClick={actions.signOut}
        >
          Logga ut
        </button>
      </div>
      <div className="sv-card sv-ko-detail">
        <h3 className="sv-ko-detail-title" id={heads.plan} tabIndex={-1}>
          Plan och betalning
        </h3>
        <p className="sv-ko-detail-text">
          {k.identity.plan
            ? `Din plan: ${k.identity.plan}.`
            : 'Kommer när HP-Coach går från gratis dogfood till betald tjänst — inget att göra här ännu.'}
        </p>
      </div>
      <div className="sv-card sv-ko-detail">
        <h3 className="sv-ko-detail-title" id={heads.data} tabIndex={-1}>
          Dina data
        </h3>
        <p className="sv-ko-detail-text">
          En kopia av allt du har gjort i HP-Coach: försök, missar och resultat.
        </p>
        <button
          type="button"
          className="sv-btn sv-btn--tonal"
          data-testid="rd-konto-export"
          onClick={() => {
            actions.exportData()
            setExported(true)
          }}
        >
          Exportera min data
        </button>
        <p className="sv-ko-status" role="status">
          {exported ? 'Exporten är begärd. Förhandsvisningen skapar ingen fil.' : ''}
        </p>
        <DeleteAccount onDelete={actions.deleteAccount} />
      </div>
    </section>
  )
}

/**
 * Deletion, deep on the page: it opens on its own button, asks for the
 * exact word and only then can be pressed. Esc or Avbryt closes it and
 * hands the focus back to the button that opened it; neither Esc nor Enter
 * outside the button ever deletes. The kit gives no answer to a deletion,
 * so the bake-off's is labelled a preview and never claims a result.
 */
function DeleteAccount({ onDelete }: { onDelete: () => void }) {
  const titleId = useId()
  const wordId = useId()
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [asked, setAsked] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const armed = word === DELETE_WORD
  // Opened by the reader: the focus goes to the word.
  useLayoutEffect(() => {
    if (open) input.current?.focus()
  }, [open])
  const close = () => {
    setOpen(false)
    setWord('')
    setAsked(false)
    // Back to what opened it, once it is there again.
    window.requestAnimationFrame(() => opener.current?.focus())
  }
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Escape') return
    e.preventDefault()
    e.stopPropagation()
    close()
  }
  return (
    <div className="sv-ko-delete">
      <h3 className="sv-ko-detail-title" id={titleId}>
        Radera konto <span className="sv-badge">Förhandsvisning</span>
      </h3>
      <p className="sv-ko-detail-text">
        Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom 30
        dagar. Det går inte att ångra.
      </p>
      {open ? (
        // biome-ignore lint/a11y/noStaticElementInteractions: Esc closes the confirmation from any of its controls
        <div className="sv-ko-confirm" onKeyDown={onKeyDown}>
          <label className="sv-ko-word-label" htmlFor={wordId}>
            Skriv <b>{DELETE_WORD}</b> för att bekräfta.
          </label>
          <input
            ref={input}
            id={wordId}
            className="sv-ko-word"
            data-testid="rd-konto-delete-word"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <div className="sv-ko-confirm-actions">
            <button
              type="button"
              className="sv-btn sv-btn--danger"
              data-testid="rd-konto-delete-confirm"
              disabled={!armed}
              onClick={() => {
                if (!armed) return
                onDelete()
                setAsked(true)
              }}
            >
              Radera kontot permanent
            </button>
            <button type="button" className="sv-btn sv-btn--quiet" onClick={close}>
              Avbryt
            </button>
          </div>
          <p className="sv-ko-status" role="status">
            {asked ? 'Det här är en förhandsvisning: inget har raderats.' : ''}
          </p>
        </div>
      ) : (
        <button
          ref={opener}
          type="button"
          className="sv-btn sv-btn--quiet"
          data-testid="rd-konto-delete"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          Radera konto …
        </button>
      )}
    </div>
  )
}
